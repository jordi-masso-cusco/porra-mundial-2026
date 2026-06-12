import type { Match, PublicPrediction } from "@/types";
import {
    calculatePredictedGroupStandings,
    getQualifiedTeams,
} from "@/lib/groupStandings";
import { flagUrl } from "@/lib/flags";

type PredictedGroupStandingsProps = {
    matches: Match[];
    publicPredictions: PublicPrediction[];
};

function TeamName({ team }: { team: string }) {
    const url = flagUrl(team);

    return (
        <span className="team-name">
            {url && <img src={url} alt="" className="flag" />}
            <span>{team}</span>
        </span>
    );
}

export function PredictedGroupStandings({
    matches,
    publicPredictions,
}: PredictedGroupStandingsProps) {
    const users = Array.from(
        new Set(
            publicPredictions
                .map((prediction) => prediction.users?.name)
                .filter(Boolean)
        )
    );

    return (
        <>
            <h2>Classificacions de grup pronosticades</h2>

            {users.map((userName) => {
                if (!userName) return null;

                const orderedGroups = calculatePredictedGroupStandings(
                    matches,
                    publicPredictions,
                    userName
                );

                const qualifiedTeams = getQualifiedTeams(orderedGroups);

                return (
                    <details key={userName} className="card">
                        <summary style={{ cursor: "pointer" }}>
                            <strong>{userName}</strong>
                        </summary>

                        {Object.entries(orderedGroups)
                            .sort(([groupA], [groupB]) => groupA.localeCompare(groupB))
                            .map(([groupName, rows]) => (
                                <div key={groupName} style={{ marginTop: "16px" }}>
                                    <h3>Grup {groupName}</h3>

                                    {rows.map((row, index) => (
                                        <div
                                            key={row.team}
                                            className={
                                                qualifiedTeams.has(row.team)
                                                    ? "predicted-standing-row qualified-row"
                                                    : "predicted-standing-row eliminated-row"
                                            }
                                        >
                                            <span className="predicted-standing-position">
                                                {index + 1}
                                            </span>

                                            <TeamName team={row.team} />

                                            <span className="predicted-standing-points">
                                                {row.points} pts
                                            </span>

                                            <span className="predicted-standing-dg">
                                                DG {row.goalDifference}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            ))}
                    </details>
                );
            })}
        </>
    );
}