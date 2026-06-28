import { calculateRealGroupStandings } from "@/lib/groupStandings";
import { generateBracketTree, resolveRoundOf32 } from "@/lib/knockout";
import { calculateSingleKnockoutMatchPoints } from "@/lib/knockoutScoring";
import { flagUrl } from "@/lib/flags";

import type {
    KnockoutResult,
    Match,
    PublicKnockoutPrediction,
} from "@/types";

type PublicKnockoutMatchesProps = {
    matches: Match[];
    publicKnockoutPredictions: PublicKnockoutPrediction[];
    knockoutResults: Record<number, KnockoutResult>;
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
        hour: "2-digit",
        minute: "2-digit",
    }).format(new Date(kickoff));
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

function hasStarted(kickoff: string) {
    return new Date() >= new Date(kickoff);
}

export function PublicKnockoutMatches({
    matches,
    publicKnockoutPredictions,
    knockoutResults,
}: PublicKnockoutMatchesProps) {
    const users = Array.from(
        new Set(
            publicKnockoutPredictions
                .map((prediction) => prediction.users?.name)
                .filter(Boolean)
        )
    );

    const groupStandings = calculateRealGroupStandings(matches);
    const roundOf32Matches = resolveRoundOf32(groupStandings);

    const userBrackets = users.map((userName) => {
        const userPredictions = publicKnockoutPredictions.filter(
            (prediction) => prediction.users?.name === userName
        );

        const predictionsByMatch = Object.fromEntries(
            userPredictions.map((prediction) => [prediction.match_id, prediction])
        );

        const bracket = generateBracketTree(roundOf32Matches, predictionsByMatch);

        return {
            userName,
            predictionsByMatch,
            bracket,
        };
    });

    const baseBracket = generateBracketTree(roundOf32Matches, {});

    const visibleMatches = baseBracket.matches.filter(
        (match) => isResolvedTeam(match.homeTeam) && isResolvedTeam(match.awayTeam)
    );

    const played = visibleMatches
        .filter((match) => hasStarted(match.kickoff))
        .sort(
            (a, b) =>
                new Date(b.kickoff).getTime() - new Date(a.kickoff).getTime()
        );

    const pending = visibleMatches
        .filter((match) => !hasStarted(match.kickoff))
        .sort(
            (a, b) =>
                new Date(a.kickoff).getTime() - new Date(b.kickoff).getTime()
        );

    function renderMatchCard(match: (typeof visibleMatches)[number]) {
        return (
            <details key={match.id} className="card public-match-card">
                <summary className="public-match-summary">
                    <div className="compact-match">
                        <div className="team-left">
                            <Flag team={match.homeTeam} />
                            <span>{match.homeTeam}</span>
                        </div>

                        <div className="score-center">
                            <strong>vs</strong>
                        </div>

                        <div className="team-right">
                            <Flag team={match.awayTeam} />
                            <span>{match.awayTeam}</span>
                        </div>
                    </div>

                    <div className="match-footer">
                        <span>
                            {groupByRound(match.id)} · {formatKickoff(match.kickoff)}
                        </span>
                        <span>Veure porres</span>
                    </div>
                </summary>

                <div className="public-predictions-list">
                    {userBrackets.map(({ userName, predictionsByMatch, bracket }) => {
                        const userMatch = bracket.matches.find((item) => item.id === match.id);
                        const prediction = predictionsByMatch[match.id];

                        if (!userMatch) return null;

                        const pointDetails = calculateSingleKnockoutMatchPoints({
                            matches,
                            publicKnockoutPredictions,
                            knockoutResults,
                            userName: userName ?? "",
                            matchId: match.id,
                        });

                        return (
                            <div key={userName} className="public-prediction-row">
                                <span>{userName}</span>

                                <span className="muted">
                                    {userMatch.homeTeam} - {userMatch.awayTeam}
                                </span>

                                <strong>
                                    {prediction?.predicted_home ?? "-"} -{" "}
                                    {prediction?.predicted_away ?? "-"}
                                </strong>

                                {prediction?.qualified_team ? (
                                    <span className="badge">Passa {prediction.qualified_team}</span>
                                ) : (
                                    <span />
                                )}

                                {pointDetails.length > 0 && (
                                    <div className="public-knockout-points">
                                        {pointDetails.map((detail, index) => (
                                            <span key={index} className="badge">
                                                🏅 +{detail.points} {detail.reason}
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </details>
        );
    }

    return (
        <>
            <h2 className="section-title">Partits de les eliminatòries</h2>

            {played.length > 0 && (
                <>
                    <h3 className="subsection-title">Partits jugats</h3>
                    <div className="matches-grid">{played.map(renderMatchCard)}</div>
                </>
            )}

            {pending.length > 0 && (
                <>
                    <h3 className="subsection-title">Partits per jugar</h3>
                    <div className="matches-grid">{pending.map(renderMatchCard)}</div>
                </>
            )}
        </>
    );
}