import type { Match, PublicPrediction } from "@/types";

type StandingRow = {
  userName: string;
  points: number;
};

type StandingsProps = {
  matches: Match[];
  publicPredictions: PublicPrediction[];
};

function getSign(home: number, away: number) {
  if (home > away) return "1";
  if (home < away) return "2";
  return "X";
}

export function Standings({ matches, publicPredictions }: StandingsProps) {
  const standings: Record<string, StandingRow> = {};

  for (const prediction of publicPredictions) {
    if (!prediction.users?.name || !prediction.matches) continue;

    const match = matches.find((item) => item.id === prediction.matches?.id);
    if (!match) continue;

    if (match.home_score === null || match.away_score === null) continue;
    if (
      prediction.predicted_home === null ||
      prediction.predicted_away === null
    ) {
      continue;
    }

    const userName = prediction.users.name;

    if (!standings[userName]) {
      standings[userName] = {
        userName,
        points: 0,
      };
    }

    const exact =
      prediction.predicted_home === match.home_score &&
      prediction.predicted_away === match.away_score;

    const signCorrect =
      getSign(prediction.predicted_home, prediction.predicted_away) ===
      getSign(match.home_score, match.away_score);

    if (exact) {
      standings[userName].points += 10;
    } else if (signCorrect) {
      standings[userName].points += 5;
    }
  }

  const rows = Object.values(standings).sort((a, b) => b.points - a.points);

  return (
    <>
      <h2>Classificació</h2>

      {rows.length === 0 && (
        <p>Encara no hi ha punts perquè falten resultats oficials.</p>
      )}

      {rows.map((row, index) => (
        <div
          key={row.userName}
          style={{
            display: "flex",
            justifyContent: "space-between",
            border: "1px solid #ccc",
            padding: "12px",
            marginBottom: "8px",
            borderRadius: "8px",
          }}
        >
          <strong>
            {index + 1}. {row.userName}
          </strong>

          <span>{row.points} punts</span>
        </div>
      ))}
    </>
  );
}