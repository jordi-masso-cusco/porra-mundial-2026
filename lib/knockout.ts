import type { TeamStanding } from "@/lib/groupStandings";

export type BracketResolvedMatch = {
    id: number;
    label: string;
    homeTeam: string;
    awayTeam: string;
    winner: string | null;
    kickoff: string;
    side: "left" | "right" | "center";
};

export type KnockoutMatchSlot = {
    id: number;
    homeSlot: string;
    awaySlot: string;
    side: "left" | "right";
    kickoff: string;
};

const manualThirdPlaceAssignments: Record<string, string> = {
    "1E": "3D",
    "1I": "3F",
    "1G": "3A",
    "1A": "3E",
    "1L": "3I",
    "1B": "3J",
    "1K": "3L",
    "1D": "3B",
};

export const roundOf32Slots: KnockoutMatchSlot[] = [
    // Costat esquerre
    {
        id: 2,
        homeSlot: "1E",
        awaySlot: "3ABCDF",
        side: "left",
        kickoff: "2026-06-29T22:30:00",
    },
    {
        id: 5,
        homeSlot: "1I",
        awaySlot: "3CDFGH",
        side: "left",
        kickoff: "2026-06-30T23:00:00",
    },
    {
        id: 1,
        homeSlot: "2A",
        awaySlot: "2B",
        side: "left",
        kickoff: "2026-06-28T21:00:00",
    },
    {
        id: 3,
        homeSlot: "1F",
        awaySlot: "2C",
        side: "left",
        kickoff: "2026-06-30T03:00:00",
    },

    {
        id: 11,
        homeSlot: "2K",
        awaySlot: "2L",
        side: "left",
        kickoff: "2026-07-03T01:00:00",
    },
    {
        id: 12,
        homeSlot: "1H",
        awaySlot: "2J",
        side: "left",
        kickoff: "2026-07-02T21:00:00",
    },
    {
        id: 9,
        homeSlot: "1D",
        awaySlot: "3BEFIJ",
        side: "left",
        kickoff: "2026-07-02T02:00:00",
    },
    {
        id: 10,
        homeSlot: "1G",
        awaySlot: "3AEHIJ",
        side: "left",
        kickoff: "2026-07-01T22:00:00",
    },

    // Costat dret
    {
        id: 4,
        homeSlot: "1C",
        awaySlot: "2F",
        side: "right",
        kickoff: "2026-06-29T19:00:00",
    },
    {
        id: 6,
        homeSlot: "2E",
        awaySlot: "2I",
        side: "right",
        kickoff: "2026-06-30T19:00:00",
    },
    {
        id: 7,
        homeSlot: "1A",
        awaySlot: "3CEFHI",
        side: "right",
        kickoff: "2026-07-01T03:00:00",
    },
    {
        id: 8,
        homeSlot: "1L",
        awaySlot: "3EHIJK",
        side: "right",
        kickoff: "2026-07-01T18:00:00",
    },
    {
        id: 14,
        homeSlot: "1J",
        awaySlot: "2H",
        side: "right",
        kickoff: "2026-07-04T00:00:00",
    },
    {
        id: 16,
        homeSlot: "2D",
        awaySlot: "2G",
        side: "right",
        kickoff: "2026-07-03T20:00:00",
    },
    {
        id: 13,
        homeSlot: "1B",
        awaySlot: "3EFGIJ",
        side: "right",
        kickoff: "2026-07-03T05:00:00",
    },
    {
        id: 15,
        homeSlot: "1K",
        awaySlot: "3DEIJL",
        side: "right",
        kickoff: "2026-07-04T03:30:00",
    },
];

export type KnockoutRound = {
    id: number;
    label: string;
    homeSource: string;
    awaySource: string;
    kickoff: string;
    side: "left" | "right" | "center";
};

export const knockoutRounds: KnockoutRound[] = [
    // Vuitens
    { id: 17, label: "Vuitens 1", homeSource: "G1", awaySource: "G3", kickoff: "2026-07-04T19:00:00", side: "left" },
    { id: 18, label: "Vuitens 2", homeSource: "G2", awaySource: "G5", kickoff: "2026-07-04T23:00:00", side: "left" },
    { id: 19, label: "Vuitens 3", homeSource: "G4", awaySource: "G6", kickoff: "2026-07-05T22:00:00", side: "right" },
    { id: 20, label: "Vuitens 4", homeSource: "G7", awaySource: "G8", kickoff: "2026-07-06T02:00:00", side: "right" },
    { id: 21, label: "Vuitens 5", homeSource: "G11", awaySource: "G12", kickoff: "2026-07-06T21:00:00", side: "left" },
    { id: 22, label: "Vuitens 6", homeSource: "G9", awaySource: "G10", kickoff: "2026-07-07T02:00:00", side: "left" },
    { id: 23, label: "Vuitens 7", homeSource: "G14", awaySource: "G16", kickoff: "2026-07-07T18:00:00", side: "right" },
    { id: 24, label: "Vuitens 8", homeSource: "G13", awaySource: "G15", kickoff: "2026-07-07T22:00:00", side: "right" },

    // Quarts
    { id: 25, label: "Quarts 1", homeSource: "G17", awaySource: "G18", kickoff: "2026-07-09T22:00:00", side: "left" },
    { id: 26, label: "Quarts 2", homeSource: "G21", awaySource: "G22", kickoff: "2026-07-10T21:00:00", side: "left" },
    { id: 27, label: "Quarts 3", homeSource: "G19", awaySource: "G20", kickoff: "2026-07-11T23:00:00", side: "right" },
    { id: 28, label: "Quarts 4", homeSource: "G23", awaySource: "G24", kickoff: "2026-07-12T03:00:00", side: "right" },

    // Semifinals
    { id: 29, label: "Semifinal 1", homeSource: "G25", awaySource: "G26", kickoff: "2026-07-14T21:00:00", side: "left" },
    { id: 30, label: "Semifinal 2", homeSource: "G27", awaySource: "G28", kickoff: "2026-07-15T21:00:00", side: "right" },

    // Tercer lloc
    { id: 31, label: "Tercer lloc", homeSource: "P29", awaySource: "P30", kickoff: "2026-07-18T21:00:00", side: "center" },

    // Final
    { id: 32, label: "Final", homeSource: "G29", awaySource: "G30", kickoff: "2026-07-19T21:00:00", side: "center" },
];

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

