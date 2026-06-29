import type {
    KnockoutResult,
    Match,
    PublicKnockoutPrediction,
    PublicPrediction,
} from "@/types";
import {
    calculatePredictedGroupStandings,
    calculateRealGroupStandings,
    getQualifiedTeams,
} from "@/lib/groupStandings";

import { generateBracketTree, resolveRoundOf32 } from "@/lib/knockout";

export type KnockoutScoreDetail = {
    points: number;
    reason: string;
};

export function calculateRoundOf32QualificationPoints(
    matches: Match[],
    publicPredictions: PublicPrediction[],
    userName: string
) {
    if (!areAllGroupsCompleted(matches)) {
        return [];
    }

    const realGroupStandings = calculateRealGroupStandings(matches);
    const predictedGroupStandings = calculatePredictedGroupStandings(
        matches,
        publicPredictions,
        userName
    );

    const realQualifiedTeams = getQualifiedTeams(realGroupStandings);
    const predictedQualifiedTeams = getQualifiedTeams(predictedGroupStandings);

    const details: KnockoutScoreDetail[] = [];

    for (const team of predictedQualifiedTeams) {
        if (!realQualifiedTeams.has(team)) continue;

        details.push({
            points: 10,
            reason: `${team} classificat a setzens`,
        });
    }

    return details;
}

function areAllGroupsCompleted(matches: Match[]) {
    const groups = new Set(matches.map((match) => match.group_name));

    return Array.from(groups).every((groupName) => {
        const groupMatches = matches.filter(
            (match) => match.group_name === groupName
        );

        return (
            groupMatches.length === 6 &&
            groupMatches.every(
                (match) => match.home_score !== null && match.away_score !== null
            )
        );
    });
}

export function calculateRoundOf16QualificationPoints(
    matches: Match[],
    publicKnockoutPredictions: PublicKnockoutPrediction[],
    knockoutResults: Record<number, KnockoutResult>,
    userName: string
) {
    return calculateQualificationPointsForRound({
        matches,
        publicKnockoutPredictions,
        knockoutResults,
        userName,
        sourceMatchIds: Array.from({ length: 16 }, (_, index) => index + 1),
        pointsPerTeam: 20,
        roundLabel: "vuitens",
    });
}

export function calculateQuarterFinalQualificationPoints(
    matches: Match[],
    publicKnockoutPredictions: PublicKnockoutPrediction[],
    knockoutResults: Record<number, KnockoutResult>,
    userName: string
) {
    return calculateQualificationPointsForRound({
        matches,
        publicKnockoutPredictions,
        knockoutResults,
        userName,
        sourceMatchIds: Array.from({ length: 8 }, (_, index) => index + 17),
        pointsPerTeam: 20,
        roundLabel: "quarts",
    });
}

export function calculateSemiFinalQualificationPoints(
    matches: Match[],
    publicKnockoutPredictions: PublicKnockoutPrediction[],
    knockoutResults: Record<number, KnockoutResult>,
    userName: string
) {
    return calculateQualificationPointsForRound({
        matches,
        publicKnockoutPredictions,
        knockoutResults,
        userName,
        sourceMatchIds: [25, 26, 27, 28],
        pointsPerTeam: 30,
        roundLabel: "semifinals",
    });
}

export function calculateFinalQualificationPoints(
    matches: Match[],
    publicKnockoutPredictions: PublicKnockoutPrediction[],
    knockoutResults: Record<number, KnockoutResult>,
    userName: string
) {
    return calculateQualificationPointsForRound({
        matches,
        publicKnockoutPredictions,
        knockoutResults,
        userName,
        sourceMatchIds: [29, 30],
        pointsPerTeam: 40,
        roundLabel: "la final",
    });
}

