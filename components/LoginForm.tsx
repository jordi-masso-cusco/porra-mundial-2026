type LoginFormProps = {
    name: string;
    accessCode: string;
    error: string;
    onNameChange: (value: string) => void;
    onAccessCodeChange: (value: string) => void;
    onLogin: (event: React.FormEvent) => void;
    onRegister: (event: React.FormEvent) => void;
};

export function LoginForm({
    name,
    accessCode,
    error,
    onNameChange,
    onAccessCodeChange,
    onLogin,
    onRegister,
}: LoginFormProps) {
    return (
        <main className="page">
            <div className="header">
                <h1>Porra Mundial 2026</h1>
                <p>Entra o registra’t amb el teu nom i un PIN de 4 dígits.</p>
            </div>

            <form>
                <div className="card">
                    <label>
                        <strong>Nom</strong>
                    </label>
                    <input
                        value={name}
                        onChange={(e) => onNameChange(e.target.value)}
                        placeholder="Ex: Jordi"
                        style={{ display: "block", width: "100%", marginTop: "8px" }}
                    />

                    <label style={{ display: "block", marginTop: "12px" }}>
                        <strong>PIN</strong>
                    </label>
                    <input
                        type="password"
                        inputMode="numeric"
                        maxLength={4}
                        value={accessCode}
                        onChange={(e) => onAccessCodeChange(e.target.value)}
                        placeholder="4 dígits"
                        style={{ display: "block", width: "100%", marginTop: "8px" }}
                    />

                    <div className="score-row">
                        <button onClick={onLogin}>Entrar</button>
                        <button onClick={onRegister} type="button">
                            Registrar-me
                        </button>
                    </div>
                </div>
            </form>

            {error && <p className="error">{error}</p>}
        </main>
    );
}