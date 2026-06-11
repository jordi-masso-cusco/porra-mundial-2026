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

type Prediction = {
  match_id: number;
  predicted_home: number | null;
  predicted_away: number | null;
};

export default function Home() {
  const [name, setName] = useState("");
  const [accessCode, setAccessCode] = useState("");
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [matches, setMatches] = useState<Match[]>([]);
  const [predictions, setPredictions] = useState<Record<number, Prediction>>({});
  const [error, setError] = useState("");
  const [savedMessage, setSavedMessage] = useState("");

  useEffect(() => {
    const savedUser = localStorage.getItem("porra_user");

    if (savedUser) {
      setCurrentUser(JSON.parse(savedUser));
    }
  }, []);

  useEffect(() => {
    if (currentUser) {
      loadData(currentUser.id);
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

  async function loadData(userId: string) {
    const { data: matchesData, error: matchesError } = await supabase
      .from("matches")
      .select("*")
      .order("kickoff");

    if (matchesError) {
      setError("No s'han pogut carregar els partits.");
      return;
    }

    setMatches(matchesData || []);

    const { data: predictionsData, error: predictionsError } = await supabase
      .from("predictions")
      .select("match_id, predicted_home, predicted_away")
      .eq("user_id", userId);

    if (predictionsError) {
      setError("No s'han pogut carregar els pronòstics.");
      return;
    }

    const predictionsByMatch: Record<number, Prediction> = {};

    for (const prediction of predictionsData || []) {
      predictionsByMatch[prediction.match_id] = prediction;
    }

    setPredictions(predictionsByMatch);
  }

  function updatePrediction(
    matchId: number,
    field: "predicted_home" | "predicted_away",
    value: string
  ) {
    const numericValue = value === "" ? null : Number(value);

    setPredictions((current) => ({
      ...current,
      [matchId]: {
        match_id: matchId,
        predicted_home: current[matchId]?.predicted_home ?? null,
        predicted_away: current[matchId]?.predicted_away ?? null,
        [field]: numericValue,
      },
    }));
  }

  async function savePrediction(matchId: number) {
    if (!currentUser) return;

    const prediction = predictions[matchId];

    if (
      !prediction ||
      prediction.predicted_home === null ||
      prediction.predicted_away === null
    ) {
      setError("Has d'omplir els dos resultats abans de desar.");
      return;
    }

    setError("");
    setSavedMessage("");

    const { error } = await supabase.from("predictions").upsert(
      {
        user_id: currentUser.id,
        match_id: matchId,
        predicted_home: prediction.predicted_home,
        predicted_away: prediction.predicted_away,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: "user_id,match_id",
      }
    );

    if (error) {
      setError("No s'ha pogut desar el pronòstic.");
      return;
    }

    setSavedMessage("Pronòstic desat correctament.");
  }

  function logout() {
    localStorage.removeItem("porra_user");
    setCurrentUser(null);
    setName("");
    setAccessCode("");
    setPredictions({});
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

      <h2>Els meus pronòstics</h2>

      {error && <p style={{ color: "red" }}>{error}</p>}
      {savedMessage && <p style={{ color: "green" }}>{savedMessage}</p>}

      {matches.map((match) => {
        const prediction = predictions[match.id];

        return (
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

            <div style={{ marginBottom: "8px" }}>Grup {match.group_name}</div>

            <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
              <input
                type="number"
                min="0"
                value={prediction?.predicted_home ?? ""}
                onChange={(e) =>
                  updatePrediction(match.id, "predicted_home", e.target.value)
                }
                style={{ width: "64px", padding: "8px" }}
              />

              <span>-</span>

              <input
                type="number"
                min="0"
                value={prediction?.predicted_away ?? ""}
                onChange={(e) =>
                  updatePrediction(match.id, "predicted_away", e.target.value)
                }
                style={{ width: "64px", padding: "8px" }}
              />

              <button onClick={() => savePrediction(match.id)}>Desar</button>
            </div>
          </div>
        );
      })}
    </main>
  );
}