function getThirdSlotKey(slot: string) {
    return slot.startsWith("3") ? slot : null;
}

function assignThirdPlacedTeams(
    bestThirds: ReturnType<typeof getBestThirdPlacedTeams>
) {
    const thirdSlots = roundOf32Slots
        .map((match) => match.awaySlot)
        .filter((slot) => slot.startsWith("3"));

    const assignment: Record<string, string> = {};
    const usedGroups = new Set<string>();

    const orderedSlots = [...thirdSlots].sort(
        (a, b) => a.length - b.length
    );

    function backtrack(index: number): boolean {
        if (index === orderedSlots.length) return true;

        const slot = orderedSlots[index];
        const allowedGroups = slot.slice(1).split("");

        for (const third of bestThirds) {
            if (!third) continue;
            if (usedGroups.has(third.groupName)) continue;
            if (!allowedGroups.includes(third.groupName)) continue;

            assignment[slot] = third.team;
            usedGroups.add(third.groupName);

            if (backtrack(index + 1)) return true;

            delete assignment[slot];
            usedGroups.delete(third.groupName);
        }

        return false;
    }

    backtrack(0);

    return assignment;
}

function resolveFixedSlot(
    slot: string,
    groupStandings: Record<string, TeamStanding[]>
) {
    const position = Number(slot[0]);
    const groupName = slot[1];

    return groupStandings[groupName]?.[position - 1]?.team ?? slot;
}

function resolveThirdSlot(
    assignedThirdSlot: string,
    groupStandings: Record<string, TeamStanding[]>
) {
    const groupName = assignedThirdSlot[1];
    return groupStandings[groupName]?.[2]?.team ?? assignedThirdSlot;
}

function resolveRoundOf32Slot(
    slot: string,
    opponentSlot: string,
    groupStandings: Record<string, TeamStanding[]>
) {
    if (!slot.startsWith("3")) {
        return resolveFixedSlot(slot, groupStandings);
    }

    if (slot.length === 2) {
        return resolveThirdSlot(slot, groupStandings);
    }

    const assignmentKey = !opponentSlot.startsWith("3") ? opponentSlot : slot;
    const assignedThirdSlot = manualThirdPlaceAssignments[assignmentKey];

    if (!assignedThirdSlot) return slot;

    return resolveThirdSlot(assignedThirdSlot, groupStandings);
}

export function resolveRoundOf32(
    groupStandings: Record<string, TeamStanding[]>
) {
    return roundOf32Slots.map((match) => {
        const homeTeam = resolveRoundOf32Slot(
            match.homeSlot,
            match.awaySlot,
            groupStandings
        );

        const awayTeam = resolveRoundOf32Slot(
            match.awaySlot,
            match.homeSlot,
            groupStandings
        );

        return {
            ...match,
            homeTeam,
            awayTeam,
        };
    });
}

export function generateBracketTree(
    roundOf32Matches: ReturnType<typeof resolveRoundOf32>,
    predictions: Record<number, { qualified_team: string | null }> = {}
) {
    const winners: Record<string, string> = {};

    const resolvedRoundOf32: BracketResolvedMatch[] = roundOf32Matches.map(
        (match) => {
            const winner = predictions[match.id]?.qualified_team ?? null;

            const loser =
                winner === match.homeTeam
                    ? match.awayTeam
                    : winner === match.awayTeam
                        ? match.homeTeam
                        : null;

            if (winner) winners[`G${match.id}`] = winner;
            if (loser) winners[`P${match.id}`] = loser;

            return {
                id: match.id,
                label: `Setzens ${match.id}`,
                homeTeam: match.homeTeam,
                awayTeam: match.awayTeam,
                winner,
                kickoff: match.kickoff,
                side: match.side,
            };
        }
    );

    const resolvedLaterRounds: BracketResolvedMatch[] = knockoutRounds.map(
        (match) => {
            const homeTeam = winners[match.homeSource] ?? match.homeSource;
            const awayTeam = winners[match.awaySource] ?? match.awaySource;

            const winner = predictions[match.id]?.qualified_team ?? null;

            const loser =
                winner === homeTeam
                    ? awayTeam
                    : winner === awayTeam
                        ? homeTeam
                        : null;

            if (winner) winners[`G${match.id}`] = winner;
            if (loser) winners[`P${match.id}`] = loser;

            return {
                id: match.id,
                label: match.label,
                homeTeam,
                awayTeam,
                winner,
                kickoff: match.kickoff,
                side: match.side,
            };
        }
    );

    return {
        matches: [...resolvedRoundOf32, ...resolvedLaterRounds],
        winners,
    };
}