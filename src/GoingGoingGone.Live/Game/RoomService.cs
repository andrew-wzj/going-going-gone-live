using System.Collections.Concurrent;
using GoingGoingGone.Live.Hubs;
using Microsoft.AspNetCore.SignalR;

namespace GoingGoingGone.Live.Game;

/// <summary>Owns all rooms, runs the "Going, going, gone" countdown and broadcasts room state.</summary>
public sealed class RoomService(Catalog catalog, IHubContext<AuctionHub> hub)
{
    public static readonly TimeSpan GoingStep = TimeSpan.FromSeconds(1.6);
    private const string CodeChars = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
    private readonly ConcurrentDictionary<string, Room> _rooms = new();

    public IEnumerable<Room> Rooms => _rooms.Values;

    public Room Create()
    {
        while (true)
        {
            var code = string.Concat(Enumerable.Range(0, 4).Select(_ => CodeChars[Random.Shared.Next(CodeChars.Length)]));
            var room = new Room(code, Guid.NewGuid().ToString("N"), catalog, new Random());
            if (_rooms.TryAdd(code, room)) return room;
        }
    }

    public Room? Get(string? code) =>
        code is not null && _rooms.TryGetValue(code.Trim().ToUpperInvariant(), out var r) ? r : null;

    public Task Broadcast(Room room)
    {
        object snap;
        lock (room.Gate) snap = room.Snapshot();
        return hub.Clients.Group(room.Code).SendAsync("state", snap);
    }

    public async Task StartGoing(Room room)
    {
        var cts = new CancellationTokenSource();
        lock (room.Gate)
        {
            if (room.Phase != Phase.Open || room.High is null) return;
            room.BeginGoing(cts, GoingStep);
        }
        await Broadcast(room);
        _ = RunCountdown(room, cts);
    }

    private async Task RunCountdown(Room room, CancellationTokenSource cts)
    {
        try
        {
            await Task.Delay(GoingStep, cts.Token);
            lock (room.Gate)
            {
                if (cts.IsCancellationRequested || room.GoingCts != cts || room.Phase != Phase.Going1) return;
                room.Phase = Phase.Going2;
                room.StepEndsAt = DateTimeOffset.UtcNow + GoingStep;
            }
            await Broadcast(room);
            await Task.Delay(GoingStep, cts.Token);
            lock (room.Gate)
            {
                if (cts.IsCancellationRequested || room.GoingCts != cts || room.Phase != Phase.Going2) return;
                room.Settle();
            }
            await Broadcast(room);
        }
        catch (TaskCanceledException) { /* a new bid kept the auction alive */ }
    }

    public void MarkDisconnected(string connectionId)
    {
        foreach (var room in _rooms.Values)
        {
            var changed = false;
            lock (room.Gate)
                foreach (var p in room.Players.Where(p => p.ConnectionId == connectionId))
                { p.ConnectionId = null; changed = true; }
            if (changed) _ = Broadcast(room);
        }
    }

    /// <summary>Drops rooms nobody has touched for a few hours.</summary>
    public void Sweep()
    {
        foreach (var (code, room) in _rooms)
            if (DateTimeOffset.UtcNow - room.LastActivity > TimeSpan.FromHours(4)) _rooms.TryRemove(code, out _);
    }
}
