import type { PublicAwardPrediction } from "@/types";

const awardLabels: Record<string, string> = {
    golden_boot_1: "Bota d'Or",
    golden_boot_2: "Bota de Plata",
    golden_boot_3: "Bota de Bronze",
    golden_ball_1: "Pilota d'Or",
    golden_ball_2: "Pilota de Plata",
    golden_ball_3: "Pilota de Bronze",
};

const awardPoints: Record<string, number> = {
    golden_boot_1: 50,
    golden_boot_2: 25,
    golden_boot_3: 10,
    golden_ball_1: 50,
    golden_ball_2: 25,
    golden_ball_3: 10,
};

type PublicAwardsProps = {
    publicAwardPredictions: PublicAwardPrediction[];
    awardResults: Record<string, { award_key: string; player_name: string }>;
};

function normalize(value: string) {
    return value.trim().toLowerCase();
}

function getAwardPoints(prediction: PublicAwardPrediction, realPlayer?: string) {
    if (!realPlayer) return null;

    if (normalize(prediction.player_name) === normalize(realPlayer)) {
        return awardPoints[prediction.award_key] ?? 0;
    }

    return 0;
}

function groupByAward(predictions: PublicAwardPrediction[]) {
    return predictions.reduce<Record<string, PublicAwardPrediction[]>>(
        (groups, prediction) => {
            if (!groups[prediction.award_key]) {
                groups[prediction.award_key] = [];
            }

            groups[prediction.award_key].push(prediction);
            return groups;
        },
        {}
    );
}

export function PublicAwards({
    publicAwardPredictions,
    awardResults,
}: PublicAwardsProps) {
    const groupedAwards = groupByAward(publicAwardPredictions);

    return (
        <>
            <h2  className="section-title">Premis individuals pronosticats</h2>

            {publicAwardPredictions.length === 0 && (
                <p>Encara no hi ha premis individuals pronosticats.</p>
            )}

            {Object.entries(groupedAwards).map(([awardKey, predictions]) => {
                const officialResult = awardResults[awardKey];

                return (
                    <div key={awardKey} className="card">
                        <div className="card-title">
                            <strong>{awardLabels[awardKey] ?? awardKey}</strong>

                            {officialResult ? (
                                <span className="badge">
                                    Oficial: {officialResult.player_name}
                                </span>
                            ) : (
                                <span className="badge">Pendent</span>
                            )}
                        </div>

                        {predictions.map((prediction, index) => {
                            const points = getAwardPoints(
                                prediction,
                                officialResult?.player_name
                            );

                            return (
                                <div
                                    key={index}
                                    style={{
                                        display: "grid",
                                        gridTemplateColumns: "1fr auto auto",
                                        gap: "12px",
                                        alignItems: "center",
                                        borderTop: index === 0 ? "0" : "1px solid #eee",
                                        paddingTop: index === 0 ? "0" : "8px",
                                        marginTop: index === 0 ? "8px" : "8px",
                                    }}
                                >
                                    <span>{prediction.users?.name}</span>

                                    <strong>{prediction.player_name}</strong>

                                    {points !== null && (
                                        <span className="badge">+{points}</span>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                );
            })}
        </>
    );
}