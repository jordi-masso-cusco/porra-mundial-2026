import type { AwardResult, Match, PublicAwardPrediction, PublicPrediction, PublicKnockoutPrediction, KnockoutResult } from "@/types";

import {
    calculatePredictedGroupStandings,
    calculateRealGroupStandings,
} from "@/lib/groupStandings";

import {
    calculateRoundOf32QualificationPoints,
    calculateRoundOf16QualificationPoints,
    calculateQuarterFinalQualificationPoints,
    calculateSemiFinalQualificationPoints,
    calculateFinalQualificationPoints,
    calculatePodiumPoints,
    calculateRoundOf32MatchPoints,
    calculateRoundOf16MatchPoints,
    calculateQuarterFinalMatchPoints,
    calculateSemiFinalMatchPoints,
    calculateThirdPlaceMatchPoints,
    calculateFinalMatchPoints,
} from "@/lib/knockoutScoring";

type StandingDetail = {
    matchName: string;
    prediction: string;
    result: string;
    points: number;
    reason: string;
    category: keyof StandingBreakdown;
};

type StandingBreakdown = {
    groupResults: number;
    groupStandings: number;
    knockout: number;
    awards: number;
};

type StandingRow = {
    userName: string;
    points: number;
    details: StandingDetail[];
    breakdown: StandingBreakdown;
};

