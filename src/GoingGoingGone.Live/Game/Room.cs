namespace GoingGoingGone.Live.Game;

public enum Phase { Lobby, Idle, Open, Going1, Going2, Sold, Ended }

public sealed class Player
{
    public required string Id { get; init; }
    public required string Name { get; init; }
    public required string Color { get; init; }
    public bool IsBot { get; init; }
    /// <summary>Bots bid up to WorthTo × Nerve.</summary>
    public double Nerve { get; init; } = 1;
    public int Cash { get; set; } = Rules.StartingCash;
    public List<string> Cards { get; } = [];
    public string? ConnectionId { get; set; }
    public bool Connected => IsBot || ConnectionId is not null;
}

public sealed record Bid(string PlayerId, int Amount);
public sealed record GameEvent(int Seq, string Type, string? PlayerId, int? Amount, string Text);

/// <summary>
/// One auction room. Not thread-safe by itself: every caller must hold <see cref="Gate"/>.
/// </summary>
public sealed class Room(string code, string hostKey, Catalog catalog, Random rng)
{
    private static readonly string[] Colors =
        ["#f2a48f", "#9fcf8f", "#9cc8e8", "#f4d150", "#c9b6e8", "#f0b07a",
         "#e85a8a", "#6cc4b4", "#d8b48a", "#8fb0e8", "#bcd88f", "#f3c9c1"];

    public object Gate { get; } = new();
    public string Code { get; } = code;
    public string HostKey { get; } = hostKey;
    public Phase Phase { get; set; } = Phase.Lobby;
    public List<Player> Players { get; } = [];
    public List<string> Deck { get; } = [];
    public Artwork? Lot { get; private set; }
    public List<Bid> Bids { get; } = [];
    public List<GameEvent> Events { get; } = [];
    public bool AutoCall { get; set; }
    public DateTimeOffset LastBidAt { get; private set; }
    public DateTimeOffset? StepEndsAt { get; set; }
    public CancellationTokenSource? GoingCts { get; set; }
    public (string? PlayerId, int Amount, string ArtworkId, string Note)? LastSale { get; private set; }
    public DateTimeOffset LastActivity { get; private set; } = DateTimeOffset.UtcNow;
    private int _seq;

    public Bid? High => Bids.Count > 0 ? Bids[^1] : null;
    public bool Bidding => Phase is Phase.Open or Phase.Going1 or Phase.Going2;
    public Player? Find(string id) => Players.Find(p => p.Id == id);
    public IEnumerable<Artwork> CardsOf(Player p) => p.Cards.Select(id => catalog[id]);

    private void Log(string type, string? playerId, int? amount, string text)
    {
        Events.Add(new GameEvent(++_seq, type, playerId, amount, text));
        if (Events.Count > 40) Events.RemoveAt(0);
        LastActivity = DateTimeOffset.UtcNow;
    }

    public Player AddPlayer(string name, bool bot = false, double nerve = 1)
    {
        var unique = name;
        for (var n = 2; Players.Any(p => p.Name.Equals(unique, StringComparison.OrdinalIgnoreCase)); n++) unique = $"{name} {n}";
        var p = new Player
        {
            Id = Guid.NewGuid().ToString("N")[..16], Name = unique,
            Color = Colors[Players.Count % Colors.Length], IsBot = bot, Nerve = nerve,
        };
        Players.Add(p);
        if (Phase != Phase.Lobby) Deal(p);
        Log("join", p.Id, null, $"{p.Name} joined");
        return p;
    }

    private void Deal(Player p)
    {
        for (var i = 0; i < Rules.StartingCards && Deck.Count > 0; i++) { p.Cards.Add(Deck[0]); Deck.RemoveAt(0); }
    }

    public void Start()
    {
        if (Phase != Phase.Lobby) return;
        Deck.Clear();
        Deck.AddRange(catalog.All.Select(a => a.Id).OrderBy(_ => rng.Next()));
        foreach (var p in Players) Deal(p);
        Phase = Phase.Idle;
        Log("start", null, null, "Everyone has $1.5B and 3 artworks. Let the auctions begin!");
    }

    public bool OpenNext()
    {
        if (Phase is not (Phase.Idle or Phase.Sold)) return false;
        if (Deck.Count == 0) { Phase = Phase.Ended; Log("end", null, null, "The deck is empty. Game over!"); return false; }
        Lot = catalog[Deck[0]];
        Deck.RemoveAt(0);
        Bids.Clear();
        LastSale = null;
        Phase = Phase.Open;
        LastBidAt = DateTimeOffset.UtcNow;
        Log("open", null, Lot.Reserve, $"New lot: {Lot.Title}. Opens at {Rules.Money(Lot.Reserve)}");
        return true;
    }

