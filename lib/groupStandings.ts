import type { Match, PublicPrediction } from "@/types";

export type TeamStanding = {
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

function applyMatchToStandings(
    standings: Record<string, TeamStanding>,
    homeTeam: string,
    awayTeam: string,
    homeGoals: number,
    awayGoals: number
) {
    const home = getOrCreateTeam(standings, homeTeam);
    const away = getOrCreateTeam(standings, awayTeam);

    home.goalsFor += homeGoals;
    home.goalsAgainst += awayGoals;

    away.goalsFor += awayGoals;
    away.goalsAgainst += homeGoals;

    if (homeGoals > awayGoals) {
        home.points += 3;
    } else if (homeGoals < awayGoals) {
        away.points += 3;
    } else {
        home.points += 1;
        away.points += 1;
    }

    home.goalDifference = home.goalsFor - home.goalsAgainst;
    away.goalDifference = away.goalsFor - away.goalsAgainst;
}

function sortStandings(standings: Record<string, TeamStanding>) {
    return Object.values(standings).sort((a, b) => {
        if (b.points !== a.points) return b.points - a.points;
        if (b.goalDifference !== a.goalDifference) {
            return b.goalDifference - a.goalDifference;
        }
        return b.goalsFor - a.goalsFor;
    });
}

function sortGroups(groups: Record<string, Record<string, TeamStanding>>) {
    return Object.fromEntries(
        Object.entries(groups).map(([groupName, standings]) => [
            groupName,
            sortStandings(standings),
        ])
    );
}

export function calculateRealGroupStandings(matches: Match[]) {
    const groups: Record<string, Record<string, TeamStanding>> = {};

    for (const match of matches) {
        if (match.home_score === null || match.away_score === null) continue;

        if (!groups[match.group_name]) {
            groups[match.group_name] = {};
        }

        applyMatchToStandings(
            groups[match.group_name],
            match.home_team,
            match.away_team,
            match.home_score,
            match.away_score
        );
    }

    return sortGroups(groups);
}

export function calculatePredictedGroupStandings(
    matches: Match[],
    publicPredictions: PublicPrediction[],
    userName: string
) {
    const groups: Record<string, Record<string, TeamStanding>> = {};

    const predictionsByMatchId = new Map<number, PublicPrediction>();

    for (const prediction of publicPredictions) {
        if (prediction.users?.name !== userName) continue;
        if (!prediction.matches?.id) continue;

        predictionsByMatchId.set(prediction.matches.id, prediction);
    }

    for (const match of matches) {
        const prediction = predictionsByMatchId.get(match.id);

        const predictedHome =
            prediction?.predicted_home ?? match.home_score;

        const predictedAway =
            prediction?.predicted_away ?? match.away_score;

        if (predictedHome === null || predictedAway === null) continue;

        if (!groups[match.group_name]) {
            groups[match.group_name] = {};
        }

        applyMatchToStandings(
            groups[match.group_name],
            match.home_team,
            match.away_team,
            predictedHome,
            predictedAway
        );
    }

    return sortGroups(groups);
}

export function getQualifiedTeams(
    groupStandings: Record<string, TeamStanding[]>
) {
    const qualified = new Set<string>();
    const thirdPlacedTeams: TeamStanding[] = [];

    for (const rows of Object.values(groupStandings)) {
        if (rows[0]) qualified.add(rows[0].team);
        if (rows[1]) qualified.add(rows[1].team);
        if (rows[2]) thirdPlacedTeams.push(rows[2]);
    }

    thirdPlacedTeams
        .sort((a, b) => {
            if (b.points !== a.points) return b.points - a.points;
            if (b.goalDifference !== a.goalDifference) {
                return b.goalDifference - a.goalDifference;
            }
            return b.goalsFor - a.goalsFor;
        })
        .slice(0, 8)
        .forEach((team) => qualified.add(team.team));

    return qualified;
}