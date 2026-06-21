import type { AwardPrediction } from "@/types";

type AwardDefinition = {
    key: string;
    label: string;
    points: number;
};

const awards: AwardDefinition[] = [
    { key: "golden_boot_1", label: "Bota d'Or", points: 50 },
    { key: "golden_boot_2", label: "Bota de Plata", points: 25 },
    { key: "golden_boot_3", label: "Bota de Bronze", points: 10 },
    { key: "golden_ball_1", label: "Pilota d'Or", points: 50 },
    { key: "golden_ball_2", label: "Pilota de Plata", points: 25 },
    { key: "golden_ball_3", label: "Pilota de Bronze", points: 10 },
];

type AwardPredictionsProps = {
    predictions: Record<string, AwardPrediction>;
    predictionsClosed: boolean;
    onAwardChange: (awardKey: string, value: string) => void;
    onSaveAward: (awardKey: string) => void;
};

export function AwardPredictions({
    predictions,
    predictionsClosed,
    onAwardChange,
    onSaveAward,
}: AwardPredictionsProps) {
    return (
        <>
            <h2  className="section-title">Premis individuals</h2>

            {predictionsClosed && (
                <p className="error">
                    Les votacions dels premis individuals estan tancades.
                </p>
            )}

            {awards.map((award) => {
                const prediction = predictions[award.key];

                return (
                    <div key={award.key} className="card">
                        <div className="card-title">
                            <strong>{award.label}</strong>
                            <span className="badge">{award.points} punts</span>
                        </div>

                        <div className="score-row">
                            <input
                                value={prediction?.player_name ?? ""}
                                onChange={(e) => onAwardChange(award.key, e.target.value)}
                                placeholder="Nom del jugador"
                                style={{ flex: 1 }}
                            />

                            <button disabled={predictionsClosed} onClick={() => onSaveAward(award.key)}>
                                Desar
                            </button>
                        </div>
                    </div>
                );
            })}
        </>
    );
}