namespace GoingGoingGone.Live.Game;

public sealed record Artwork(
    string Id, int Group, string GroupName, string GroupColor,
    string Title, string Artist, int Reserve, int Estimate, string Story);

/// <summary>Money is in millions of dollars, as on the physical cards.</summary>
public static class Rules
{
    public const int StartingCash = 1500;
    public const int StartingCards = 3;
    public const int MinRaise = 10;

    /// <summary>2 or fewer works of a group are worth their Estimates; 3 double, 4 triple.</summary>
    public static int GroupValue(IReadOnlyCollection<Artwork> sameGroup)
    {
        var sum = sameGroup.Sum(a => a.Estimate);
        return sum * (sameGroup.Count >= 4 ? 3 : sameGroup.Count == 3 ? 2 : 1);
    }

    public static int CollectionValue(IEnumerable<Artwork> cards) =>
        cards.GroupBy(a => a.Group).Sum(g => GroupValue(g.ToList()));

    /// <summary>How much the lot would add to this collection's value.</summary>
    public static int WorthTo(IEnumerable<Artwork> owned, Artwork lot)
    {
        var same = owned.Where(a => a.Group == lot.Group).ToList();
        return GroupValue([.. same, lot]) - GroupValue(same);
    }

    public static string Money(int millions) =>
        millions >= 1000 ? $"${millions / 1000.0:0.##}B" : $"${millions}M";
}
