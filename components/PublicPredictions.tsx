import { useState } from "react";
import type { PublicPrediction } from "@/types";
import { flagUrl } from "@/lib/flags";

type PublicPredictionsProps = {
    publicPredictions: PublicPrediction[];
};

function getSign(home: number, away: number) {
    if (home > away) return "1";
    if (home < away) return "2";
    return "X";
}

function TeamName({ team }: { team: string }) {
    const url = flagUrl(team);

    return (
        <span className="team-name">
            {url && <img src={url} alt="" className="flag" />}
            <span>{team}</span>
        </span>
    );
}

function getPredictionPoints(prediction: PublicPrediction) {
    const match = prediction.matches;

    if (!match) return null;

    if (
        match.home_score === null ||
        match.home_score === undefined ||
        match.away_score === null ||
        match.away_score === undefined
    ) {
        return null;
    }

    if (
        prediction.predicted_home === null ||
        prediction.predicted_away === null
    ) {
        return null;
    }

    const exact =
        prediction.predicted_home === match.home_score &&
        prediction.predicted_away === match.away_score;

    if (exact) return 10;

    const signCorrect =
        getSign(prediction.predicted_home, prediction.predicted_away) ===
        getSign(match.home_score, match.away_score);

    return signCorrect ? 5 : 0;
}

function hasOfficialResult(prediction: PublicPrediction) {
    const match = prediction.matches;

    return (
        match?.home_score !== null &&
        match?.home_score !== undefined &&
        match?.away_score !== null &&
        match?.away_score !== undefined
    );
}

function formatKickoff(kickoff: string) {
    return new Intl.DateTimeFormat("ca-ES", {
        day: "2-digit",
        month: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
    }).format(new Date(kickoff));
}

function groupPredictionsByMatch(predictions: PublicPrediction[]) {
    const matches: Record<number, PublicPrediction[]> = {};

    for (const prediction of predictions) {
        const matchId = prediction.matches?.id ?? 0;

        if (!matches[matchId]) {
            matches[matchId] = [];
        }

        matches[matchId].push(prediction);
    }

    return Object.values(matches).sort((a, b) => {
        const matchA = a[0]?.matches;
        const matchB = b[0]?.matches;

        const matchAPlayed =
            matchA?.home_score !== null &&
            matchA?.home_score !== undefined &&
            matchA?.away_score !== null &&
            matchA?.away_score !== undefined;

        const matchBPlayed =
            matchB?.home_score !== null &&
            matchB?.home_score !== undefined &&
            matchB?.away_score !== null &&
            matchB?.away_score !== undefined;

        const kickoffA = new Date(matchA?.kickoff ?? "").getTime();
        const kickoffB = new Date(matchB?.kickoff ?? "").getTime();

        if (matchAPlayed && !matchBPlayed) return -1;
        if (!matchAPlayed && matchBPlayed) return 1;

        if (matchAPlayed && matchBPlayed) {
            return kickoffB - kickoffA;
        }

        return kickoffA - kickoffB;
    });
}

function splitPredictionGroupsByStatus(matchGroups: PublicPrediction[][]) {
    const played = matchGroups
        .filter((group) => {
            const match = group[0]?.matches;
            return (
                match?.home_score !== null &&
                match?.home_score !== undefined &&
                match?.away_score !== null &&
                match?.away_score !== undefined
            );
        })
        .sort(
            (a, b) =>
                new Date(b[0]?.matches?.kickoff ?? "").getTime() -
                new Date(a[0]?.matches?.kickoff ?? "").getTime()
        );

    const pending = matchGroups
        .filter((group) => {
            const match = group[0]?.matches;
            return (
                match?.home_score === null ||
                match?.home_score === undefined ||
                match?.away_score === null ||
                match?.away_score === undefined
            );
        })
        .sort(
            (a, b) =>
                new Date(a[0]?.matches?.kickoff ?? "").getTime() -
                new Date(b[0]?.matches?.kickoff ?? "").getTime()
        );

    return { played, pending };
}

