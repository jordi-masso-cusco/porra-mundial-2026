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
      {team}
    </span>
  );
}

export function AdminGroupStandings({ matches }: AdminGroupStandingsProps) {
  const groupStandings = calculateRealGroupStandings(matches);

  return (
    <>
      <h2>Classificació real dels grups</h2>

      {Object.entries(groupStandings)
        .sort(([groupA], [groupB]) => groupA.localeCompare(groupB))
        .map(([groupName, rows]) => (
          <div key={groupName} className="card">
            <h3>Grup {groupName}</h3>

            {rows.map((row, index) => (
              <div
                key={row.team}
                style={{
                  display: "grid",
                  gridTemplateColumns: "32px 1fr 60px 60px 60px 60px",
                  gap: "8px",
                  padding: "6px 0",
                  borderTop: index === 0 ? "0" : "1px solid #eee",
                  alignItems: "center",
                }}
              >
                <strong>{index + 1}</strong>
                <TeamName team={row.team} />
                <span>{row.points} pts</span>
                <span>GF {row.goalsFor}</span>
                <span>GC {row.goalsAgainst}</span>
                <span>DG {row.goalDifference}</span>
              </div>
            ))}
          </div>
        ))}
    </>
  );
}