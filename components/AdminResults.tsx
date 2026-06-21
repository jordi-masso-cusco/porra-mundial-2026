import type { Match } from "@/types";
import { flagUrl } from "@/lib/flags";
import { calculateRealGroupStandings, getQualifiedTeams } from "@/lib/groupStandings";
import { sortMatchesForAdmin } from "@/lib/matches";
import { splitMatchesByStatus } from "@/lib/matches";

type AdminResultsProps = {
    matches: Match[];
    onResultChange: (
        matchId: number,
        field: "home_score" | "away_score",
        value: string
    ) => void;
    onSaveResult: (matchId: number) => void;
};

function formatKickoff(kickoff: string) {
    return new Intl.DateTimeFormat("ca-ES", {
        day: "2-digit",
        month: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
    }).format(new Date(kickoff));
}

function Flag({ team }: { team: string }) {
    const url = flagUrl(team);

    if (!url) return null;

    return <img src={url} alt="" className="flag" />;
}

function TeamName({ team }: { team: string }) {
    return (
        <span className="team-name">
            <Flag team={team} />
            {team}
        </span>
    );
}

function groupMatchesByGroup(matches: Match[]) {
    return matches.reduce<Record<string, Match[]>>((groups, match) => {
        if (!groups[match.group_name]) {
            groups[match.group_name] = [];
        }

        groups[match.group_name].push(match);
        return groups;
    }, {});
}

export function AdminResults({
    matches,
    onResultChange,
    onSaveResult,
}: AdminResultsProps) {
    const sortedMatches = [...matches].sort(
        (a, b) => new Date(a.kickoff).getTime() - new Date(b.kickoff).getTime()
    );
    const matchesByGroup = groupMatchesByGroup(matches);
    const realGroupStandings = calculateRealGroupStandings(matches);
    const qualifiedTeams = getQualifiedTeams(realGroupStandings);

    const { pending, played } = splitMatchesByStatus(matches);

    return (
        <>
            <h2 className="section-title">Resultats oficials</h2>

            {pending.length > 0 && (
                <>
                    <h3 className="subsection-title">Partits pendents</h3>
                    <div className="matches-grid">
                        {sortMatchesForAdmin(pending).map((match) => (
                            <div key={match.id} className="card">
                                <div className="compact-match">
                                    <div className="team-left">
                                        <Flag team={match.home_team} />
                                        <span>{match.home_team}</span>
                                    </div>

                                    <div className="score-center">
                                        <input
                                            className="score-input"
                                            type="number"
                                            min="0"
                                            value={match.home_score ?? ""}
                                            onChange={(e) =>
                                                onResultChange(match.id, "home_score", e.target.value)
                                            }
                                        />

                                        <span>-</span>

                                        <input
                                            className="score-input"
                                            type="number"
                                            min="0"
                                            value={match.away_score ?? ""}
                                            onChange={(e) =>
                                                onResultChange(match.id, "away_score", e.target.value)
                                            }
                                        />
                                    </div>

                                    <div className="team-right">
                                        <Flag team={match.away_team} />
                                        <span>{match.away_team}</span>
                                    </div>
                                </div>

                                <div className="match-footer">
                                    <span>
                                        Grup {match.group_name} · {formatKickoff(match.kickoff)}
                                    </span>

                                    <button onClick={() => onSaveResult(match.id)}>
                                        Desar resultat
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </>
            )}

            {played.length > 0 && (
                <>
                    <h3 className="subsection-title">Partits jugats</h3>
                    <div className="matches-grid">
                        {sortMatchesForAdmin(played).map((match) => (
                            <div key={match.id} className="card">
                                <div className="compact-match">
                                    <div className="team-left">
                                        <Flag team={match.home_team} />
                                        <span>{match.home_team}</span>
                                    </div>

                                    <div className="score-center">
                                        <input
                                            className="score-input"
                                            type="number"
                                            min="0"
                                            value={match.home_score ?? ""}
                                            onChange={(e) =>
                                                onResultChange(match.id, "home_score", e.target.value)
                                            }
                                        />

                                        <span>-</span>

                                        <input
                                            className="score-input"
                                            type="number"
                                            min="0"
                                            value={match.away_score ?? ""}
                                            onChange={(e) =>
                                                onResultChange(match.id, "away_score", e.target.value)
                                            }
                                        />
                                    </div>

                                    <div className="team-right">
                                        <Flag team={match.away_team} />
                                        <span>{match.away_team}</span>
                                    </div>
                                </div>

                                <div className="match-footer">
                                    <span>
                                        Grup {match.group_name} · {formatKickoff(match.kickoff)}
                                    </span>

                                    <button onClick={() => onSaveResult(match.id)}>
                                        Desar resultat
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </>
            )}

        </>
    );
}