using System.Text.Json;

namespace GoingGoingGone.Live.Game;

/// <summary>The 36 artwork cards, loaded once from Data/artworks.json.</summary>
public sealed class Catalog
{
    public IReadOnlyList<Artwork> All { get; }
    private readonly Dictionary<string, Artwork> _byId;

    public Catalog()
    {
        var path = Path.Combine(AppContext.BaseDirectory, "Data", "artworks.json");
        All = JsonSerializer.Deserialize<List<Artwork>>(File.ReadAllText(path),
                  new JsonSerializerOptions { PropertyNameCaseInsensitive = true })
              ?? throw new InvalidOperationException("No artworks found in " + path);
        _byId = All.ToDictionary(a => a.Id);
    }

    public Artwork this[string id] => _byId[id];
}
