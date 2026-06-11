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
        <div
          key={index}
          style={{
            border: "1px solid #ccc",
            padding: "12px",
            marginBottom: "12px",
            borderRadius: "8px",
          }}
        >
          <strong>{prediction.users?.name}</strong>

          <div>
            {prediction.matches?.home_team} - {prediction.matches?.away_team}
          </div>

          <div>
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