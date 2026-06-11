import type { AwardResult } from "@/types";

const awards = [
  { key: "golden_boot_1", label: "Bota d'Or" },
  { key: "golden_boot_2", label: "Bota de Plata" },
  { key: "golden_boot_3", label: "Bota de Bronze" },
  { key: "golden_ball_1", label: "Pilota d'Or" },
  { key: "golden_ball_2", label: "Pilota de Plata" },
  { key: "golden_ball_3", label: "Pilota de Bronze" },
];

type AdminAwardsProps = {
  results: Record<string, AwardResult>;
  onResultChange: (awardKey: string, value: string) => void;
  onSaveResult: (awardKey: string) => void;
};

export function AdminAwards({
  results,
  onResultChange,
  onSaveResult,
}: AdminAwardsProps) {
  return (
    <>
      <h2>Resultats oficials dels premis</h2>

      {awards.map((award) => {
        const result = results[award.key];

        return (
          <div
            key={award.key}
            className="card"
          >
            <strong>{award.label}</strong>

            <div style={{ display: "flex", gap: "8px", marginTop: "8px" }}>
              <input
                value={result?.player_name ?? ""}
                onChange={(e) => onResultChange(award.key, e.target.value)}
                placeholder="Guanyador real"
                style={{ padding: "8px", flex: 1 }}
              />

              <button onClick={() => onSaveResult(award.key)}>
                Desar resultat
              </button>
            </div>
          </div>
        );
      })}
    </>
  );
}