export function calculatePodiumPoints(
    matches: Match[],
    publicKnockoutPredictions: PublicKnockoutPrediction[],
    knockoutResults: Record<number, KnockoutResult>,
    userName: string
) {
    const { realBracket, predictedBracket } = buildBracketsForUser(
        matches,
        publicKnockoutPredictions,
        knockoutResults,
        userName
    );

    const details: KnockoutScoreDetail[] = [];

    const realChampion = realBracket.winners.G32;
    const predictedChampion = predictedBracket.winners.G32;

    if (realChampion && predictedChampion && realChampion === predictedChampion) {
        details.push({
            points: 100,
            reason: `${predictedChampion} campió del món`,
        });
    }

    const realRunnerUp = realBracket.winners.P32;
    const predictedRunnerUp = predictedBracket.winners.P32;

    if (realRunnerUp && predictedRunnerUp && realRunnerUp === predictedRunnerUp) {
        details.push({
            points: 60,
            reason: `${predictedRunnerUp} subcampió del món`,
        });
    }

    const realThirdPlace = realBracket.winners.G31;
    const predictedThirdPlace = predictedBracket.winners.G31;

    if (
        realThirdPlace &&
        predictedThirdPlace &&
        realThirdPlace === predictedThirdPlace
    ) {
        details.push({
            points: 30,
            reason: `${predictedThirdPlace} tercer classificat`,
        });
    }

    return details;
}

function getQualifiedTeamsFromWinners(
    winners: Record<string, string>,
    matchIds: number[]
) {
    return new Set(
        matchIds
            .map((matchId) => winners[`G${matchId}`])
            .filter(Boolean)
    );
}

function buildBracketsForUser(
    matches: Match[],
    publicKnockoutPredictions: PublicKnockoutPrediction[],
    knockoutResults: Record<number, KnockoutResult>,
    userName: string
) {
    const groupStandings = calculateRealGroupStandings(matches);
    const roundOf32Matches = resolveRoundOf32(groupStandings);

    const realResultsAsPredictions = Object.fromEntries(
        Object.values(knockoutResults).map((result) => [
            result.match_id,
            { qualified_team: result.qualified_team },
        ])
    );

    const userPredictionsAsPredictions = Object.fromEntries(
        publicKnockoutPredictions
            .filter((prediction) => prediction.users?.name === userName)
            .map((prediction) => [
                prediction.match_id,
                { qualified_team: prediction.qualified_team },
            ])
    );

    return {
        realBracket: generateBracketTree(roundOf32Matches, realResultsAsPredictions),
        predictedBracket: generateBracketTree(
            roundOf32Matches,
            userPredictionsAsPredictions
        ),
    };
}

export function calculateQualificationPointsForRound({
    matches,
    publicKnockoutPredictions,
    knockoutResults,
    userName,
    sourceMatchIds,
    pointsPerTeam,
    roundLabel,
}: {
    matches: Match[];
    publicKnockoutPredictions: PublicKnockoutPrediction[];
    knockoutResults: Record<number, KnockoutResult>;
    userName: string;
    sourceMatchIds: number[];
    pointsPerTeam: number;
    roundLabel: string;
}) {
    const groupStandings = calculateRealGroupStandings(matches);
    const roundOf32Matches = resolveRoundOf32(groupStandings);

    const realResultsAsPredictions = Object.fromEntries(
        Object.values(knockoutResults).map((result) => [
            result.match_id,
            { qualified_team: result.qualified_team },
        ])
    );

    const realBracket = generateBracketTree(
        roundOf32Matches,
        realResultsAsPredictions
    );

    const userPredictionsAsPredictions = Object.fromEntries(
        publicKnockoutPredictions
            .filter((prediction) => prediction.users?.name === userName)
            .map((prediction) => [
                prediction.match_id,
                { qualified_team: prediction.qualified_team },
            ])
    );

    const predictedBracket = generateBracketTree(
        roundOf32Matches,
        userPredictionsAsPredictions
    );

    const realQualifiedTeams = getQualifiedTeamsFromWinners(
        realBracket.winners,
        sourceMatchIds
    );

    const predictedQualifiedTeams = getQualifiedTeamsFromWinners(
        predictedBracket.winners,
        sourceMatchIds
    );

    const details: KnockoutScoreDetail[] = [];

    for (const team of predictedQualifiedTeams) {
        if (!realQualifiedTeams.has(team)) continue;

        details.push({
            points: pointsPerTeam,
            reason: `${team} classificat a ${roundLabel}`,
        });
    }

    return details;
}

function getSign(home: number, away: number) {
    if (home > away) return "1";
    if (home < away) return "2";
    return "X";
}

function sameTeams(aHome: string, aAway: string, bHome: string, bAway: string) {
    return aHome === bHome && aAway === bAway;
}

export function calculateRoundOf32MatchPoints(
    matches: Match[],
    publicKnockoutPredictions: PublicKnockoutPrediction[],
    knockoutResults: Record<number, KnockoutResult>,
    userName: string
) {
    return calculateKnockoutMatchPointsForRange({
        matches,
        publicKnockoutPredictions,
        knockoutResults,
        userName,
        fromMatchId: 1,
        toMatchId: 16,
        exactPoints: 10,
        signPoints: 5,
        roundLabel: "setzens",
    });
}

