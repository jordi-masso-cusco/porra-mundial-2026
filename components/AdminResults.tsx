import type { Match } from "@/types";
import { flagUrl } from "@/lib/flags";

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
    const matchesByGroup = groupMatchesByGroup(matches);

    return (
        <>
            <h2>Resultats oficials</h2>

            {Object.entries(matchesByGroup).map(([groupName, groupMatches]) => (
                <section key={groupName} className="group-section">
                    <h3>Grup {groupName}</h3>

                    <div className="matches-grid">
                        {groupMatches.map((match) => (
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
                                    <span>{formatKickoff(match.kickoff)}</span>

                                    <button onClick={() => onSaveResult(match.id)}>
                                        Desar resultat
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            ))}
        </>
    );
}