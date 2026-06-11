import type { PublicPrediction } from "@/types";

type PublicPredictionsProps = {
    publicPredictions: PublicPrediction[];
};

export function PublicPredictions({
    publicPredictions,
}: PublicPredictionsProps) {
    return (
        <>
            <h2>Porres dels altres</h2>

            {publicPredictions.length === 0 && <p>Encara no hi ha pronòstics.</p>}

            {publicPredictions.map((prediction, index) => (
                <div key={index} className="card">
                    <div className="card-title">
                        <strong>{prediction.users?.name}</strong>
                        <span className="badge">
                            Grup {prediction.matches?.group_name}
                        </span>
                    </div>

                    <div className="muted">
                        {prediction.matches?.home_team} - {prediction.matches?.away_team}
                    </div>

                    <div style={{ marginTop: "8px" }}>
                        Pronòstic:{" "}
                        <strong>
                            {prediction.predicted_home} - {prediction.predicted_away}
                        </strong>
                    </div>
                </div>
            ))}
        </>
    );
}