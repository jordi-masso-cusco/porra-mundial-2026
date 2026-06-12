import type { Match, Prediction } from "@/types";
import { flagUrl } from "@/lib/flags";
import { getQualifiedTeams } from "@/lib/groupStandings";

type PredictionListProps = {
    matches: Match[];
    predictions: Record<number, Prediction>;
    predictionsClosed: boolean;
    onPredictionChange: (
        matchId: number,
        field: "predicted_home" | "predicted_away",
        value: string
    ) => void;
    onSaveAllPredictions: () => void;
};

type TeamStanding = {
    team: string;
    points: number;
    goalsFor: number;
    goalsAgainst: number;
    goalDifference: number;
};

function groupMatchesByGroup(matches: Match[]) {
    return matches.reduce<Record<string, Match[]>>((groups, match) => {
        if (!groups[match.group_name]) {
            groups[match.group_name] = [];
        }

        groups[match.group_name].push(match);
        return groups;
    }, {});
}

function formatKickoff(kickoff: string) {
    return new Intl.DateTimeFormat("ca-ES", {
        day: "2-digit",
        month: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
    }).format(new Date(kickoff));
}

function Flag({ team }: { team: string }) {
    const url = flagUrl(team);
    if (!url) return null;
    return <img src={url} alt="" className="flag" />;
}

function TeamName({ team }: { team: string }) {
    return (
        <span className="team-name">
            <Flag team={team} />
            {team}
        </span>
    );
}

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

function calculatePredictedStandings(
    groupMatches: Match[],
    predictions: Record<number, Prediction>
) {
    const standings: Record<string, TeamStanding> = {};

    for (const match of groupMatches) {
        const home = getOrCreateTeam(standings, match.home_team);
        const away = getOrCreateTeam(standings, match.away_team);

        const prediction = predictions[match.id];

        const predictedHome = prediction?.predicted_home ?? match.home_score;
        const predictedAway = prediction?.predicted_away ?? match.away_score;

        if (predictedHome === null || predictedAway === null) {
            continue;
        }

        home.goalsFor += predictedHome;
        home.goalsAgainst += predictedAway;

        away.goalsFor += predictedAway;
        away.goalsAgainst += predictedHome;

        if (predictedHome > predictedAway) {
            home.points += 3;
        } else if (predictedHome < predictedAway) {
            away.points += 3;
        } else {
            home.points += 1;
            away.points += 1;
        }

        home.goalDifference = home.goalsFor - home.goalsAgainst;
        away.goalDifference = away.goalsFor - away.goalsAgainst;
    }

    return Object.values(standings).sort((a, b) => {
        if (b.points !== a.points) return b.points - a.points;
        if (b.goalDifference !== a.goalDifference) {
            return b.goalDifference - a.goalDifference;
        }
        return b.goalsFor - a.goalsFor;
    });
}

function isExceptionMatchLocked(match: Match) {
    const isExceptionMatch =
        (match.home_team === "Mexico" && match.away_team === "South Africa") ||
        (match.home_team === "Korea Republic" && match.away_team === "Czechia");

    return isExceptionMatch && new Date() >= new Date(match.kickoff);
}

export function PredictionList({
    matches,
    predictions,
    predictionsClosed,
    onPredictionChange,
    onSaveAllPredictions,
}: PredictionListProps) {
    const matchesByGroup = groupMatchesByGroup(matches);

    const allPredictedGroupStandings = Object.fromEntries(
        Object.entries(matchesByGroup).map(([groupName, groupMatches]) => [
            groupName,
            calculatePredictedStandings(groupMatches, predictions),
        ])
    );

    const qualifiedTeams = getQualifiedTeams(allPredictedGroupStandings);

    return (
        <>
            <h2>Els meus pronòstics</h2>

            {predictionsClosed && (
                <p className="error">
                    Els pronòstics de la fase de grups estan tancats.
                </p>
            )}

            <button
                disabled={predictionsClosed}
                onClick={onSaveAllPredictions}
                style={{ marginBottom: "16px" }}
            >
                Desar tots els pronòstics
            </button>

            {Object.entries(matchesByGroup)
                .sort(([groupA], [groupB]) => groupA.localeCompare(groupB))
                .map(([groupName, groupMatches]) => {
                    const standingsRows = calculatePredictedStandings(
                        groupMatches,
                        predictions
                    );

                    return (
                        <section key={groupName} className="group-section">
                            <h3>Grup {groupName}</h3>

                            <div className="matches-grid">
                                {groupMatches.map((match) => {
                                    const prediction = predictions[match.id];
                                    const matchLocked =
                                        predictionsClosed || isExceptionMatchLocked(match);

                                    return (
                                        <div key={match.id} className="card">
                                            <div className="compact-match">
                                                <div className="team-left">
                                                    <Flag team={match.home_team} />
                                                    <span>{match.home_team}</span>
                                                </div>

                                                <div className="score-center">
                                                    <input
                                                        className="score-input"
                                                        type="number"
                                                        min="0"
                                                        disabled={matchLocked}
                                                        value={prediction?.predicted_home ?? ""}
                                                        onChange={(e) =>
                                                            onPredictionChange(
                                                                match.id,
                                                                "predicted_home",
                                                                e.target.value
                                                            )
                                                        }
                                                    />

                                                    <span>-</span>

                                                    <input
                                                        className="score-input"
                                                        type="number"
                                                        min="0"
                                                        disabled={matchLocked}
                                                        value={prediction?.predicted_away ?? ""}
                                                        onChange={(e) =>
                                                            onPredictionChange(
                                                                match.id,
                                                                "predicted_away",
                                                                e.target.value
                                                            )
                                                        }
                                                    />
                                                </div>

                                                <div className="team-right">
                                                    <Flag team={match.away_team} />
                                                    <span>{match.away_team}</span>
                                                </div>
                                            </div>

                                            <div className="match-footer">
                                                <span>{formatKickoff(match.kickoff)}</span>

                                                {matchLocked && <span>Pronòstic tancat</span>}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            <div className="card predicted-standings-card">
                                <h4 style={{ marginTop: 0 }}>Classificació pronosticada</h4>

                                {standingsRows.map((row, index) => (
                                    <div
                                        key={row.team}
                                        className={
                                            qualifiedTeams.has(row.team)
                                                ? "predicted-standing-row qualified-row"
                                                : "predicted-standing-row eliminated-row"
                                        }
                                    >
                                        <span className="predicted-standing-position">{index + 1}</span>

                                        <TeamName team={row.team} />

                                        <span className="predicted-standing-points">{row.points} pts</span>

                                        <span className="predicted-standing-dg">
                                            DG {row.goalDifference}
                                        </span>
                                    </div>
                                ))}
                            </div>                        </section>
                    );
                })}
        </>
    );
}