# Going, Going, Gone! Live

A classroom companion for the physical *Going, Going, Gone!* art-auction board game.
The teacher runs the auction on the projector; students bid from their phones, and each phone
shows what the lot is **worth to them** (set bonuses included) before they decide.

Built with **ASP.NET Core (.NET 10) + SignalR**. No database: rooms live in memory.

## Run it

```bash
cd src/GoingGoingGone.Live
dotnet run            # listens on http://0.0.0.0:5080
```

1. Open `http://localhost:5080/host.html` on the computer connected to the projector.
2. Students on the same Wi-Fi scan the QR code (it uses the computer's LAN address) or open the URL and enter the room code.
3. Trying it alone? Press **Add 3 bots**.

On macOS, allow incoming connections if the firewall asks.

### Projector shortcuts

| Key | Action |
| --- | --- |
| `N` | Next artwork |
| `Space` / `G` | Going, going… (≈3 s countdown; any new bid reopens bidding) |
| `U` | Undo last bid |

**Auto call** makes the server call "Going, going…" by itself after 4 quiet seconds.

## Rules used

- Everyone starts with $1.5B and 3 random artworks.
- The first bid is the Reserve; each raise is at least $10M. You can't bid more cash than you have.
- Per art movement: 3 works double their Estimates, all 4 triple them.
- Score = artwork value + cash.

## Layout

```
src/GoingGoingGone.Live/
  Game/      Rules, Room (state machine), RoomService (countdown, broadcast), BotRunner
  Hubs/      AuctionHub: the SignalR API used by both pages
  Data/      artworks.json (36 cards)
  wwwroot/   host.html (projector), play.html (phone), js/, css/
tests/GoingGoingGone.Live.Tests/   xUnit tests for rules, bidding and concurrency
```

```bash
dotnet test
```

Third-party: `@microsoft/signalr` (MIT), `qrcode-generator` (MIT).
