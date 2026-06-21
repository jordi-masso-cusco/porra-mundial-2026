import type { KnockoutResult, Match } from "@/types";
import { calculateRealGroupStandings } from "@/lib/groupStandings";
import { generateBracketTree, resolveRoundOf32 } from "@/lib/knockout";
import { flagUrl } from "@/lib/flags";

type AdminKnockoutResultsProps = {
  matches: Match[];
  results: Record<number, KnockoutResult>;
  onResultChange: (
    matchId: number,
    field: "official_home" | "official_away" | "qualified_team",
    value: string
  ) => void;
  onSaveResult: (matchId: number) => void;
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
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(kickoff));
}

export function AdminKnockoutResults({
  matches,
  results,
  onResultChange,
  onSaveResult,
}: AdminKnockoutResultsProps) {
  const groupStandings = calculateRealGroupStandings(matches);
  const roundOf32Matches = resolveRoundOf32(groupStandings);

  const resultPredictions = Object.fromEntries(
    Object.values(results).map((result) => [
      result.match_id,
      {
        qualified_team: result.qualified_team,
      },
    ])
  );

  const bracket = generateBracketTree(roundOf32Matches, resultPredictions);

  const renderRound = (title: string, fromId: number, toId: number) => {
    const roundMatches = bracket.matches.filter(
      (match) => match.id >= fromId && match.id <= toId
    );

    const visibleMatches = roundMatches.filter(
      (match) => isResolvedTeam(match.homeTeam) && isResolvedTeam(match.awayTeam)
    );

    if (visibleMatches.length === 0) return null;

    return (
      <>
        <h3 className="subsection-title">{title}</h3>

        <div className="matches-grid">
          {visibleMatches.map((match) => {
            const result = results[match.id];

            const homeScore = result?.official_home ?? "";
            const awayScore = result?.official_away ?? "";
            const qualifiedTeam = result?.qualified_team ?? "";

            const isDraw =
              result?.official_home !== null &&
              result?.official_home !== undefined &&
              result?.official_away !== null &&
              result?.official_away !== undefined &&
              result.official_home === result.official_away;

            return (
              <div key={match.id} className="card">
                <div className="match-footer" style={{ marginTop: 0 }}>
                  <strong>{match.label}</strong>
                  <span>{formatKickoff(match.kickoff)}</span>
                </div>

                <div className="compact-match" style={{ marginTop: "12px" }}>
                  <div className="team-left">
                    <Flag team={match.homeTeam} />
                    <span>{match.homeTeam}</span>
                  </div>

                  <div className="score-center">
                    <input
                      className="score-input"
                      type="number"
                      min="0"
                      value={homeScore}
                      onChange={(e) =>
                        onResultChange(match.id, "official_home", e.target.value)
                      }
                    />

                    <span>-</span>

                    <input
                      className="score-input"
                      type="number"
                      min="0"
                      value={awayScore}
                      onChange={(e) =>
                        onResultChange(match.id, "official_away", e.target.value)
                      }
                    />
                  </div>

                  <div className="team-right">
                    <Flag team={match.awayTeam} />
                    <span>{match.awayTeam}</span>
                  </div>
                </div>

                {isDraw ? (
                  <div style={{ marginTop: "12px" }}>
                    <label>
                      <strong>Classificat</strong>
                    </label>

                    <select
                      value={qualifiedTeam}
                      onChange={(e) =>
                        onResultChange(
                          match.id,
                          "qualified_team",
                          e.target.value
                        )
                      }
                      style={{
                        display: "block",
                        width: "100%",
                        marginTop: "6px",
                        padding: "10px",
                        borderRadius: "10px",
                        border: "1px solid var(--border)",
                      }}
                    >
                      <option value="">Selecciona equip</option>
                      <option value={match.homeTeam}>{match.homeTeam}</option>
                      <option value={match.awayTeam}>{match.awayTeam}</option>
                    </select>
                  </div>
                ) : qualifiedTeam ? (
                  <p className="muted" style={{ marginTop: "12px" }}>
                    Classificat automàticament: <strong>{qualifiedTeam}</strong>
                  </p>
                ) : (
                  <p className="muted" style={{ marginTop: "12px" }}>
                    Introdueix un resultat per calcular l’equip classificat.
                  </p>
                )}

                <button
                  style={{ marginTop: "12px" }}
                  onClick={() => onSaveResult(match.id)}
                >
                  Desar resultat
                </button>
              </div>
            );
          })}
        </div>
      </>
    );
  };

  return (
    <>
      <h2 className="section-title">Resultats oficials eliminatòries</h2>

      {renderRound("Setzens de final", 1, 16)}
      {renderRound("Vuitens de final", 17, 24)}
      {renderRound("Quarts de final", 25, 28)}
      {renderRound("Semifinals", 29, 30)}
      {renderRound("Partit pel 3r lloc", 31, 31)}
      {renderRound("Final", 32, 32)}
    </>
  );
}