export function calculateRoundOf16MatchPoints(
    matches: Match[],
    publicKnockoutPredictions: PublicKnockoutPrediction[],
    knockoutResults: Record<number, KnockoutResult>,
    userName: string
) {
    return calculateKnockoutMatchPointsForRange({
        matches,
        publicKnockoutPredictions,
        knockoutResults,
        userName,
        fromMatchId: 17,
        toMatchId: 24,
        exactPoints: 10,
        signPoints: 5,
        roundLabel: "vuitens",
    });
}

export function calculateQuarterFinalMatchPoints(
    matches: Match[],
    publicKnockoutPredictions: PublicKnockoutPrediction[],
    knockoutResults: Record<number, KnockoutResult>,
    userName: string
) {
    return calculateKnockoutMatchPointsForRange({
        matches,
        publicKnockoutPredictions,
        knockoutResults,
        userName,
        fromMatchId: 25,
        toMatchId: 28,
        exactPoints: 20,
        signPoints: 10,
        roundLabel: "quarts",
    });
}

export function calculateSemiFinalMatchPoints(
    matches: Match[],
    publicKnockoutPredictions: PublicKnockoutPrediction[],
    knockoutResults: Record<number, KnockoutResult>,
    userName: string
) {
    return calculateKnockoutMatchPointsForRange({
        matches,
        publicKnockoutPredictions,
        knockoutResults,
        userName,
        fromMatchId: 29,
        toMatchId: 30,
        exactPoints: 30,
        signPoints: 15,
        roundLabel: "semifinals",
    });
}

export function calculateThirdPlaceMatchPoints(
    matches: Match[],
    publicKnockoutPredictions: PublicKnockoutPrediction[],
    knockoutResults: Record<number, KnockoutResult>,
    userName: string
) {
    return calculateKnockoutMatchPointsForRange({
        matches,
        publicKnockoutPredictions,
        knockoutResults,
        userName,
        fromMatchId: 31,
        toMatchId: 31,
        exactPoints: 30,
        signPoints: 15,
        roundLabel: "partit pel 3r lloc",
    });
}

export function calculateFinalMatchPoints(
    matches: Match[],
    publicKnockoutPredictions: PublicKnockoutPrediction[],
    knockoutResults: Record<number, KnockoutResult>,
    userName: string
) {
    return calculateKnockoutMatchPointsForRange({
        matches,
        publicKnockoutPredictions,
        knockoutResults,
        userName,
        fromMatchId: 32,
        toMatchId: 32,
        exactPoints: 60,
        signPoints: 40,
        roundLabel: "final",
    });
}

export function calculateKnockoutMatchPointsForRange({
    matches,
    publicKnockoutPredictions,
    knockoutResults,
    userName,
    fromMatchId,
    toMatchId,
    exactPoints,
    signPoints,
    roundLabel,
}: {
    matches: Match[];
    publicKnockoutPredictions: PublicKnockoutPrediction[];
    knockoutResults: Record<number, KnockoutResult>;
    userName: string;
    fromMatchId: number;
    toMatchId: number;
    exactPoints: number;
    signPoints: number;
    roundLabel: string;
}) {
    const { realBracket, predictedBracket } = buildBracketsForUser(
        matches,
        publicKnockoutPredictions,
        knockoutResults,
        userName
    );

    const userPredictionsByMatch = Object.fromEntries(
        publicKnockoutPredictions
            .filter((prediction) => prediction.users?.name === userName)
            .map((prediction) => [prediction.match_id, prediction])
    );

    const details: KnockoutScoreDetail[] = [];

    for (let matchId = fromMatchId; matchId <= toMatchId; matchId++) {
        const realMatch = realBracket.matches.find((match) => match.id === matchId);
        const predictedMatch = predictedBracket.matches.find(
            (match) => match.id === matchId
        );
        const prediction = userPredictionsByMatch[matchId];
        const result = knockoutResults[matchId];

        if (!realMatch || !predictedMatch || !prediction || !result) continue;

        if (
            result.official_home === null ||
            result.official_away === null ||
            prediction.predicted_home === null ||
            prediction.predicted_away === null
        ) {
            continue;
        }

        if (
            !sameTeams(
                predictedMatch.homeTeam,
                predictedMatch.awayTeam,
                realMatch.homeTeam,
                realMatch.awayTeam
            )
        ) {
            continue;
        }

        const exact =
            prediction.predicted_home === result.official_home &&
            prediction.predicted_away === result.official_away;

        if (exact) {
            details.push({
                points: exactPoints,
                reason: `Resultat exacte a ${roundLabel}: ${realMatch.homeTeam} ${result.official_home}-${result.official_away} ${realMatch.awayTeam}`,
            });
            continue;
        }

        const signCorrect =
            getSign(prediction.predicted_home, prediction.predicted_away) ===
            getSign(result.official_home, result.official_away);

        if (signCorrect) {
            details.push({
                points: signPoints,
                reason: `Signe correcte a ${roundLabel}: ${realMatch.homeTeam} - ${realMatch.awayTeam}`,
            });
        }
    }

    return details;
}

