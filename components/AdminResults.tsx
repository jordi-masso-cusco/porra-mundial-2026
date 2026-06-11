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
                <div key={match.id} className="card">
                    <div className="card-title">
                        <strong>
                            {match.home_team} - {match.away_team}
                        </strong>
                        <span className="badge">Grup {match.group_name}</span>
                    </div>

                    <div className="score-row">
                        <input
                            className="score-input"
                            type="number"
                            min="0"
                            value={match.home_score ?? ""}
                            onChange={(e) =>
                                onResultChange(match.id, "home_score", e.target.value)
                            }
                        />

                        <span>-</span>

                        <input
                            className="score-input"
                            type="number"
                            min="0"
                            value={match.away_score ?? ""}
                            onChange={(e) =>
                                onResultChange(match.id, "away_score", e.target.value)
                            }
                        />

                        <button onClick={() => onSaveResult(match.id)}>
                            Desar resultat
                        </button>
                    </div>
                </div>
            ))}
        </>
    );
}