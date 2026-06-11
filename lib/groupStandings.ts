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

function sortStandings(standings: Record<string, TeamStanding>) {
  return Object.values(standings).sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.goalDifference !== a.goalDifference) {
      return b.goalDifference - a.goalDifference;
    }
    return b.goalsFor - a.goalsFor;
  });
}

export function calculateRealGroupStandings(matches: Match[]) {
  const groups: Record<string, Record<string, TeamStanding>> = {};

  for (const match of matches) {
    if (match.home_score === null || match.away_score === null) continue;

    if (!groups[match.group_name]) {
      groups[match.group_name] = {};
    }

    const home = getOrCreateTeam(groups[match.group_name], match.home_team);
    const away = getOrCreateTeam(groups[match.group_name], match.away_team);

    home.goalsFor += match.home_score;
    home.goalsAgainst += match.away_score;

    away.goalsFor += match.away_score;
    away.goalsAgainst += match.home_score;

    if (match.home_score > match.away_score) {
      home.points += 3;
    } else if (match.home_score < match.away_score) {
      away.points += 3;
    } else {
      home.points += 1;
      away.points += 1;
    }

    home.goalDifference = home.goalsFor - home.goalsAgainst;
    away.goalDifference = away.goalsFor - away.goalsAgainst;
  }

  return Object.fromEntries(
    Object.entries(groups).map(([groupName, standings]) => [
      groupName,
      sortStandings(standings),
    ])
  );
}

export function calculatePredictedGroupStandings(
  matches: Match[],
  publicPredictions: PublicPrediction[],
  userName: string
) {
  const groups: Record<string, Record<string, TeamStanding>> = {};

  const userPredictions = publicPredictions.filter(
    (prediction) => prediction.users?.name === userName
  );

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

  return Object.fromEntries(
    Object.entries(groups).map(([groupName, standings]) => [
      groupName,
      sortStandings(standings),
    ])
  );
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