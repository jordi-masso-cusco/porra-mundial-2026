import { useState } from "react";
import type { PublicPrediction } from "@/types";

type PublicPredictionsProps = {
    publicPredictions: PublicPrediction[];
};

function getMatchKey(prediction: PublicPrediction) {
    return prediction.matches?.id ?? 0;
}

function getSign(home: number, away: number) {
    if (home > away) return "1";
    if (home < away) return "2";
    return "X";
}

function getPredictionPoints(prediction: PublicPrediction) {
    const match = prediction.matches;

    if (!match) return null;
    if (match.home_score === null || match.away_score === null) return null;
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

    const predictionsByMatch = filteredPredictions.reduce<
        Record<number, PublicPrediction[]>
    >((groups, prediction) => {
        const matchKey = getMatchKey(prediction);

        if (!groups[matchKey]) {
            groups[matchKey] = [];
        }

        groups[matchKey].push(prediction);
        return groups;
    }, {});

    return (
        <>
            <h2>Porres dels altres</h2>

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

            {Object.values(predictionsByMatch).map((matchPredictions) => {
                const match = matchPredictions[0]?.matches;

                return (
                    <div key={match?.id} className="card">
                        <div className="card-title">
                            <strong>
                                {match?.home_team} - {match?.away_team}
                            </strong>
                            <span className="badge">Grup {match?.group_name}</span>
                        </div>

                        {matchPredictions.map((prediction, index) => {
                            const points = getPredictionPoints(prediction);

                            return (
                                <div
                                    key={index}
                                    style={{
                                        display: "grid",
                                        gridTemplateColumns: "1fr auto auto",
                                        gap: "12px",
                                        alignItems: "center",
                                        borderTop: index === 0 ? "0" : "1px solid #eee",
                                        paddingTop: index === 0 ? "0" : "8px",
                                        marginTop: index === 0 ? "8px" : "8px",
                                    }}
                                >
                                    <span>{prediction.users?.name}</span>

                                    <strong>
                                        {prediction.predicted_home} - {prediction.predicted_away}
                                    </strong>

                                    {points !== null && <span className="badge">+{points}</span>}
                                </div>
                            );
                        })}
                    </div>
                );
            })}
        </>
    );
}