import type { Match } from "@/types";
import { calculateRealGroupStandings } from "@/lib/groupStandings";
import { flagUrl } from "@/lib/flags";

type AdminGroupStandingsProps = {
    matches: Match[];
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

export function AdminGroupStandings({ matches }: AdminGroupStandingsProps) {
    const groupStandings = calculateRealGroupStandings(matches);

    return (
        <>
            {Object.entries(groupStandings)
                .sort(([groupA], [groupB]) => groupA.localeCompare(groupB))
                .map(([groupName, rows]) => (
                    <div key={groupName} className="card">
                        <h3>Grup {groupName}</h3>

                        {rows.map((row, index) => (
                            <div
                                key={row.team}
                                className="predicted-standing-row"
                            >
                                <span className="predicted-standing-position">{index + 1}</span>

                                <TeamName team={row.team} />

                                <span className="predicted-standing-points">{row.points} pts</span>

                                <span className="predicted-standing-dg">
                                    DG {row.goalDifference}
                                </span>
                            </div>
                        ))}
                    </div>
                ))}
        </>
    );
}