export function PublicPredictions({
    publicPredictions,
}: PublicPredictionsProps) {
    const [selectedUser, setSelectedUser] = useState("all");

    const users = Array.from(
        new Set(
            publicPredictions
                .map((prediction) => prediction.users?.name)
                .filter(Boolean)
        )
    );

    const filteredPredictions =
        selectedUser === "all"
            ? publicPredictions
            : publicPredictions.filter(
                (prediction) => prediction.users?.name === selectedUser
            );

    const matchGroups = groupPredictionsByMatch(filteredPredictions);
    const { played, pending } = splitPredictionGroupsByStatus(matchGroups);

    return (
        <>
            <h2 className="section-title">Porres dels altres</h2>

            {publicPredictions.length === 0 && <p>Encara no hi ha pronòstics.</p>}

            {publicPredictions.length > 0 && (
                <div className="card">
                    <label>
                        <strong>Participant</strong>
                    </label>

                    <select
                        value={selectedUser}
                        onChange={(e) => setSelectedUser(e.target.value)}
                        style={{
                            display: "block",
                            width: "100%",
                            marginTop: "8px",
                            padding: "10px",
                            borderRadius: "10px",
                            border: "1px solid var(--border)",
                        }}
                    >
                        <option value="all">Tots</option>
                        {users.map((user) => (
                            <option key={user} value={user ?? ""}>
                                {user}
                            </option>
                        ))}
                    </select>
                </div>
            )}

            {played.length > 0 && (
                <>
                    <h3 className="subsection-title">Partits jugats</h3>
                    <div className="matches-grid">
                        {matchGroups.map((matchPredictions) => {
                            const match = matchPredictions[0]?.matches;
                            if (!match) return null;

                            const officialResultAvailable = hasOfficialResult(matchPredictions[0]);

                            return (
                                <details key={match.id} className="card public-match-card">
                                    <summary className="public-match-summary">
                                        <div className="compact-match">
                                            <div className="team-left">
                                                <TeamName team={match.home_team} />
                                            </div>

                                            <div className="score-center">
                                                {officialResultAvailable ? (
                                                    <strong>
                                                        {match.home_score} - {match.away_score}
                                                    </strong>
                                                ) : (
                                                    <span className="badge">Pendent</span>
                                                )}
                                            </div>

                                            <div className="team-right">
                                                <TeamName team={match.away_team} />
                                            </div>
                                        </div>

                                        <div className="match-footer">
                                            <span>{formatKickoff(match.kickoff)}</span>
                                            <span>Veure porres</span>
                                        </div>
                                    </summary>

                                    <div className="public-predictions-list">
                                        {matchPredictions.map((prediction, index) => {
                                            const points = getPredictionPoints(prediction);

                                            return (
                                                <div key={index} className="public-prediction-row">
                                                    <span>{prediction.users?.name}</span>

                                                    <strong>
                                                        {prediction.predicted_home} -{" "}
                                                        {prediction.predicted_away}
                                                    </strong>

                                                    {points !== null && points > 0 ? (
                                                        <span className="badge">+{points}</span>
                                                    ) : (
                                                        <span />
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </details>
                            );
                        })}
                    </div>
                </>
            )}

            {pending.length > 0 && (
                <>
                    <h3 className="subsection-title">Partits pendents</h3>
                    <div className="matches-grid">
                        {matchGroups.map((matchPredictions) => {
                            const match = matchPredictions[0]?.matches;
                            if (!match) return null;

                            const officialResultAvailable = hasOfficialResult(matchPredictions[0]);

                            return (
                                <details key={match.id} className="card public-match-card">
                                    <summary className="public-match-summary">
                                        <div className="compact-match">
                                            <div className="team-left">
                                                <TeamName team={match.home_team} />
                                            </div>

                                            <div className="score-center">
                                                {officialResultAvailable ? (
                                                    <strong>
                                                        {match.home_score} - {match.away_score}
                                                    </strong>
                                                ) : (
                                                    <span className="badge">Pendent</span>
                                                )}
                                            </div>

                                            <div className="team-right">
                                                <TeamName team={match.away_team} />
                                            </div>
                                        </div>

                                        <div className="match-footer">
                                            <span>{formatKickoff(match.kickoff)}</span>
                                            <span>Veure porres</span>
                                        </div>
                                    </summary>

                                    <div className="public-predictions-list">
                                        {matchPredictions.map((prediction, index) => {
                                            const points = getPredictionPoints(prediction);

                                            return (
                                                <div key={index} className="public-prediction-row">
                                                    <span>{prediction.users?.name}</span>

                                                    <strong>
                                                        {prediction.predicted_home} -{" "}
                                                        {prediction.predicted_away}
                                                    </strong>

                                                    {points !== null && points > 0 ? (
                                                        <span className="badge">+{points}</span>
                                                    ) : (
                                                        <span />
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </details>
                            );
                        })}
                    </div>
                </>
            )}

        </>
    );
}