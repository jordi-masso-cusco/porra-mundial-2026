import type { Match } from "@/types";
import { calculateRealGroupStandings } from "@/lib/groupStandings";
import { resolveRoundOf32 } from "@/lib/knockout";
import { flagUrl } from "@/lib/flags";

type KnockoutBracketProps = {
    matches: Match[];
};

type ResolvedKnockoutMatch = ReturnType<typeof resolveRoundOf32>[number];

function KnockoutMatchCard({ match }: { match: ResolvedKnockoutMatch }) {
    return (
        <div className="card">
            <div className="match-footer" style={{ marginTop: 0 }}>
                <strong>Partit {match.id}</strong>
                <span>Setzens</span>
            </div>

            <div className="compact-match" style={{ marginTop: "12px" }}>
                <div className="team-left">
                    {isResolvedTeam(match.homeTeam) && <Flag team={match.homeTeam} />}
                    <span>{match.homeTeam}</span>
                </div>

                <div className="score-center">
                    <strong>vs</strong>
                </div>

                <div className="team-right">
                    {isResolvedTeam(match.awayTeam) && <Flag team={match.awayTeam} />}
                    <span>{match.awayTeam}</span>
                </div>
            </div>

            <div className="muted" style={{ marginTop: "8px" }}>
                {match.homeSlot} vs {match.awaySlot}
            </div>
        </div>
    );
}

function Flag({ team }: { team: string }) {
    const url = flagUrl(team);

    if (!url) return null;

    return <img src={url} alt="" className="flag" />;
}

function isResolvedTeam(team: string) {
    return !team.match(/^[123][A-Z]+$/);
}

export function KnockoutBracket({ matches }: KnockoutBracketProps) {
    const groupStandings = calculateRealGroupStandings(matches);
    const knockoutMatches = resolveRoundOf32(groupStandings);

    return (
        <>
            <h2>Eliminatòries</h2>

            <p className="muted">
                Vista provisional dels setzens segons la classificació real actual.
            </p>

            <div className="knockout-grid">
                <section>
                    <h3>Costat esquerre del quadre</h3>

                    {knockoutMatches
                        .filter((match) => match.side === "left")
                        .map((match) => (
                            <KnockoutMatchCard key={match.id} match={match} />
                        ))}
                </section>

                <section>
                    <h3>Costat dret del quadre</h3>

                    {knockoutMatches
                        .filter((match) => match.side === "right")
                        .map((match) => (
                            <KnockoutMatchCard key={match.id} match={match} />
                        ))}
                </section>
            </div>
        </>
    );
}