    /// <summary>Returns null on success, or the reason the bid was refused.</summary>
    public string? PlaceBid(string playerId, int raise)
    {
        var p = Find(playerId);
        if (p is null) return "You are not in this room.";
        if (!Bidding || Lot is null) return "Bidding is closed.";
        var high = High;
        if (high?.PlayerId == playerId) return "You already have the top bid.";
        raise = Math.Clamp(raise, 0, 500);
        var amount = high is null ? Lot.Reserve + raise : high.Amount + Math.Max(Rules.MinRaise, raise);
        if (amount > p.Cash) return $"Not enough cash: you have {Rules.Money(p.Cash)}.";

        var revived = Phase is Phase.Going1 or Phase.Going2;
        GoingCts?.Cancel();
        GoingCts = null;
        StepEndsAt = null;
        Phase = Phase.Open;
        Bids.Add(new Bid(playerId, amount));
        LastBidAt = DateTimeOffset.UtcNow;
        Log(revived ? "revive" : "bid", playerId, amount,
            revived ? $"{p.Name} bids {Rules.Money(amount)} before Gone. Still open!" : $"{p.Name} bids {Rules.Money(amount)}");
        return null;
    }

    public void BeginGoing(CancellationTokenSource cts, TimeSpan step)
    {
        GoingCts = cts;
        Phase = Phase.Going1;
        StepEndsAt = DateTimeOffset.UtcNow + step;
        Log("going", null, High?.Amount, "Going…");
    }

    public void Settle()
    {
        if (Lot is null) return;
        GoingCts = null;
        StepEndsAt = null;
        Phase = Phase.Sold;
        var high = High;
        if (high is null)
        {
            Deck.Add(Lot.Id);
            LastSale = (null, 0, Lot.Id, "No bids, so it goes to the bottom of the deck.");
            Log("nosale", null, null, $"No bids for {Lot.Title}. It goes to the bottom of the deck.");
            return;
        }
        var winner = Find(high.PlayerId)!;
        var before = CardsOf(winner).Count(a => a.Group == Lot.Group);
        winner.Cash -= high.Amount;
        winner.Cards.Add(Lot.Id);
        var note = (before + 1) switch
        {
            3 => $"Set of 3 {Lot.GroupName}: their value doubles!",
            4 => $"All 4 {Lot.GroupName}: their value triples!",
            _ => "",
        };
        LastSale = (winner.Id, high.Amount, Lot.Id, note);
        Log("sold", winner.Id, high.Amount, $"Gone! {Lot.Title} sold to {winner.Name} for {Rules.Money(high.Amount)}. {note}".Trim());
    }

    public void UndoBid()
    {
        if (!Bidding || Bids.Count == 0) return;
        GoingCts?.Cancel();
        GoingCts = null;
        StepEndsAt = null;
        var b = Bids[^1];
        Bids.RemoveAt(Bids.Count - 1);
        Phase = Phase.Open;
        Log("undo", b.PlayerId, b.Amount, $"Bid of {Rules.Money(b.Amount)} by {Find(b.PlayerId)?.Name} was withdrawn");
    }

    public void CancelLot()
    {
        if (!Bidding || Lot is null || Bids.Count > 0) return;
        Deck.Add(Lot.Id);
        Log("cancel", null, null, $"{Lot.Title} goes back to the bottom of the deck");
        Lot = null;
        Phase = Phase.Idle;
    }

    public void End()
    {
        GoingCts?.Cancel();
        GoingCts = null;
        Phase = Phase.Ended;
        Log("end", null, null, "Game over! Highest artwork value + cash wins.");
    }

    public object Snapshot()
    {
        var byId = Players.ToDictionary(p => p.Id);
        object? Who(string? id) => id is not null && byId.TryGetValue(id, out var p) ? new { p.Id, p.Name, p.Color } : null;
        return new
        {
            Code,
            Phase = Phase.ToString(),
            DeckLeft = Deck.Count,
            AutoCall,
            Lot = Lot?.Id,
            High = High is { } h ? new { h.PlayerId, h.Amount } : null,
            Bids = Bids.AsEnumerable().Reverse().Take(8).Select(b => new { b.PlayerId, b.Amount, Who = Who(b.PlayerId) }),
            StepEndsAt = StepEndsAt?.ToUnixTimeMilliseconds(),
            ServerNow = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds(),
            LastSale = LastSale is { } s ? new { s.PlayerId, s.Amount, s.ArtworkId, s.Note, Who = Who(s.PlayerId) } : null,
            Players = Players.Select(p =>
            {
                var art = Rules.CollectionValue(CardsOf(p));
                return new { p.Id, p.Name, p.Color, p.IsBot, p.Connected, p.Cash, p.Cards, ArtValue = art, Total = art + p.Cash };
            }),
            Events = Events.TakeLast(12).Reverse(),
        };
    }
}
