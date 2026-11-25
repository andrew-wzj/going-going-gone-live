namespace GoingGoingGone.Live.Game;

/// <summary>
/// Computer collectors, so a teacher can try the game alone. Each bot values a lot by how much it adds
/// to its own collection (set bonuses included) and bids up to that times its nerve.
/// Also calls "Going, going…" by itself when Auto call is on and the room has gone quiet.
/// </summary>
public sealed class BotRunner(RoomService rooms) : BackgroundService
{
    private static readonly TimeSpan QuietBeforeCall = TimeSpan.FromSeconds(4);

    protected override async Task ExecuteAsync(CancellationToken stop)
    {
        var tick = 0;
        while (!stop.IsCancellationRequested)
        {
            await Task.Delay(800, stop);
            if (++tick % 900 == 0) rooms.Sweep();
            foreach (var room in rooms.Rooms) await Step(room);
        }
    }

    private async Task Step(Room room)
    {
        bool bid = false, call = false;
        lock (room.Gate)
        {
            if (!room.Bidding || room.Lot is not { } lot) return;
            var high = room.High;
            var next = high is null ? lot.Reserve : high.Amount + Rules.MinRaise;
            var keen = room.Players
                .Where(p => p.IsBot && p.Id != high?.PlayerId)
                .Select(p => (p, limit: Math.Min(p.Cash, (int)(Rules.WorthTo(room.CardsOf(p), lot) * p.Nerve))))
                .Where(x => x.limit >= next)
                .ToList();
            if (keen.Count > 0 && Random.Shared.NextDouble() < 0.4)
            {
                var (p, limit) = keen[Random.Shared.Next(keen.Count)];
                int[] raises = [10, 10, 20, 50];
                var raise = high is null ? 0 : raises[Random.Shared.Next(raises.Length)];
                if (high is not null && high.Amount + raise > limit) raise = Rules.MinRaise;
                bid = room.PlaceBid(p.Id, raise) is null;
            }
            else if (room.AutoCall && room.Phase == Phase.Open && room.High is not null
                     && DateTimeOffset.UtcNow - room.LastBidAt > QuietBeforeCall)
            {
                call = true;
            }
        }
        if (bid) await rooms.Broadcast(room);
        if (call) await rooms.StartGoing(room);
    }

    public static readonly (string Name, double Nerve)[] Roster =
        [("Belinda (bot)", 1.1), ("Danny (bot)", 0.85), ("Trey (bot)", 1.0), ("Marisa (bot)", 0.95), ("Aruna (bot)", 1.15), ("Tony (bot)", 0.8)];
}
