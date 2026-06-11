import type { Match } from "@/types";
import { flagUrl } from "@/lib/flags";
import { calculateRealGroupStandings, getQualifiedTeams } from "@/lib/groupStandings";

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
    const matchesByGroup = groupMatchesByGroup(matches);
    const realGroupStandings = calculateRealGroupStandings(matches);
    const qualifiedTeams = getQualifiedTeams(realGroupStandings);

    return (
        <>
            <h2>Resultats oficials</h2>

            {Object.entries(matchesByGroup)
                .sort(([groupA], [groupB]) => groupA.localeCompare(groupB))
                .map(([groupName, groupMatches]) => {
                    const standingsRows = realGroupStandings[groupName] ?? [];

                    return (
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
                                                        onResultChange(
                                                            match.id,
                                                            "home_score",
                                                            e.target.value
                                                        )
                                                    }
                                                />

                                                <span>-</span>

                                                <input
                                                    className="score-input"
                                                    type="number"
                                                    min="0"
                                                    value={match.away_score ?? ""}
                                                    onChange={(e) =>
                                                        onResultChange(
                                                            match.id,
                                                            "away_score",
                                                            e.target.value
                                                        )
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

                            <div className="card">
                                <h4 style={{ marginTop: 0 }}>Classificació real</h4>

                                {standingsRows.length === 0 && (
                                    <p className="muted">
                                        Encara no hi ha resultats oficials en aquest grup.
                                    </p>
                                )}

                                {standingsRows.map((row, index) => (
                                    <div
                                        key={row.team}
                                        className={qualifiedTeams.has(row.team) ? "qualified-row" : "eliminated-row"}
                                        style={{
                                            display: "grid",
                                            gridTemplateColumns: "32px 1fr 60px 60px 60px 60px",
                                            gap: "8px",
                                            padding: "6px 0",
                                            borderTop: index === 0 ? "0" : "1px solid #eee",
                                            alignItems: "center",
                                        }}
                                    >
                                        <strong>{index + 1}</strong>
                                        <TeamName team={row.team} />
                                        <span>{row.points} pts</span>
                                        <span>GF {row.goalsFor}</span>
                                        <span>GC {row.goalsAgainst}</span>
                                        <span>DG {row.goalDifference}</span>
                                    </div>
                                ))}
                            </div>
                        </section>
                    );
                })}
        </>
    );
}