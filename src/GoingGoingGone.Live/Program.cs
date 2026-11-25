using System.Net.NetworkInformation;
using System.Net.Sockets;
using GoingGoingGone.Live.Game;
using GoingGoingGone.Live.Hubs;
using Microsoft.AspNetCore.HttpOverrides;

var builder = WebApplication.CreateBuilder(args);
// Hosts like Render pass the port in PORT; locally listen on 5080 on every interface
// so phones on the same Wi-Fi can join. An explicit ASPNETCORE_URLS always wins.
if (Environment.GetEnvironmentVariable("ASPNETCORE_URLS") is null)
    builder.WebHost.UseUrls($"http://0.0.0.0:{Environment.GetEnvironmentVariable("PORT") ?? "5080"}");
builder.Services.AddSignalR(o => o.MaximumReceiveMessageSize = 4 * 1024);
builder.Services.AddSingleton<Catalog>();
builder.Services.AddSingleton<RoomService>();
builder.Services.AddHostedService<BotRunner>();
builder.Services.Configure<ForwardedHeadersOptions>(o =>
{
    // Azure App Service terminates HTTPS in front of the app.
    o.ForwardedHeaders = ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto;
    o.KnownIPNetworks.Clear();
    o.KnownProxies.Clear();
});

var app = builder.Build();
app.UseForwardedHeaders();
app.UseDefaultFiles();
app.UseStaticFiles();
app.MapHub<AuctionHub>("/hub");
app.MapGet("/api/artworks", (Catalog c) => c.All);
app.MapGet("/healthz", () => "ok");
// The address phones should open (shown as a QR code on the projector).
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
