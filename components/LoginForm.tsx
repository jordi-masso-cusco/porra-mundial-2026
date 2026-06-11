type LoginFormProps = {
  name: string;
  accessCode: string;
  error: string;
  onNameChange: (value: string) => void;
  onAccessCodeChange: (value: string) => void;
  onSubmit: (event: React.FormEvent) => void;
};

export function LoginForm({
  name,
  accessCode,
  error,
  onNameChange,
  onAccessCodeChange,
  onSubmit,
}: LoginFormProps) {
  return (
    <main style={{ padding: "24px", maxWidth: "420px", margin: "0 auto" }}>
      <h1>Porra Mundial 2026</h1>

      <form onSubmit={onSubmit}>
        <div style={{ marginBottom: "12px" }}>
          <label>Nom</label>
          <input
            value={name}
            onChange={(e) => onNameChange(e.target.value)}
            style={{ display: "block", width: "100%", padding: "8px" }}
          />
        </div>

        <div style={{ marginBottom: "12px" }}>
          <label>Codi</label>
          <input
            type="password"
            value={accessCode}
            onChange={(e) => onAccessCodeChange(e.target.value)}
            style={{ display: "block", width: "100%", padding: "8px" }}
          />
        </div>

        <button type="submit" style={{ padding: "8px 16px" }}>
          Entrar
        </button>
      </form>

      {error && <p style={{ color: "red" }}>{error}</p>}
    </main>
  );
}