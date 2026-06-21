import type { Match } from "@/types";
import { calculateRealGroupStandings } from "@/lib/groupStandings";
import {
    generateBracketTree,
    knockoutRounds,
    resolveRoundOf32,
    type KnockoutRound,
} from "@/lib/knockout";
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
                📅 {formatKickoff(match.kickoff)}
            </div>

            <div
                className="muted"
                style={{ marginTop: "4px", fontSize: "0.8rem" }}
            >
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

function formatKickoff(kickoff: string) {
    return new Intl.DateTimeFormat("ca-ES", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    }).format(new Date(kickoff));
}


export function KnockoutBracket({ matches }: KnockoutBracketProps) {
    const groupStandings = calculateRealGroupStandings(matches);
    const knockoutMatches = resolveRoundOf32(groupStandings);
    const simulatedBracket = generateBracketTree(knockoutMatches);

    function getSimulatedMatch(matchId: number) {
        return simulatedBracket.matches.find((match) => match.id === matchId);
    }

    function renderKnockoutRound(match: KnockoutRound) {
        const simulatedMatch = getSimulatedMatch(match.id);

        const homeTeam = simulatedMatch?.homeTeam ?? match.homeSource;
        const awayTeam = simulatedMatch?.awayTeam ?? match.awaySource;
        const winner = simulatedMatch?.winner;

        return (
            <div key={match.id} className="card">
                <div className="match-footer" style={{ marginTop: 0 }}>
                    <strong>{match.label}</strong>
                    <span>{formatKickoff(match.kickoff)}</span>
                </div>

                <div className="compact-match" style={{ marginTop: "12px" }}>
                    <div className="team-left">
                        {isResolvedTeam(homeTeam) && <Flag team={homeTeam} />}
                        <span>{homeTeam}</span>
                    </div>

                    <div className="score-center">
                        <strong>vs</strong>
                    </div>

                    <div className="team-right">
                        {isResolvedTeam(awayTeam) && <Flag team={awayTeam} />}
                        <span>{awayTeam}</span>
                    </div>
                </div>

                {winner && (
                    <div className="muted" style={{ marginTop: "8px" }}>
                        Guanyador simulat: <strong>{winner}</strong>
                    </div>
                )}
            </div>
        );
    }

    return (
        <>
            <h2 className="section-title">Setzens de final</h2>

            <p className="muted">
                Vista provisional dels setzens segons la classificació real actual.
            </p>

            <div className="knockout-grid">
                <section>

                    {knockoutMatches
                        .filter((match) => match.side === "left")
                        .map((match) => (
                            <KnockoutMatchCard key={match.id} match={match} />
                        ))}
                </section>

                <section>

                    {knockoutMatches
                        .filter((match) => match.side === "right")
                        .map((match) => (
                            <KnockoutMatchCard key={match.id} match={match} />
                        ))}
                </section>
            </div>

            <h2 className="section-title">Vuitens de final</h2>
            <div className="matches-grid">
                {knockoutRounds
                    .filter((m) => m.id >= 17 && m.id <= 24)
                    .map(renderKnockoutRound)}
            </div>

            <h2 className="section-title">Quarts de final</h2>
            <div className="matches-grid">
                {knockoutRounds
                    .filter((m) => m.id >= 25 && m.id <= 28)
                    .map(renderKnockoutRound)}
            </div>

            <h2 className="section-title">Semifinals</h2>
            <div className="matches-grid">
                {knockoutRounds
                    .filter((m) => m.id >= 29 && m.id <= 30)
                    .map(renderKnockoutRound)}
            </div>

            <h2 className="section-title">Partit pel 3r lloc</h2>
            <div className="matches-grid">
                {knockoutRounds
                    .filter((m) => m.id === 31)
                    .map(renderKnockoutRound)}
            </div>

            <h2 className="section-title">Final</h2>
            <div className="matches-grid">
                {knockoutRounds
                    .filter((m) => m.id === 32)
                    .map(renderKnockoutRound)}
            </div>
        </>
    );
}
