import type { Match, PublicPrediction } from "@/types";
import {
    calculatePredictedGroupStandings,
    calculateRealGroupStandings,
    getQualifiedTeams,
} from "@/lib/groupStandings";

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
            points: 20,
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