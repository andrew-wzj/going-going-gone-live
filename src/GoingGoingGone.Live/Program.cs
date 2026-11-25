using System.Net.NetworkInformation;
using System.Net.Sockets;
using GoingGoingGone.Live.Game;
using GoingGoingGone.Live.Hubs;

var builder = WebApplication.CreateBuilder(args);
builder.Services.AddSignalR();
builder.Services.AddSingleton<Catalog>();
builder.Services.AddSingleton<RoomService>();
builder.Services.AddHostedService<BotRunner>();

var app = builder.Build();
app.UseDefaultFiles();
app.UseStaticFiles();
app.MapHub<AuctionHub>("/hub");
app.MapGet("/api/artworks", (Catalog c) => c.All);
// The address phones on the same Wi-Fi should open (shown as a QR code on the projector).
app.MapGet("/api/info", (HttpContext ctx) =>
{
    var host = ctx.Request.Host;
    var local = host.Host is "localhost" or "127.0.0.1" or "::1";
    var lan = NetworkInterface.GetAllNetworkInterfaces()
        .Where(n => n.OperationalStatus == OperationalStatus.Up && n.NetworkInterfaceType != NetworkInterfaceType.Loopback)
        .SelectMany(n => n.GetIPProperties().UnicastAddresses)
        .Select(a => a.Address)
        .FirstOrDefault(a => a.AddressFamily == AddressFamily.InterNetwork && !a.ToString().StartsWith("169.254"));
    var joinBase = local && lan is not null ? $"{ctx.Request.Scheme}://{lan}:{host.Port ?? 80}" : $"{ctx.Request.Scheme}://{host}";
    return new { joinBase };
});

app.Run();
