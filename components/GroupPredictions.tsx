type GroupPredictionsProps = {
  groups: Record<string, string[]>;
};

export function GroupPredictions({
  groups,
}: GroupPredictionsProps) {
  return (
    <>
      <h2>Classificació dels grups</h2>

      {Object.entries(groups).map(([groupName, teams]) => (
        <div
          key={groupName}
          style={{
            border: "1px solid #ccc",
            borderRadius: "8px",
            padding: "12px",
            marginBottom: "12px",
          }}
        >
          <h3>Grup {groupName}</h3>

          <ol>
            {teams.map((team) => (
              <li key={team}>{team}</li>
            ))}
          </ol>
        </div>
      ))}
    </>
  );
}