import type { Match, PublicPrediction } from "@/types";

type StandingDetail = {
    matchName: string;
    prediction: string;
    result: string;
    points: number;
    reason: string;
};

type StandingRow = {
    userName: string;
    points: number;
    details: StandingDetail[];
};

type StandingsProps = {
    matches: Match[];
    publicPredictions: PublicPrediction[];
};

function getSign(home: number, away: number) {
    if (home > away) return "1";
    if (home < away) return "2";
    return "X";
}

export function Standings({ matches, publicPredictions }: StandingsProps) {
    const standings: Record<string, StandingRow> = {};

    for (const prediction of publicPredictions) {
        if (!prediction.users?.name || !prediction.matches) continue;

        const match = matches.find((item) => item.id === prediction.matches?.id);
        if (!match) continue;

        if (match.home_score === null || match.away_score === null) continue;
        if (
            prediction.predicted_home === null ||
            prediction.predicted_away === null
        ) {
            continue;
        }

        const userName = prediction.users.name;

        if (!standings[userName]) {
            standings[userName] = {
                userName,
                points: 0,
                details: [],
            };
        }

        const exact =
            prediction.predicted_home === match.home_score &&
            prediction.predicted_away === match.away_score;

        const signCorrect =
            getSign(prediction.predicted_home, prediction.predicted_away) ===
            getSign(match.home_score, match.away_score);

        let points = 0;
        let reason = "Sense punts";

        if (exact) {
            points = 10;
            reason = "Resultat exacte";
        } else if (signCorrect) {
            points = 5;
            reason = "Signe 1X2 correcte";
        }

        standings[userName].points += points;

        standings[userName].details.push({
            matchName: `${match.home_team} - ${match.away_team}`,
            prediction: `${prediction.predicted_home} - ${prediction.predicted_away}`,
            result: `${match.home_score} - ${match.away_score}`,
            points,
            reason,
        });
    }

    const rows = Object.values(standings).sort((a, b) => b.points - a.points);

    return (
        <>
            <h2>Classificació</h2>

            {rows.length === 0 && (
                <p>Encara no hi ha punts perquè falten resultats oficials.</p>
            )}

            {rows.map((row, index) => (
                <details
                    key={row.userName}
                    style={{
                        border: "1px solid #ccc",
                        padding: "12px",
                        marginBottom: "8px",
                        borderRadius: "8px",
                    }}
                >
                    <summary
                        style={{
                            display: "flex",
                            justifyContent: "space-between",
                            cursor: "pointer",
                        }}
                    >
                        <strong>
                            {index + 1}. {row.userName}
                        </strong>

                        <span>{row.points} punts</span>
                    </summary>

                    <div style={{ marginTop: "12px" }}>
                        {row.details.map((detail, detailIndex) => (
                            <div
                                key={detailIndex}
                                style={{
                                    borderTop: "1px solid #eee",
                                    paddingTop: "8px",
                                    marginTop: "8px",
                                }}
                            >
                                <strong>{detail.matchName}</strong>
                                <div>Pronòstic: {detail.prediction}</div>
                                <div>Resultat: {detail.result}</div>
                                <div>
                                    {detail.points} punts · {detail.reason}
                                </div>
                            </div>
                        ))}
                    </div>
                </details>
            ))}
        </>
    );
}