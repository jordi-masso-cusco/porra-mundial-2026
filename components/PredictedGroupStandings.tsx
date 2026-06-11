import type { Match, PublicPrediction } from "@/types";


import { flagUrl } from "@/lib/flags";

type PredictedGroupStandingsProps = {
    matches: Match[];
    publicPredictions: PublicPrediction[];
};

type TeamStanding = {
    team: string;
    points: number;
    goalsFor: number;
    goalsAgainst: number;
    goalDifference: number;
};

function getOrCreateTeam(
    standings: Record<string, TeamStanding>,
    team: string
) {
    if (!standings[team]) {
        standings[team] = {
            team,
            points: 0,
            goalsFor: 0,
            goalsAgainst: 0,
            goalDifference: 0,
        };
    }

    return standings[team];
}

function TeamName({ team }: { team: string }) {
  const url = flagUrl(team);

  return (
    <span className="team-name">
      {url && <img src={url} alt="" className="flag" />}
      {team}
    </span>
  );
}

export function PredictedGroupStandings({
    matches,
    publicPredictions,
}: PredictedGroupStandingsProps) {
    const users = Array.from(
        new Set(publicPredictions.map((prediction) => prediction.users?.name).filter(Boolean))
    );

    return (
        <>
            <h2>Classificacions de grup pronosticades</h2>

            {users.map((userName) => {
                const userPredictions = publicPredictions.filter(
                    (prediction) => prediction.users?.name === userName
                );

                const groups: Record<string, Record<string, TeamStanding>> = {};

                for (const prediction of userPredictions) {
                    if (
                        !prediction.matches ||
                        prediction.predicted_home === null ||
                        prediction.predicted_away === null
                    ) {
                        continue;
                    }

                    const match = matches.find((item) => item.id === prediction.matches?.id);
                    if (!match) continue;

                    if (!groups[match.group_name]) {
                        groups[match.group_name] = {};
                    }

                    const home = getOrCreateTeam(groups[match.group_name], match.home_team);
                    const away = getOrCreateTeam(groups[match.group_name], match.away_team);

                    home.goalsFor += prediction.predicted_home;
                    home.goalsAgainst += prediction.predicted_away;

                    away.goalsFor += prediction.predicted_away;
                    away.goalsAgainst += prediction.predicted_home;

                    if (prediction.predicted_home > prediction.predicted_away) {
                        home.points += 3;
                    } else if (prediction.predicted_home < prediction.predicted_away) {
                        away.points += 3;
                    } else {
                        home.points += 1;
                        away.points += 1;
                    }

                    home.goalDifference = home.goalsFor - home.goalsAgainst;
                    away.goalDifference = away.goalsFor - away.goalsAgainst;
                }

                return (
                    <details
                        key={userName}
                        className="card"
                    >
                        <summary style={{ cursor: "pointer" }}>
                            <strong>{userName}</strong>
                        </summary>

                        {Object.entries(groups).map(([groupName, standings]) => {
                            const rows = Object.values(standings).sort((a, b) => {
                                if (b.points !== a.points) return b.points - a.points;
                                if (b.goalDifference !== a.goalDifference) {
                                    return b.goalDifference - a.goalDifference;
                                }
                                return b.goalsFor - a.goalsFor;
                            });

                            return (
                                <div key={groupName} style={{ marginTop: "16px" }}>
                                    <h3>Grup {groupName}</h3>

                                    {rows.map((row, index) => (
                                        <div
                                            key={row.team}
                                            style={{
                                                display: "grid",
                                                gridTemplateColumns: "32px 1fr 60px 60px 60px",
                                                gap: "8px",
                                                padding: "6px 0",
                                                borderTop: "1px solid #eee",
                                            }}
                                        >
                                            <span>{index + 1}</span>
                                            <strong>
                                                <TeamName team={row.team} />
                                            </strong>
                                            <span>{row.points} pts</span>
                                            <span>DG {row.goalDifference}</span>
                                            <span>GF {row.goalsFor}</span>
                                        </div>
                                    ))}
                                </div>
                            );
                        })}
                    </details>
                );
            })}
        </>
    );
}