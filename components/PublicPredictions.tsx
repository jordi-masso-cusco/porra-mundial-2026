import { useState } from "react";
import type { PublicPrediction } from "@/types";

type PublicPredictionsProps = {
    publicPredictions: PublicPrediction[];
};

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
                            <option key={user} value={user}>
                                {user}
                            </option>
                        ))}
                    </select>
                </div>
            )}

            {filteredPredictions.map((prediction, index) => (
                <div key={index} className="card">
                    <div className="card-title">
                        <strong>{prediction.users?.name}</strong>
                        <span className="badge">Grup {prediction.matches?.group_name}</span>
                    </div>

                    <div className="muted">
                        {prediction.matches?.home_team} - {prediction.matches?.away_team}
                    </div>

                    <div style={{ marginTop: "8px" }}>
                        Pronòstic:{" "}
                        <strong>
                            {prediction.predicted_home} - {prediction.predicted_away}
                        </strong>
                    </div>
                </div>
            ))}
        </>
    );
}