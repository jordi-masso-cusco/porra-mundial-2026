import type { Match } from "@/types";

export function sortMatchesForDisplay(matches: Match[]) {
  const played = matches
    .filter(
      (match) =>
        match.home_score !== null &&
        match.home_score !== undefined &&
        match.away_score !== null &&
        match.away_score !== undefined
    )
    .sort(
      (a, b) =>
        new Date(b.kickoff).getTime() -
        new Date(a.kickoff).getTime()
    );

  const upcoming = matches
    .filter(
      (match) =>
        match.home_score === null ||
        match.home_score === undefined ||
        match.away_score === null ||
        match.away_score === undefined
    )
    .sort(
      (a, b) =>
        new Date(a.kickoff).getTime() -
        new Date(b.kickoff).getTime()
    );

  return [...played, ...upcoming];
}

export function sortMatchesForAdmin(matches: Match[]) {
  const played = matches
    .filter(
      (match) =>
        match.home_score !== null &&
        match.home_score !== undefined &&
        match.away_score !== null &&
        match.away_score !== undefined
    )
    .sort(
      (a, b) =>
        new Date(b.kickoff).getTime() - new Date(a.kickoff).getTime()
    );

  const pending = matches
    .filter(
      (match) =>
        match.home_score === null ||
        match.home_score === undefined ||
        match.away_score === null ||
        match.away_score === undefined
    )
    .sort(
      (a, b) =>
        new Date(a.kickoff).getTime() - new Date(b.kickoff).getTime()
    );

  return [...pending, ...played];
}

export function hasOfficialResult(match: Match) {
  return (
    match.home_score !== null &&
    match.home_score !== undefined &&
    match.away_score !== null &&
    match.away_score !== undefined
  );
}

export function splitMatchesByStatus(matches: Match[]) {
  const played = matches
    .filter(hasOfficialResult)
    .sort(
      (a, b) =>
        new Date(b.kickoff).getTime() - new Date(a.kickoff).getTime()
    );

  const pending = matches
    .filter((match) => !hasOfficialResult(match))
    .sort(
      (a, b) =>
        new Date(a.kickoff).getTime() - new Date(b.kickoff).getTime()
    );

  return { played, pending };
}