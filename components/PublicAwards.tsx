import type { PublicAwardPrediction } from "@/types";

const awardLabels: Record<string, string> = {
    golden_boot_1: "Bota d'Or",
    golden_boot_2: "Bota de Plata",
    golden_boot_3: "Bota de Bronze",
    golden_ball_1: "Pilota d'Or",
    golden_ball_2: "Pilota de Plata",
    golden_ball_3: "Pilota de Bronze",
};

type PublicAwardsProps = {
    publicAwardPredictions: PublicAwardPrediction[];
};

export function PublicAwards({ publicAwardPredictions }: PublicAwardsProps) {
    return (
        <>
            <h2>Premis individuals pronosticats</h2>

            {publicAwardPredictions.length === 0 && (
                <p>Encara no hi ha premis individuals pronosticats.</p>
            )}

            {publicAwardPredictions.map((prediction, index) => (
                <div key={index} className="card">
                    <div className="card-title">
                        <strong>{prediction.users?.name}</strong>
                        <span className="badge">
                            {awardLabels[prediction.award_key] ?? prediction.award_key}
                        </span>
                    </div>

                    <div>
                        Pronòstic: <strong>{prediction.player_name}</strong>
                    </div>
                </div>
            ))}
        </>
    );
}