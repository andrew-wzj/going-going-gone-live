using GoingGoingGone.Live.Game;
using Microsoft.AspNetCore.SignalR;

namespace GoingGoingGone.Live.Hubs;

/// <summary>Real-time API for the projector (host) and the phones (players).</summary>
public sealed class AuctionHub(RoomService rooms) : Hub
{
    public async Task<object> CreateRoom()
    {
        var ip = Context.GetHttpContext()?.Connection.RemoteIpAddress?.ToString() ?? "?";
        var room = rooms.TryCreate(ip);
        if (room is null) return new { Error = "Too many rooms were opened from this network. Try again later." };
        await Groups.AddToGroupAsync(Context.ConnectionId, room.Code);
        await rooms.Broadcast(room);
        return new { room.Code, room.HostKey };
    }

    public async Task<bool> HostJoin(string code, string hostKey)
    {
        var room = rooms.Get(code);
        if (room is null || room.HostKey != hostKey) return false;
        await Groups.AddToGroupAsync(Context.ConnectionId, room.Code);
        await rooms.Broadcast(room);
        return true;
    }

    public async Task<object> Join(string code, string name)
    {
        var room = rooms.Get(code);
        if (room is null) return new { Error = "No room with that code. Check the code on the screen." };
        // Strip control and invisible formatting characters; collapse whitespace.
        name = string.Join(' ', new string((name ?? "").Where(c => !char.IsControl(c) && char.GetUnicodeCategory(c) != System.Globalization.UnicodeCategory.Format).ToArray())
            .Split(' ', StringSplitOptions.RemoveEmptyEntries));
        if (name.Length is < 1 or > 16) return new { Error = "Use a name of 1 to 16 characters." };
        Player p;
        lock (room.Gate)
        {
            if (room.Phase == Phase.Ended) return new { Error = "This game has ended." };
            if (room.Players.Count(x => !x.IsBot) >= 30) return new { Error = "This room is full." };
            p = room.AddPlayer(name);
            p.ConnectionId = Context.ConnectionId;
        }
        await Groups.AddToGroupAsync(Context.ConnectionId, room.Code);
        await rooms.Broadcast(room);
        return new { p.Id, room.Code };
    }

    public async Task<bool> Rejoin(string code, string playerId)
    {
        var room = rooms.Get(code);
        if (room is null) return false;
        lock (room.Gate)
        {
            var p = room.Find(playerId);
            if (p is null || p.IsBot) return false;
            p.ConnectionId = Context.ConnectionId;
        }
        await Groups.AddToGroupAsync(Context.ConnectionId, room.Code);
        await rooms.Broadcast(room);
        return true;
    }

    /// <summary>Returns null when the bid counts, otherwise why it was refused.</summary>
    public async Task<string?> Bid(string code, string playerId, int raise)
    {
        var room = rooms.Get(code);
        if (room is null) return "This room no longer exists.";
        string? error;
        lock (room.Gate)
        {
            if (room.Find(playerId) is { } p) p.ConnectionId = Context.ConnectionId;
            error = room.PlaceBid(playerId, raise);
        }
        if (error is null) await rooms.Broadcast(room);
        return error;
    }

    public async Task<string?> Host(string code, string hostKey, string action)
    {
        var room = rooms.Get(code);
        if (room is null || room.HostKey != hostKey) return "Not the host of this room.";
        if (action == "going") { await rooms.StartGoing(room); return null; }
        lock (room.Gate)
        {
            switch (action)
            {
                case "start": room.Start(); break;
                case "next": room.OpenNext(); break;
                case "undo": room.UndoBid(); break;
                case "cancel": room.CancelLot(); break;
                case "auto": room.AutoCall = !room.AutoCall; break;
                case "end": room.End(); break;
                case "bots":
                    foreach (var (name, nerve) in BotRunner.Roster.Where(b => room.Players.All(p => p.Name != b.Name)).Take(3))
                        room.AddPlayer(name, bot: true, nerve);
                    break;
                default: return $"Unknown action: {action}";
            }
        }
        await rooms.Broadcast(room);
        return null;
    }

    public override Task OnDisconnectedAsync(Exception? exception)
    {
        rooms.MarkDisconnected(Context.ConnectionId);
        return base.OnDisconnectedAsync(exception);
    }
}
