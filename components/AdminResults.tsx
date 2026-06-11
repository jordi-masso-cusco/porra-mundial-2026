import type { Match } from "@/types";

type AdminResultsProps = {
    matches: Match[];
    onResultChange: (
        matchId: number,
        field: "home_score" | "away_score",
        value: string
    ) => void;
    onSaveResult: (matchId: number) => void;
};

export function AdminResults({
    matches,
    onResultChange,
    onSaveResult,
}: AdminResultsProps) {
    return (
        <>
            <h2>Resultats oficials</h2>

            {matches.map((match) => (
                <div
                    key={match.id}
                    className="card"
                >
                    <strong>
                        {match.home_team} - {match.away_team}
                    </strong>

                    <div style={{ marginBottom: "8px" }}>Grup {match.group_name}</div>

                    <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                        <input
                            type="number"
                            min="0"
                            value={match.home_score ?? ""}
                            onChange={(e) =>
                                onResultChange(match.id, "home_score", e.target.value)
                            }
                            style={{ width: "64px", padding: "8px" }}
                        />

                        <span>-</span>

                        <input
                            type="number"
                            min="0"
                            value={match.away_score ?? ""}
                            onChange={(e) =>
                                onResultChange(match.id, "away_score", e.target.value)
                            }
                            style={{ width: "64px", padding: "8px" }}
                        />

                        <button onClick={() => onSaveResult(match.id)}>Desar resultat</button>
                    </div>
                </div>
            ))}
        </>
    );
}