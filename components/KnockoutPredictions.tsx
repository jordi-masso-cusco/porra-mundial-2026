import type { KnockoutPrediction, Match } from "@/types";
import { calculateRealGroupStandings } from "@/lib/groupStandings";
import { generateBracketTree, resolveRoundOf32 } from "@/lib/knockout";
import { flagUrl } from "@/lib/flags";

type KnockoutPredictionsProps = {
    matches: Match[];
    predictions: Record<number, KnockoutPrediction>;
    onPredictionChange: (
        matchId: number,
        field: "predicted_home" | "predicted_away" | "qualified_team",
        value: string
    ) => void;
    onSaveAllPredictions: () => void;
    predictionsOpen: boolean;
};

function Flag({ team }: { team: string }) {
    const url = flagUrl(team);
    if (!url) return null;
    return <img src={url} alt="" className="flag" />;
}

function isResolvedTeam(team: string) {
    return !team.match(/^[123GP][A-Z0-9]+$/);
}

function formatKickoff(kickoff: string) {
    return new Intl.DateTimeFormat("ca-ES", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    }).format(new Date(kickoff));
}

type BracketMatch = ReturnType<typeof generateBracketTree>["matches"][number];

function KnockoutPredictionCard({
    match,
    prediction,
    predictionsOpen,
    onPredictionChange,
}: {
    match: BracketMatch;
    prediction?: KnockoutPrediction;
    predictionsOpen: boolean;
    onPredictionChange: KnockoutPredictionsProps["onPredictionChange"];
}) {
    const homePrediction = prediction?.predicted_home ?? "";
    const awayPrediction = prediction?.predicted_away ?? "";
    const qualifiedTeam = prediction?.qualified_team ?? "";

    const teamsAreResolved =
        isResolvedTeam(match.homeTeam) && isResolvedTeam(match.awayTeam);

    const isDraw =
        prediction?.predicted_home !== null &&
        prediction?.predicted_home !== undefined &&
        prediction?.predicted_away !== null &&
        prediction?.predicted_away !== undefined &&
        prediction.predicted_home === prediction.predicted_away;

    return (
        <div className="card">
            <div className="match-footer" style={{ marginTop: 0 }}>
                <strong>{match.label}</strong>
                <span>{formatKickoff(match.kickoff)}</span>
            </div>

            <div className="compact-match" style={{ marginTop: "12px" }}>
                <div className="team-left">
                    {isResolvedTeam(match.homeTeam) && <Flag team={match.homeTeam} />}
                    <span>{match.homeTeam}</span>
                </div>

                <div className="score-center">
                    <input
                        className="score-input"
                        type="number"
                        min="0"
                        disabled={!teamsAreResolved || !predictionsOpen}
                        value={homePrediction}
                        onChange={(e) =>
                            onPredictionChange(match.id, "predicted_home", e.target.value)
                        }
                    />

                    <span>-</span>

                    <input
                        className="score-input"
                        type="number"
                        min="0"
                        disabled={!teamsAreResolved || !predictionsOpen}
                        value={awayPrediction}
                        onChange={(e) =>
                            onPredictionChange(match.id, "predicted_away", e.target.value)
                        }
                    />
                </div>

                <div className="team-right">
                    {isResolvedTeam(match.awayTeam) && <Flag team={match.awayTeam} />}
                    <span>{match.awayTeam}</span>
                </div>
            </div>

            {isDraw ? (
                <div style={{ marginTop: "12px" }}>
                    <label>
                        <strong>Classificat</strong>
                    </label>

                    <select
                        value={qualifiedTeam}
                        disabled={!teamsAreResolved || !predictionsOpen}
                        onChange={(e) =>
                            onPredictionChange(match.id, "qualified_team", e.target.value)
                        }
                        style={{
                            display: "block",
                            width: "100%",
                            marginTop: "6px",
                            padding: "10px",
                            borderRadius: "10px",
                            border: "1px solid var(--border)",
                        }}
                    >
                        <option value="">Selecciona equip</option>
                        <option value={match.homeTeam}>{match.homeTeam}</option>
                        <option value={match.awayTeam}>{match.awayTeam}</option>
                    </select>
                </div>
            ) : qualifiedTeam ? (
                <p className="muted" style={{ marginTop: "12px" }}>
                    Classificat automàticament: <strong>{qualifiedTeam}</strong>
                </p>
            ) : (
                <p className="muted" style={{ marginTop: "12px" }}>
                    Introdueix un resultat per calcular l’equip classificat.
                </p>
            )}
        </div>
    );
}

export function KnockoutPredictions({
    matches,
    predictions,
    predictionsOpen,
    onPredictionChange,
    onSaveAllPredictions,
}: KnockoutPredictionsProps) {
    const groupStandings = calculateRealGroupStandings(matches);
    const roundOf32Matches = resolveRoundOf32(groupStandings);
    const bracket = generateBracketTree(roundOf32Matches, predictions);

    const renderRound = (title: string, fromId: number, toId: number) => {
        const roundMatches = bracket.matches.filter(
            (match) => match.id >= fromId && match.id <= toId
        );

        const hasResolvableMatches = roundMatches.some(
            (match) => isResolvedTeam(match.homeTeam) && isResolvedTeam(match.awayTeam)
        );

        if (!hasResolvableMatches) return null;

        return (
            <>
                <h2 className="section-title">{title}</h2>

                <div className="matches-grid">
                    {roundMatches.map((match) => (
                        <KnockoutPredictionCard
                            key={match.id}
                            match={match}
                            prediction={predictions[match.id]}
                            predictionsOpen={predictionsOpen}
                            onPredictionChange={onPredictionChange}
                        />
                    ))}
                </div>
            </>
        );
    };

    return (
        <>
            <h2 className="section-title">Pronòstics d’eliminatòries</h2>

            {!predictionsOpen && (
                <p className="error">
                    Els pronòstics d’eliminatòries encara no estan oberts o ja estan tancats.
                </p>
            )}

            <p className="muted">
                Introdueix el resultat als 90 minuts. Si hi ha empat, tria quin equip es
                classifica.
            </p>

            <button
                disabled={!predictionsOpen}
                onClick={onSaveAllPredictions}
                style={{ marginBottom: "16px" }}
            >
                Desar tots els pronòstics d&apos;eliminatòries
            </button>

            {renderRound("Setzens de final", 1, 16)}
            {renderRound("Vuitens de final", 17, 24)}
            {renderRound("Quarts de final", 25, 28)}
            {renderRound("Semifinals", 29, 30)}
            {renderRound("Partit pel 3r lloc", 31, 31)}
            {renderRound("Final", 32, 32)}
        </>
    );
}