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
};

export function PredictionList({
    matches,
    predictions,
    predictionsClosed,
    onPredictionChange,
    onSavePrediction,
}: PredictionListProps) {
    return (
        <>
            <h2>Els meus pronòstics</h2>

            {predictionsClosed && (
                <p style={{ color: "red" }}>
                    Els pronòstics de la fase de grups estan tancats.
                </p>
            )}

            {matches.map((match) => {
                const prediction = predictions[match.id];

                return (
                    <div
                        key={match.id}
                        style={{
                            border: "1px solid #ccc",
                            padding: "12px",
                            marginBottom: "12px",
                            borderRadius: "8px",
                        }}
                    >
                        <strong>
                            {match.home_team} - {match.away_team}
                        </strong>

                        <div style={{ marginBottom: "8px" }}>Grup {match.group_name}</div>

                        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                            <input
                                type="number"
                                min="0"
                                disabled={predictionsClosed}
                                value={prediction?.predicted_home ?? ""}
                                onChange={(e) =>
                                    onPredictionChange(match.id, "predicted_home", e.target.value)
                                }
                                style={{ width: "64px", padding: "8px" }}
                            />

                            <span>-</span>

                            <input
                                type="number"
                                min="0"
                                disabled={predictionsClosed}
                                value={prediction?.predicted_away ?? ""}
                                onChange={(e) =>
                                    onPredictionChange(match.id, "predicted_away", e.target.value)
                                }
                                style={{ width: "64px", padding: "8px" }}
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
        </>
    );
}