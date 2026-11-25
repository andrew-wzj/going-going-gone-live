using GoingGoingGone.Live.Game;

namespace GoingGoingGone.Live.Tests;

public class RoomTests
{
    private static readonly Catalog Cards = new();

    private static (Room room, Player mia, Player dan) Started()
    {
        var room = new Room("TEST", "key", Cards, new Random(1));
        var mia = room.AddPlayer("Mia");
        var dan = room.AddPlayer("Daniel");
        room.Start();
        room.OpenNext();
        return (room, mia, dan);
    }

    [Fact]
    public void Start_deals_three_cards_and_starting_cash()
    {
        var (room, mia, dan) = Started();
        Assert.All([mia, dan], p => { Assert.Equal(3, p.Cards.Count); Assert.Equal(Rules.StartingCash, p.Cash); });
        Assert.Equal(36 - 6 - 1, room.Deck.Count);
        Assert.Equal(Phase.Open, room.Phase);
    }

    [Fact]
    public void First_bid_opens_at_the_reserve_and_raises_add_to_the_top_bid()
    {
        var (room, mia, dan) = Started();
        Assert.Null(room.PlaceBid(mia.Id, 0));
        Assert.Equal(room.Lot!.Reserve, room.High!.Amount);
        Assert.Null(room.PlaceBid(dan.Id, 50));
        Assert.Equal(room.Lot.Reserve + 50, room.High!.Amount);
    }

    [Fact]
    public void Top_bidder_cannot_outbid_themselves()
    {
        var (room, mia, _) = Started();
        room.PlaceBid(mia.Id, 0);
        Assert.NotNull(room.PlaceBid(mia.Id, 10));
        Assert.Single(room.Bids);
    }

    [Fact]
    public void Raises_below_the_minimum_are_rounded_up()
    {
        var (room, mia, dan) = Started();
        room.PlaceBid(mia.Id, 0);
        room.PlaceBid(dan.Id, 1);
        Assert.Equal(room.Lot!.Reserve + Rules.MinRaise, room.High!.Amount);
    }

    [Fact]
    public void A_bid_you_cannot_afford_is_refused()
    {
        var (room, mia, _) = Started();
        mia.Cash = room.Lot!.Reserve - 1;
        Assert.Contains("Not enough cash", room.PlaceBid(mia.Id, 0));
        Assert.Empty(room.Bids);
    }

    [Fact]
    public void A_new_bid_while_going_keeps_the_auction_alive()
    {
        var (room, mia, dan) = Started();
        room.PlaceBid(mia.Id, 0);
        var cts = new CancellationTokenSource();
        room.BeginGoing(cts, TimeSpan.FromSeconds(1));
        room.Phase = Phase.Going2;
        Assert.Null(room.PlaceBid(dan.Id, 10));
        Assert.Equal(Phase.Open, room.Phase);
        Assert.True(cts.IsCancellationRequested);
        Assert.Equal("revive", room.Events[^1].Type);
    }

    [Fact]
    public void Settle_charges_the_winner_and_hands_over_the_card()
    {
        var (room, mia, dan) = Started();
        var lot = room.Lot!;
        room.PlaceBid(mia.Id, 0);
        room.PlaceBid(dan.Id, 20);
        room.Settle();
        Assert.Equal(Phase.Sold, room.Phase);
        Assert.Contains(lot.Id, dan.Cards);
        Assert.Equal(Rules.StartingCash - lot.Reserve - 20, dan.Cash);
        Assert.Equal(Rules.StartingCash, mia.Cash);
    }

    [Fact]
    public void An_unsold_lot_goes_to_the_bottom_of_the_deck()
    {
        var (room, _, _) = Started();
        var lot = room.Lot!;
        room.Settle();
        Assert.Equal(lot.Id, room.Deck[^1]);
    }

    [Fact]
    public void Undo_removes_the_last_bid_and_stops_the_countdown()
    {
        var (room, mia, dan) = Started();
        room.PlaceBid(mia.Id, 0);
        room.PlaceBid(dan.Id, 10);
        var cts = new CancellationTokenSource();
        room.BeginGoing(cts, TimeSpan.FromSeconds(1));
        room.UndoBid();
        Assert.Equal(mia.Id, room.High!.PlayerId);
        Assert.Equal(Phase.Open, room.Phase);
        Assert.True(cts.IsCancellationRequested);
    }

    [Fact]
    public void Concurrent_bids_never_produce_a_lower_or_duplicate_top_bid()
    {
        var room = new Room("TEST", "key", Cards, new Random(2));
        var players = Enumerable.Range(0, 20).Select(i => room.AddPlayer($"P{i}")).ToList();
        room.Start();
        room.OpenNext();
        Parallel.For(0, 2000, i =>
        {
            var p = players[i % players.Count];
            lock (room.Gate) room.PlaceBid(p.Id, 10);
        });
        var amounts = room.Bids.Select(b => b.Amount).ToList();
        Assert.Equal(amounts.OrderBy(a => a), amounts);
        Assert.Equal(amounts.Count, amounts.Distinct().Count());
        Assert.All(room.Bids.Zip(room.Bids.Skip(1)), pair => Assert.NotEqual(pair.First.PlayerId, pair.Second.PlayerId));
    }
}

public class RulesTests
{
    private static Artwork A(int group, int estimate) => new($"x{group}{estimate}", group, "G", "#fff", "T", "A", estimate / 2, estimate, "");

    [Fact]
    public void Three_of_a_group_double_and_four_triple()
    {
        Assert.Equal(300, Rules.GroupValue([A(0, 100), A(0, 200)]));
        Assert.Equal(1200, Rules.GroupValue([A(0, 100), A(0, 200), A(0, 300)]));
        Assert.Equal(3000, Rules.GroupValue([A(0, 100), A(0, 200), A(0, 300), A(0, 400)]));
    }

    [Fact]
    public void The_third_card_is_worth_far_more_than_its_estimate()
    {
        Artwork[] owned = [A(1, 100), A(1, 100)];
        Assert.Equal(400, Rules.WorthTo(owned, A(1, 100)));   // 200 -> 600
        Assert.Equal(100, Rules.WorthTo(owned, A(2, 100)));   // a different group adds only its estimate
    }

    [Theory]
    [InlineData(40, "$40M")]
    [InlineData(1500, "$1.5B")]
    [InlineData(1430, "$1.43B")]
    public void Money_reads_like_the_cards(int millions, string text) => Assert.Equal(text, Rules.Money(millions));
}
