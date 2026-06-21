export type KnockoutMatchSlot = {
    id: number;
    homeSlot: string;
    awaySlot: string;
    side: "left" | "right";
};

export const roundOf32Slots: KnockoutMatchSlot[] = [
    { id: 73, homeSlot: "1E", awaySlot: "3ABCDF", side: "left" },
    { id: 74, homeSlot: "1I", awaySlot: "3CDFGH", side: "left" },
    { id: 75, homeSlot: "2A", awaySlot: "2B", side: "left" },
    { id: 76, homeSlot: "1F", awaySlot: "2C", side: "left" },
    { id: 77, homeSlot: "2K", awaySlot: "2L", side: "left" },
    { id: 78, homeSlot: "1H", awaySlot: "2J", side: "left" },
    { id: 79, homeSlot: "1D", awaySlot: "3BEFIJ", side: "left" },
    { id: 80, homeSlot: "1G", awaySlot: "3AEHIJ", side: "left" },

    { id: 81, homeSlot: "1C", awaySlot: "2F", side: "right" },
    { id: 82, homeSlot: "2E", awaySlot: "2I", side: "right" },
    { id: 83, homeSlot: "1A", awaySlot: "3CEFHI", side: "right" },
    { id: 84, homeSlot: "1L", awaySlot: "3EHIJK", side: "right" },
    { id: 85, homeSlot: "1J", awaySlot: "2H", side: "right" },
    { id: 86, homeSlot: "2D", awaySlot: "2G", side: "right" },
    { id: 87, homeSlot: "1B", awaySlot: "3EFGIJ", side: "right" },
    { id: 88, homeSlot: "1K", awaySlot: "3DEIJL", side: "right" },
];

import type { TeamStanding } from "@/lib/groupStandings";

function getBestThirdPlacedTeams(
    groupStandings: Record<string, TeamStanding[]>
) {
    return Object.entries(groupStandings)
        .map(([groupName, rows]) => {
            const third = rows[2];

            if (!third) return null;

            return {
                groupName,
                team: third.team,
                points: third.points,
                goalDifference: third.goalDifference,
                goalsFor: third.goalsFor,
            };
        })
        .filter(Boolean)
        .sort((a, b) => {
            if (!a || !b) return 0;
            if (b.points !== a.points) return b.points - a.points;
            if (b.goalDifference !== a.goalDifference) {
                return b.goalDifference - a.goalDifference;
            }
            return b.goalsFor - a.goalsFor;
        })
        .slice(0, 8);
}

export function resolveKnockoutSlot(
    slot: string,
    groupStandings: Record<string, TeamStanding[]>
) {
    if (slot.length === 2) {
        const position = Number(slot[0]);
        const groupName = slot[1];

        return groupStandings[groupName]?.[position - 1]?.team ?? slot;
    }

    if (slot.startsWith("3")) {
        const allowedGroups = slot.slice(1).split("");
        const bestThirds = getBestThirdPlacedTeams(groupStandings);

        const matchingThird = bestThirds.find(
            (third) => third && allowedGroups.includes(third.groupName)
        );

        return matchingThird?.team ?? slot;
    }

    return slot;
}

export function resolveRoundOf32(
    groupStandings: Record<string, TeamStanding[]>
) {
    const usedTeams = new Set<string>();

    const bestThirds = getBestThirdPlacedTeams(groupStandings);

    return roundOf32Slots.map((match) => {
        const homeTeam = resolveSingleSlot(
            match.homeSlot,
            groupStandings,
            bestThirds,
            usedTeams
        );

        if (homeTeam) {
            usedTeams.add(homeTeam);
        }

        const awayTeam = resolveSingleSlot(
            match.awaySlot,
            groupStandings,
            bestThirds,
            usedTeams
        );

        if (awayTeam) {
            usedTeams.add(awayTeam);
        }

        return {
            ...match,
            homeTeam,
            awayTeam,
        };
    });
}

function resolveSingleSlot(
    slot: string,
    groupStandings: Record<string, TeamStanding[]>,
    bestThirds: ReturnType<typeof getBestThirdPlacedTeams>,
    usedTeams: Set<string>
) {
    if (slot.length === 2) {
        const position = Number(slot[0]);
        const groupName = slot[1];

        const team = groupStandings[groupName]?.[position - 1]?.team;

        if (!team || usedTeams.has(team)) return slot;

        return team;
    }

    if (slot.startsWith("3")) {
        const allowedGroups = slot.slice(1).split("");

        const matchingThird = bestThirds.find(
            (third) =>
                third &&
                allowedGroups.includes(third.groupName) &&
                !usedTeams.has(third.team)
        );

        return matchingThird?.team ?? slot;
    }

    return slot;
}