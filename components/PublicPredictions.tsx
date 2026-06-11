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
            {team}
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

function groupPredictionsByGroupAndMatch(predictions: PublicPrediction[]) {
    const groups: Record<string, Record<number, PublicPrediction[]>> = {};

    for (const prediction of predictions) {
        const groupName = prediction.matches?.group_name ?? "Sense grup";
        const matchId = prediction.matches?.id ?? 0;

        if (!groups[groupName]) {
            groups[groupName] = {};
        }

        if (!groups[groupName][matchId]) {
            groups[groupName][matchId] = [];
        }

        groups[groupName][matchId].push(prediction);
    }

    return groups;
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

    const groupedPredictions =
        groupPredictionsByGroupAndMatch(filteredPredictions);

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

            {Object.entries(groupedPredictions).map(([groupName, matches]) => (
                <section key={groupName} className="group-section">
                    <h3>Grup {groupName}</h3>

                    <div className="matches-grid">
                        {Object.values(matches).map((matchPredictions) => {
                            const match = matchPredictions[0]?.matches;
                            const officialResultAvailable = hasOfficialResult(
                                matchPredictions[0]
                            );

                            if (!match) return null;

                            return (
                                <div key={match.id} className="card">
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

                                    <div style={{ marginTop: "10px" }}>
                                        {matchPredictions.map((prediction, index) => {
                                            const points = getPredictionPoints(prediction);

                                            return (
                                                <div
                                                    key={index}
                                                    style={{
                                                        display: "grid",
                                                        gridTemplateColumns: "1fr auto auto",
                                                        gap: "10px",
                                                        alignItems: "center",
                                                        borderTop: index === 0 ? "0" : "1px solid #eee",
                                                        padding: "6px 0",
                                                        fontSize: "0.95rem",
                                                    }}
                                                >
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
                                </div>
                            );
                        })}
                    </div>
                </section>
            ))}
        </>
    );
}