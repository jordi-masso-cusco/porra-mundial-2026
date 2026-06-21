import type { Match, PublicKnockoutPrediction } from "@/types";
import { calculateRealGroupStandings } from "@/lib/groupStandings";
import { generateBracketTree, resolveRoundOf32 } from "@/lib/knockout";
import { flagUrl } from "@/lib/flags";

type PublicKnockoutPredictionsProps = {
    matches: Match[];
    publicKnockoutPredictions: PublicKnockoutPrediction[];
};

function Flag({ team }: { team: string }) {
    const url = flagUrl(team);
    if (!url) return null;
    return <img src={url} alt="" className="flag" />;
}

function isResolvedTeam(team: string) {
    return !team.match(/^[123GP][A-Z0-9]+$/);
}

function groupByRound(matchId: number) {
    if (matchId >= 1 && matchId <= 16) return "Setzens de final";
    if (matchId >= 17 && matchId <= 24) return "Vuitens de final";
    if (matchId >= 25 && matchId <= 28) return "Quarts de final";
    if (matchId >= 29 && matchId <= 30) return "Semifinals";
    if (matchId === 31) return "Partit pel 3r lloc";
    if (matchId === 32) return "Final";
    return "Altres";
}

export function PublicKnockoutPredictions({
    matches,
    publicKnockoutPredictions,
}: PublicKnockoutPredictionsProps) {
    const users = Array.from(
        new Set(
            publicKnockoutPredictions
                .map((prediction) => prediction.users?.name)
                .filter(Boolean)
        )
    );

    const groupStandings = calculateRealGroupStandings(matches);
    const roundOf32Matches = resolveRoundOf32(groupStandings);

    return (
        <>
            <h2 className="section-title">Eliminatòries dels participants</h2>

            {users.length === 0 && (
                <p className="muted">
                    Encara no hi ha pronòstics d’eliminatòries desats.
                </p>
            )}

            {users.map((userName) => {
                if (!userName) return null;

                const userPredictions = publicKnockoutPredictions.filter(
                    (prediction) => prediction.users?.name === userName
                );

                const predictionsByMatch = Object.fromEntries(
                    userPredictions.map((prediction) => [
                        prediction.match_id,
                        prediction,
                    ])
                );

                const bracket = generateBracketTree(roundOf32Matches, predictionsByMatch);

                const visibleMatches = bracket.matches.filter(
                    (match) =>
                        isResolvedTeam(match.homeTeam) &&
                        isResolvedTeam(match.awayTeam)
                );

                const rounds = Array.from(
                    new Set(visibleMatches.map((match) => groupByRound(match.id)))
                );

                return (
                    <details key={userName} className="card">
                        <summary style={{ cursor: "pointer" }}>
                            <strong>{userName}</strong>
                        </summary>

                        <div style={{ marginTop: "16px" }}>
                            {rounds.map((roundName) => (
                                <section key={roundName} style={{ marginTop: "16px" }}>
                                    <h3 className="subsection-title">{roundName}</h3>

                                    {visibleMatches
                                        .filter((match) => groupByRound(match.id) === roundName)
                                        .map((match) => {
                                            const prediction = predictionsByMatch[match.id];

                                            return (
                                                <div key={match.id} className="public-knockout-card">
                                                    <div className="match-footer" style={{ marginTop: 0 }}>
                                                        <strong>Partit {match.id}</strong>

                                                        {prediction?.qualified_team && (
                                                            <span className="badge">
                                                                Passa {prediction.qualified_team}
                                                            </span>
                                                        )}
                                                    </div>

                                                    <div className="compact-match" style={{ marginTop: "10px" }}>
                                                        <div className="team-left">
                                                            {isResolvedTeam(match.homeTeam) && <Flag team={match.homeTeam} />}
                                                            <span>{match.homeTeam}</span>
                                                        </div>

                                                        <div className="score-center">
                                                            <strong>
                                                                {prediction?.predicted_home ?? "-"} -{" "}
                                                                {prediction?.predicted_away ?? "-"}
                                                            </strong>
                                                        </div>

                                                        <div className="team-right">
                                                            {isResolvedTeam(match.awayTeam) && <Flag team={match.awayTeam} />}
                                                            <span>{match.awayTeam}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                </section>
                            ))}
                        </div>
                    </details>
                );
            })}
        </>
    );
}