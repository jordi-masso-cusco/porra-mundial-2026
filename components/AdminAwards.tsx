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
                    <div key={award.key} className="card">
                        <div className="card-title">
                            <strong>{award.label}</strong>
                            <span className="badge">Oficial</span>
                        </div>

                        <div className="score-row">
                            <input
                                value={result?.player_name ?? ""}
                                onChange={(e) => onResultChange(award.key, e.target.value)}
                                placeholder="Guanyador real"
                                style={{ flex: 1 }}
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