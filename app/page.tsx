"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type User = {
  id: string;
  name: string;
  is_admin: boolean;
};

type Match = {
  id: number;
  home_team: string;
  away_team: string;
  group_name: string;
  kickoff: string;
};

export default function Home() {
  const [name, setName] = useState("");
  const [accessCode, setAccessCode] = useState("");
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [matches, setMatches] = useState<Match[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    const savedUser = localStorage.getItem("porra_user");

    if (savedUser) {
      setCurrentUser(JSON.parse(savedUser));
    }
  }, []);

  useEffect(() => {
    if (currentUser) {
      loadMatches();
    }
  }, [currentUser]);

  async function handleLogin(event: React.FormEvent) {
    event.preventDefault();
    setError("");

    const { data, error } = await supabase
      .from("users")
      .select("id, name, is_admin")
      .eq("name", name)
      .eq("access_code", accessCode)
      .single();

    if (error || !data) {
      setError("Nom o codi incorrecte.");
      return;
    }

    localStorage.setItem("porra_user", JSON.stringify(data));
    setCurrentUser(data);
  }

  async function loadMatches() {
    const { data, error } = await supabase
      .from("matches")
      .select("*")
      .order("kickoff");

    if (error) {
      setError("No s'han pogut carregar els partits.");
      return;
    }

    setMatches(data || []);
  }

  function logout() {
    localStorage.removeItem("porra_user");
    setCurrentUser(null);
    setName("");
    setAccessCode("");
  }

  if (!currentUser) {
    return (
      <main style={{ padding: "24px", maxWidth: "420px", margin: "0 auto" }}>
        <h1>Porra Mundial 2026</h1>

        <form onSubmit={handleLogin}>
          <div style={{ marginBottom: "12px" }}>
            <label>Nom</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={{ display: "block", width: "100%", padding: "8px" }}
            />
          </div>

          <div style={{ marginBottom: "12px" }}>
            <label>Codi</label>
            <input
              type="password"
              value={accessCode}
              onChange={(e) => setAccessCode(e.target.value)}
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

  return (
    <main style={{ padding: "24px" }}>
      <h1>Porra Mundial 2026</h1>

      <p>
        Has entrat com <strong>{currentUser.name}</strong>
        {currentUser.is_admin ? " · Administrador" : ""}
      </p>

      <button onClick={logout} style={{ marginBottom: "24px" }}>
        Sortir
      </button>

      <h2>Partits</h2>

      {matches.map((match) => (
        <div
          key={match.id}
          style={{
            border: "1px solid #ccc",
            padding: "12px",
            marginBottom: "12px",
            borderRadius: "8px",
          }}
        >
          <strong>
            {match.home_team} - {match.away_team}
          </strong>
          <div>Grup {match.group_name}</div>
        </div>
      ))}
    </main>
  );
}