type StandingsProps = {
    matches: Match[];
    publicPredictions: PublicPrediction[];
    publicAwardPredictions: PublicAwardPrediction[];
    allPublicPredictions: PublicPrediction[];
    allPublicAwardPredictions: PublicAwardPrediction[];
    awardResults: Record<string, AwardResult>;
    publicKnockoutPredictions: PublicKnockoutPrediction[];
    allPublicKnockoutPredictions: PublicKnockoutPrediction[];
    knockoutResults: Record<number, KnockoutResult>;
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
    publicKnockoutPredictions: PublicKnockoutPrediction[],
    knockoutResults: Record<number, KnockoutResult>,
    awardResults: Record<string, AwardResult>
) {
    const standings: Record<string, StandingRow> = {};

    function userHasGroupPredictions(userName: string) {
        return publicPredictions.some(
            (prediction) => prediction.users?.name === userName
        );
    }

    function getOrCreateStanding(userName: string) {
        if (!standings[userName]) {
            standings[userName] = {
                userName,
                points: 0,
                details: [],
                breakdown: {
                    groupResults: 0,
                    groupStandings: 0,
                    knockout: 0,
                    awards: 0,
                },
            };
        }

        return standings[userName];
    }

    for (const prediction of publicPredictions) {
        const userName = prediction.users?.name;
        if (userName) getOrCreateStanding(userName);
    }

    for (const prediction of publicKnockoutPredictions) {
        const userName = prediction.users?.name;
        if (userName) getOrCreateStanding(userName);
    }

    for (const prediction of publicAwardPredictions) {
        const userName = prediction.users?.name;
        if (userName) getOrCreateStanding(userName);
    }

    function addAggregatedPoints(
        row: StandingRow,
        {
            title,
            prediction,
            result,
            details,
            reason,
            category,
        }: {
            title: string;
            prediction: string;
            result: string;
            details: { points: number; reason: string }[];
            reason: string;
            category: keyof StandingBreakdown;
        }
    ) {
        const total = details.reduce((sum, detail) => sum + detail.points, 0);

        if (total === 0) return;

        row.points += total;
        row.breakdown[category] += total;

        for (const detail of details) {
            row.details.push({
                matchName: title,
                prediction,
                result,
                points: detail.points,
                reason: detail.reason,
                category,
            });
        }
    }

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

        const row = getOrCreateStanding(prediction.users.name);

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

        row.points += points;

        row.breakdown.groupResults += points;

        row.details.push({
            matchName: `${match.home_team} - ${match.away_team}`,
            prediction: `${prediction.predicted_home} - ${prediction.predicted_away}`,
            result: `${match.home_score} - ${match.away_score}`,
            points,
            reason,
            category: "groupResults",
        });
    }

    const realGroupStandings = calculateRealGroupStandings(matches);

    for (const row of Object.values(standings)) {
        if (userHasGroupPredictions(row.userName)) {
            addAggregatedPoints(row, {
                title: "Classificats a setzens",
                prediction: "Equips classificats pronosticats",
                result: "Equips classificats reals",
                details: calculateRoundOf32QualificationPoints(
                    matches,
                    publicPredictions,
                    row.userName
                ),
                reason: "Equips classificats a setzens encertats",
                category: "knockout",
            });
        }

        addAggregatedPoints(row, {
            title: "Resultats setzens",
            prediction: "Resultats pronosticats",
            result: "Resultats oficials",
            details: calculateRoundOf32MatchPoints(
                matches,
                publicKnockoutPredictions,
                knockoutResults,
                row.userName
            ),
            reason: "Encerts de resultat/signe a setzens",
            category: "knockout",
        });

        addAggregatedPoints(row, {
            title: "Classificats a vuitens",
            prediction: "Equips classificats pronosticats",
            result: "Equips classificats reals",
            details: calculateRoundOf16QualificationPoints(
                matches,
                publicKnockoutPredictions,
                knockoutResults,
                row.userName
            ),
            reason: "Equips classificats a vuitens encertats",
            category: "knockout",
        });

        addAggregatedPoints(row, {
            title: "Resultats vuitens",
            prediction: "Resultats pronosticats",
            result: "Resultats oficials",
            details: calculateRoundOf16MatchPoints(
                matches,
                publicKnockoutPredictions,
                knockoutResults,
                row.userName
            ),
            reason: "Encerts de resultat/signe a vuitens",
            category: "knockout",
        });

        addAggregatedPoints(row, {
            title: "Classificats a quarts",
            prediction: "Equips classificats pronosticats",
            result: "Equips classificats reals",
            details: calculateQuarterFinalQualificationPoints(
                matches,
                publicKnockoutPredictions,
                knockoutResults,
                row.userName
            ),
            reason: "Equips classificats a quarts encertats",
            category: "knockout",
        });

        addAggregatedPoints(row, {
            title: "Resultats quarts",
            prediction: "Resultats pronosticats",
            result: "Resultats oficials",
            details: calculateQuarterFinalMatchPoints(
                matches,
                publicKnockoutPredictions,
                knockoutResults,
                row.userName
            ),
            reason: "Encerts de resultat/signe a quarts",
            category: "knockout",
        });

        addAggregatedPoints(row, {
            title: "Classificats a semifinals",
            prediction: "Equips classificats pronosticats",
            result: "Equips classificats reals",
            details: calculateSemiFinalQualificationPoints(
                matches,
                publicKnockoutPredictions,
                knockoutResults,
                row.userName
            ),
            reason: "Equips classificats a semifinals encertats",
            category: "knockout",
        });

        addAggregatedPoints(row, {
            title: "Resultats semifinals",
            prediction: "Resultats pronosticats",
            result: "Resultats oficials",
            details: calculateSemiFinalMatchPoints(
                matches,
                publicKnockoutPredictions,
                knockoutResults,
                row.userName
            ),
            reason: "Encerts de resultat/signe a semifinals",
            category: "knockout",
        });

        addAggregatedPoints(row, {
            title: "Finalistes",
            prediction: "Equips finalistes pronosticats",
            result: "Equips finalistes reals",
            details: calculateFinalQualificationPoints(
                matches,
                publicKnockoutPredictions,
                knockoutResults,
                row.userName
            ),
            reason: "Finalistes encertats",
            category: "knockout",
        });

        addAggregatedPoints(row, {
            title: "Resultat 3r lloc",
            prediction: "Resultat pronosticat",
            result: "Resultat oficial",
            details: calculateThirdPlaceMatchPoints(
                matches,
                publicKnockoutPredictions,
                knockoutResults,
                row.userName
            ),
            reason: "Encerts de resultat/signe al partit pel 3r lloc",
            category: "knockout",
        });

        addAggregatedPoints(row, {
            title: "Resultat final",
            prediction: "Resultat pronosticat",
            result: "Resultat oficial",
            details: calculateFinalMatchPoints(
                matches,
                publicKnockoutPredictions,
                knockoutResults,
                row.userName
            ),
            reason: "Encerts de resultat/signe a la final",
            category: "knockout",
        });

        addAggregatedPoints(row, {
            title: "Podis finals",
            prediction: "Campió, subcampió i tercer pronosticats",
            result: "Podis reals",
            details: calculatePodiumPoints(
                matches,
                publicKnockoutPredictions,
                knockoutResults,
                row.userName
            ),
            reason: "Encerts finals",
            category: "knockout",
        });
    }

    for (const row of Object.values(standings)) {
        if (!userHasGroupPredictions(row.userName)) continue;

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
                row.breakdown.groupStandings += groupPoints;

                row.details.push({
                    matchName: `Grup ${groupName}`,
                    prediction: "Classificació pronosticada",
                    result: "Classificació real",
                    points: groupPoints,
                    reason: "Posicions exactes de grup",
                    category: "groupStandings",
                });
            }
        }
    }

    for (const awardPrediction of publicAwardPredictions) {
        const userName = awardPrediction.users?.name;
        if (!userName) continue;

        const result = awardResults[awardPrediction.award_key];
        if (!result) continue;

        const row = getOrCreateStanding(userName);

        const predictedPlayer = awardPrediction.player_name.trim().toLowerCase();
        const realPlayer = result.player_name.trim().toLowerCase();

        if (predictedPlayer === realPlayer) {
            const points = awardPoints[awardPrediction.award_key] ?? 0;

            row.breakdown.awards += points;
            row.details.push({
                matchName:
                    awardLabels[awardPrediction.award_key] ?? awardPrediction.award_key,
                prediction: awardPrediction.player_name,
                result: result.player_name,
                points,
                reason: "Premi individual correcte",
                category: "awards",
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
    publicKnockoutPredictions,
    allPublicPredictions,
    allPublicAwardPredictions,
    allPublicKnockoutPredictions,
    knockoutResults,
    awardResults,
}: StandingsProps) {
    const rows = calculateRows(
        matches,
        publicPredictions,
        publicAwardPredictions,
        publicKnockoutPredictions,
        knockoutResults,
        awardResults
    );

    const allRows = calculateRows(
        matches,
        allPublicPredictions,
        allPublicAwardPredictions,
        allPublicKnockoutPredictions,
        knockoutResults,
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


            const totalPoints = members.reduce((sum, row) => sum + row.points, 0);
            const averagePoints = totalPoints / (members.length - 1);

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
                            {team.totalPoints} punts · {team.membersCount - 1} participants
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

                                        {[
                                            ["groupResults", "Resultats fase de grups "],
                                            ["groupStandings", "Classificació grups "],
                                            ["knockout", "Eliminatòries "],
                                            ["awards", "Premis "],
                                        ].map(([category, label]) => {
                                            const categoryKey = category as keyof StandingBreakdown;
                                            const categoryDetails = row.details.filter(
                                                (detail) => detail.category === categoryKey
                                            );

                                            const knockoutDetailsByType =
                                                categoryKey === "knockout"
                                                    ? Object.entries(
                                                        categoryDetails.reduce<Record<string, typeof categoryDetails>>(
                                                            (groups, detail) => {
                                                                if (!groups[detail.matchName]) {
                                                                    groups[detail.matchName] = [];
                                                                }

                                                                groups[detail.matchName].push(detail);
                                                                return groups;
                                                            },
                                                            {}
                                                        )
                                                    )
                                                    : [];

                                            const groupResultDetails =
                                                categoryKey === "groupResults"
                                                    ? Object.entries(
                                                        categoryDetails.reduce<Record<string, typeof categoryDetails>>(
                                                            (groups, detail) => {
                                                                const groupName =
                                                                    matches.find(
                                                                        (match) =>
                                                                            `${match.home_team} - ${match.away_team}` === detail.matchName
                                                                    )?.group_name ?? "Altres";

                                                                if (!groups[groupName]) groups[groupName] = [];
                                                                groups[groupName].push(detail);

                                                                return groups;
                                                            },
                                                            {}
                                                        )
                                                    ).sort(([groupA], [groupB]) => groupA.localeCompare(groupB))
                                                    : [];

                                            return (
                                                <details key={category} className="standings-breakdown-category">
                                                    <summary className="standings-breakdown-row">
                                                        <span>{label}</span>
                                                        <strong>{row.breakdown[categoryKey]}</strong>
                                                    </summary>

                                                    {categoryDetails.length === 0 ? (
                                                        <p className="muted">Sense punts en aquesta categoria.</p>
                                                    ) : categoryKey === "knockout" ? (
                                                        knockoutDetailsByType.map(([typeName, typeDetails]) => (
                                                            <details key={typeName} className="standings-breakdown-category">
                                                                <summary className="standings-breakdown-row">
                                                                    <span>{typeName}</span>
                                                                    <strong>
                                                                        {typeDetails.reduce((sum, detail) => sum + detail.points, 0)}
                                                                    </strong>
                                                                </summary>

                                                                <div className="standings-category-details">
                                                                    {typeDetails.map((detail, detailIndex) => (
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
                                                        ))
                                                    ) : (
                                                        categoryDetails.map((detail, detailIndex) => (
                                                            <div key={detailIndex} className="standings-detail-row">
                                                                <strong>{detail.matchName}</strong>
                                                                <span className="muted">Pronòstic: {detail.prediction}</span>
                                                                <span className="muted">Resultat: {detail.result}</span>
                                                                <span>
                                                                    <strong>{detail.points}</strong> · {detail.reason}
                                                                </span>
                                                            </div>
                                                        ))
                                                    )}
                                                </details>
                                            );
                                        })}

                                        <div className="standings-breakdown-total">
                                            <span>Total</span>
                                            <strong>{row.points}</strong>
                                        </div>
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