function getRoundScoringConfig(matchId: number) {
  if (matchId >= 1 && matchId <= 16) {
    return { exactPoints: 10, signPoints: 5 };
  }

  if (matchId >= 17 && matchId <= 24) {
    return { exactPoints: 10, signPoints: 5 };
  }

  if (matchId >= 25 && matchId <= 28) {
    return { exactPoints: 20, signPoints: 10 };
  }

  if (matchId >= 29 && matchId <= 30) {
    return { exactPoints: 30, signPoints: 15 };
  }

  if (matchId === 31) {
    return { exactPoints: 30, signPoints: 15 };
  }

  if (matchId === 32) {
    return { exactPoints: 60, signPoints: 40 };
  }

  return null;
}

function getQualificationPointsForMatch(matchId: number) {
  if (matchId >= 1 && matchId <= 16) return 20;
  if (matchId >= 17 && matchId <= 24) return 20;
  if (matchId >= 25 && matchId <= 28) return 30;
  if (matchId >= 29 && matchId <= 30) return 40;
  if (matchId === 31) return 30;
  if (matchId === 32) return 100;

  return 0;
}

export function calculateSingleKnockoutMatchPoints({
  matches,
  publicKnockoutPredictions,
  knockoutResults,
  userName,
  matchId,
}: {
  matches: Match[];
  publicKnockoutPredictions: PublicKnockoutPrediction[];
  knockoutResults: Record<number, KnockoutResult>;
  userName: string;
  matchId: number;
}) {
  const details: KnockoutScoreDetail[] = [];

  const roundConfig = getRoundScoringConfig(matchId);
  if (!roundConfig) return details;

  const { realBracket, predictedBracket } = buildBracketsForUser(
    matches,
    publicKnockoutPredictions,
    knockoutResults,
    userName
  );

  const realMatch = realBracket.matches.find((match) => match.id === matchId);
  const predictedMatch = predictedBracket.matches.find(
    (match) => match.id === matchId
  );

  const prediction = publicKnockoutPredictions.find(
    (item) => item.users?.name === userName && item.match_id === matchId
  );

  const result = knockoutResults[matchId];

  if (!realMatch || !predictedMatch || !prediction || !result) {
    return details;
  }

  if (prediction.qualified_team && result.qualified_team) {
    if (prediction.qualified_team === result.qualified_team) {
      const qualificationPoints = getQualificationPointsForMatch(matchId);

      if (qualificationPoints > 0) {
        details.push({
          points: qualificationPoints,
          reason: "Classificació",
        });
      }
    }
  }

  if (
    result.official_home === null ||
    result.official_away === null ||
    prediction.predicted_home === null ||
    prediction.predicted_away === null
  ) {
    return details;
  }

  if (
    !sameTeams(
      predictedMatch.homeTeam,
      predictedMatch.awayTeam,
      realMatch.homeTeam,
      realMatch.awayTeam
    )
  ) {
    return details;
  }

  const exact =
    prediction.predicted_home === result.official_home &&
    prediction.predicted_away === result.official_away;

  if (exact) {
    details.push({
      points: roundConfig.exactPoints,
      reason: "Resultat exacte",
    });

    return details;
  }

  const signCorrect =
    getSign(prediction.predicted_home, prediction.predicted_away) ===
    getSign(result.official_home, result.official_away);

  if (signCorrect) {
    details.push({
      points: roundConfig.signPoints,
      reason: "Signe 1X2 correcte",
    });
  }

  return details;
}
