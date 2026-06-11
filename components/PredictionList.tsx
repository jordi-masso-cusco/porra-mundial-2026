import type { Match, Prediction } from "@/types";

type PredictionListProps = {
    matches: Match[];
    predictions: Record<number, Prediction>;
    predictionsClosed: boolean;
    onPredictionChange: (
        matchId: number,
        field: "predicted_home" | "predicted_away",
        value: string
    ) => void;
    onSavePrediction: (matchId: number) => void;
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

export function PredictionList({
    matches,
    predictions,
    predictionsClosed,
    onPredictionChange,
    onSavePrediction,
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

                    {groupMatches.map((match) => {
                        const prediction = predictions[match.id];

                        return (
                            <div key={match.id} className="card">
                                <div className="card-title">
                                    <strong>
                                        {match.home_team} - {match.away_team}
                                    </strong>
                                    <span className="badge">Grup {match.group_name}</span>
                                </div>

                                <div className="muted">{formatKickoff(match.kickoff)}</div>

                                <div className="score-row">
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

                                    <button
                                        disabled={predictionsClosed}
                                        onClick={() => onSavePrediction(match.id)}
                                    >
                                        Desar
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </section>
            ))}
        </>
    );
}