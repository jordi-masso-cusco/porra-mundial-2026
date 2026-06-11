import type { AwardResult, Match, PublicAwardPrediction, PublicPrediction } from "@/types";

import {
    calculatePredictedGroupStandings,
    calculateRealGroupStandings,
} from "@/lib/groupStandings";

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
    publicAwardPredictions: PublicAwardPrediction[];
    awardResults: Record<string, AwardResult>;
};

const awardPoints: Record<string, number> = {
    golden_boot_1: 50,
    golden_boot_2: 25,
    golden_boot_3: 10,
    golden_ball_1: 50,
    golden_ball_2: 25,
    golden_ball_3: 10,
};

const awardLabels: Record<string, string> = {
    golden_boot_1: "Bota d'Or",
    golden_boot_2: "Bota de Plata",
    golden_boot_3: "Bota de Bronze",
    golden_ball_1: "Pilota d'Or",
    golden_ball_2: "Pilota de Plata",
    golden_ball_3: "Pilota de Bronze",
};

function getSign(home: number, away: number) {
    if (home > away) return "1";
    if (home < away) return "2";
    return "X";
}

export function Standings({
    matches,
    publicPredictions,
    publicAwardPredictions,
    awardResults,
}: StandingsProps) {
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

    const realGroupStandings = calculateRealGroupStandings(matches);

    for (const row of Object.values(standings)) {
        const predictedGroupStandings = calculatePredictedGroupStandings(
            matches,
            publicPredictions,
            row.userName
        );

        for (const [groupName, realRows] of Object.entries(realGroupStandings)) {
            const predictedRows = predictedGroupStandings[groupName];

            if (!predictedRows) continue;
            if (realRows.length < 4 || predictedRows.length < 4) continue;

            for (let index = 0; index < realRows.length; index++) {
                const realTeam = realRows[index]?.team;
                const predictedTeam = predictedRows[index]?.team;

                if (!realTeam || !predictedTeam) continue;
                if (realTeam !== predictedTeam) continue;

                const position = index + 1;
                const points = position <= 2 ? 10 : 5;

                row.points += points;
                row.details.push({
                    matchName: `Grup ${groupName} · Posició ${position}`,
                    prediction: predictedTeam,
                    result: realTeam,
                    points,
                    reason: "Posició exacta de grup",
                });
            }
        }
    }

    for (const awardPrediction of publicAwardPredictions) {
        const userName = awardPrediction.users?.name;
        if (!userName) continue;

        const result = awardResults[awardPrediction.award_key];
        if (!result) continue;

        if (!standings[userName]) {
            standings[userName] = {
                userName,
                points: 0,
                details: [],
            };
        }

        const predictedPlayer = awardPrediction.player_name.trim().toLowerCase();
        const realPlayer = result.player_name.trim().toLowerCase();

        if (predictedPlayer === realPlayer) {
            const points = awardPoints[awardPrediction.award_key] ?? 0;

            standings[userName].points += points;
            standings[userName].details.push({
                matchName: awardLabels[awardPrediction.award_key] ?? awardPrediction.award_key,
                prediction: awardPrediction.player_name,
                result: result.player_name,
                points,
                reason: "Premi individual correcte",
            });
        }
    }

    const rows = Object.values(standings).sort((a, b) => b.points - a.points);

    return (
        <>
            <h2>Classificació</h2>

            {rows.length === 0 && (
                <p>Encara no hi ha punts perquè falten resultats oficials.</p>
            )}

            {rows.map((row, index) => (
                <details key={row.userName} className="card">
                    <summary
                        style={{
                            display: "flex",
                            justifyContent: "space-between",
                            cursor: "pointer",
                            alignItems: "center",
                        }}
                    >
                        <strong>
                            {index + 1}. {row.userName}
                        </strong>

                        <span className="badge">{row.points} punts</span>
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
                                <div className="muted">Pronòstic: {detail.prediction}</div>
                                <div className="muted">Resultat: {detail.result}</div>
                                <div>
                                    <strong>{detail.points} punts</strong> · {detail.reason}
                                </div>
                            </div>
                        ))}
                    </div>
                </details>
            ))}
        </>
    );
}