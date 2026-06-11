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
  onAwardChange: (awardKey: string, value: string) => void;
  onSaveAward: (awardKey: string) => void;
};

export function AwardPredictions({
  predictions,
  onAwardChange,
  onSaveAward,
}: AwardPredictionsProps) {
  return (
    <>
      <h2>Premis individuals</h2>

      {awards.map((award) => {
        const prediction = predictions[award.key];

        return (
          <div
            key={award.key}
            style={{
              border: "1px solid #ccc",
              padding: "12px",
              marginBottom: "12px",
              borderRadius: "8px",
            }}
          >
            <strong>{award.label}</strong>
            <div style={{ marginBottom: "8px" }}>{award.points} punts</div>

            <div style={{ display: "flex", gap: "8px" }}>
              <input
                value={prediction?.player_name ?? ""}
                onChange={(e) => onAwardChange(award.key, e.target.value)}
                placeholder="Nom del jugador"
                style={{ padding: "8px", flex: 1 }}
              />

              <button onClick={() => onSaveAward(award.key)}>Desar</button>
            </div>
          </div>
        );
      })}
    </>
  );
}