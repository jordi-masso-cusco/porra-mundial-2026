import type { Match, Prediction } from "@/types";
import { flagUrl } from "@/lib/flags";

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

export function PredictionList({
    matches,
    predictions,
    predictionsClosed,
    onPredictionChange,
    onSaveAllPredictions,
}: PredictionListProps) {
    const matchesByGroup = groupMatchesByGroup(matches);

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

            {Object.entries(matchesByGroup).map(([groupName, groupMatches]) => (
                <section key={groupName} className="group-section">
                    <h3>Grup {groupName}</h3>

                    <div className="matches-grid">
                        {groupMatches.map((match) => {
                            const prediction = predictions[match.id];

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
                                                disabled={predictionsClosed}
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
                                                disabled={predictionsClosed}
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

                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </section>
            ))}
        </>
    );
}