import type { AwardResult, Match, PublicAwardPrediction, PublicPrediction } from "@/types";

import {
    calculatePredictedGroupStandings,
    calculateRealGroupStandings,
} from "@/lib/groupStandings";

import { calculateRoundOf32QualificationPoints } from "@/lib/knockoutScoring";

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
    allPublicPredictions: PublicPrediction[];
    allPublicAwardPredictions: PublicAwardPrediction[];
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

function isGroupCompleted(matches: Match[], groupName: string) {
    const groupMatches = matches.filter((match) => match.group_name === groupName);

    return (
        groupMatches.length === 6 &&
        groupMatches.every(
            (match) => match.home_score !== null && match.away_score !== null
        )
    );
}

function calculateRows(
    matches: Match[],
    publicPredictions: PublicPrediction[],
    publicAwardPredictions: PublicAwardPrediction[],
    awardResults: Record<string, AwardResult>
) {
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
        const knockoutDetails = calculateRoundOf32QualificationPoints(
            matches,
            publicPredictions,
            row.userName
        );

        const totalKnockoutPoints = knockoutDetails.reduce(
            (sum, detail) => sum + detail.points,
            0
        );

        if (totalKnockoutPoints > 0) {
            row.points += totalKnockoutPoints;

            row.details.push({
                matchName: "Classificats a setzens",
                prediction: "Equips classificats pronosticats",
                result: "Equips classificats reals",
                points: totalKnockoutPoints,
                reason: `${knockoutDetails.length} equips classificats encertats`,
            });
        }
    }

    for (const row of Object.values(standings)) {
        const predictedGroupStandings = calculatePredictedGroupStandings(
            matches,
            publicPredictions,
            row.userName
        );

        for (const [groupName, realRows] of Object.entries(realGroupStandings)) {
            if (!isGroupCompleted(matches, groupName)) continue;

            const predictedRows = predictedGroupStandings[groupName];

            if (!predictedRows) continue;
            if (realRows.length < 4 || predictedRows.length < 4) continue;

            let groupPoints = 0;

            for (let index = 0; index < realRows.length; index++) {
                const realTeam = realRows[index]?.team;
                const predictedTeam = predictedRows[index]?.team;

                if (!realTeam || !predictedTeam) continue;
                if (realTeam !== predictedTeam) continue;

                const position = index + 1;
                groupPoints += position <= 2 ? 10 : 5;
            }

            if (groupPoints > 0) {
                row.points += groupPoints;
                row.details.push({
                    matchName: `Grup ${groupName}`,
                    prediction: "Classificació pronosticada",
                    result: "Classificació real",
                    points: groupPoints,
                    reason: "Posicions exactes de grup",
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

    return Object.values(standings).sort((a, b) => b.points - a.points);
}

function buildUserGroupMap(
    publicPredictions: PublicPrediction[],
    publicAwardPredictions: PublicAwardPrediction[]
) {
    const userGroupByName = new Map<string, string | null>();

    for (const prediction of publicPredictions) {
        if (prediction.users?.name) {
            userGroupByName.set(
                prediction.users.name,
                prediction.users.group_name ?? null
            );
        }
    }

    for (const prediction of publicAwardPredictions) {
        if (prediction.users?.name) {
            userGroupByName.set(
                prediction.users.name,
                prediction.users.group_name ?? null
            );
        }
    }

    return userGroupByName;
}

export function Standings({
    matches,
    publicPredictions,
    publicAwardPredictions,
    allPublicPredictions,
    allPublicAwardPredictions,
    awardResults,
}: StandingsProps) {
    const rows = calculateRows(
        matches,
        publicPredictions,
        publicAwardPredictions,
        awardResults
    );

    const allRows = calculateRows(
        matches,
        allPublicPredictions,
        allPublicAwardPredictions,
        awardResults
    );

    const userGroupByName = buildUserGroupMap(
        allPublicPredictions,
        allPublicAwardPredictions
    );

    const teamStandings = ["PERLA", "ORIOL GÜELL"]
        .map((groupName) => {
            const members = allRows.filter((row) => {
                const userGroup = userGroupByName.get(row.userName);

                return userGroup === groupName || userGroup === null || userGroup === undefined;
            });

            /*             const members = rows.filter(
                            (row) => userGroupByName.get(row.userName) === groupName
                        ); */

            const totalPoints = members.reduce((sum, row) => sum + row.points, 0);
            const averagePoints =
                members.length > 0 ? totalPoints / members.length : 0;

            return {
                groupName,
                membersCount: members.length,
                totalPoints,
                averagePoints,
            };
        })
        .sort((a, b) => b.averagePoints - a.averagePoints);

    return (
        <>
            <h2 className="section-title">Classificació per equips</h2>

            <div className="team-standings-card">
                {teamStandings.map((team, index) => (
                    <div key={team.groupName} className="team-standing-row">
                        <strong>
                            {index + 1}.{" "}
                            {team.groupName === "PERLA" ? "🍻 PERLA" : "⚽ ORIOL GÜELL"}
                        </strong>

                        <span className="badge">
                            {team.averagePoints.toFixed(1)} punts / participant
                        </span>

                        <span className="muted">
                            {team.totalPoints} punts · {team.membersCount} participants
                        </span>
                    </div>
                ))}
            </div>

            <h2 className="section-title">Classificació individual</h2>

            {rows.length === 0 && (
                <p>Encara no hi ha punts perquè falten resultats oficials.</p>
            )}

            {rows.length > 0 && (
                <>
                    <div className="standings-card">
                        <div className="standings-header-row">
                            <span>#</span>
                            <span>Participant</span>
                            <span>Punts</span>
                            <span></span>
                        </div>

                        <div className="standings-list">
                            {rows.map((row, index) => (
                                <details key={row.userName} className="standings-row">
                                    <summary className="standings-summary">
                                        <span className="standings-position">{index + 1}</span>

                                        <strong className="standings-name">{row.userName}</strong>

                                        <span className="badge">{row.points} punts</span>

                                        <span className="standings-chevron">⌄</span>
                                    </summary>

                                    <div className="standings-details">
                                        {row.details.map((detail, detailIndex) => (
                                            <div key={detailIndex} className="standings-detail-row">
                                                <strong>{detail.matchName}</strong>
                                                <span className="muted">
                                                    Pronòstic: {detail.prediction}
                                                </span>
                                                <span className="muted">
                                                    Resultat: {detail.result}
                                                </span>
                                                <span>
                                                    <strong>{detail.points}</strong> · {detail.reason}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </details>
                            ))}
                        </div>
                    </div>

                    <p className="muted" style={{ textAlign: "center", marginTop: "16px" }}>
                        Fes clic a cada participant per veure el detall dels punts.
                    </p>
                </>
            )}
        </>
    );
}