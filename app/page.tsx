"use client";

import { useEffect, useState } from "react";
import { LoginForm } from "@/components/LoginForm";
import { Navigation } from "@/components/Navigation";
import { PredictionList } from "@/components/PredictionList";
import { PublicPredictions } from "@/components/PublicPredictions";
import { supabase } from "@/lib/supabase";
import type { Match, Prediction, PublicPrediction, Tab, User } from "@/types";

export default function Home() {
  const [tab, setTab] = useState<Tab>("mine");
  const [name, setName] = useState("");
  const [accessCode, setAccessCode] = useState("");
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [matches, setMatches] = useState<Match[]>([]);
  const [predictions, setPredictions] = useState<Record<number, Prediction>>({});
  const [publicPredictions, setPublicPredictions] = useState<
    PublicPrediction[]
  >([]);
  const [error, setError] = useState("");
  const [savedMessage, setSavedMessage] = useState("");

  useEffect(() => {
    const savedUser = localStorage.getItem("porra_user");
    if (savedUser) setCurrentUser(JSON.parse(savedUser));
  }, []);

  useEffect(() => {
    if (currentUser) {
      loadData(currentUser.id);
      loadPublicPredictions();
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

  async function loadPublicPredictions() {
    const { data, error } = await supabase
      .from("predictions")
      .select(`
        predicted_home,
        predicted_away,
        users (
          name
        ),
        matches (
          id,
          home_team,
          away_team,
          group_name,
          kickoff
        )
      `);

    if (error) {
      setError("No s'han pogut carregar les porres dels altres.");
      return;
    }

    setPublicPredictions((data ?? []) as unknown as PublicPrediction[]);
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
      { onConflict: "user_id,match_id" }
    );

    if (error) {
      setError("No s'ha pogut desar el pronòstic.");
      return;
    }

    setSavedMessage("Pronòstic desat correctament.");
    loadPublicPredictions();
  }

  function logout() {
    localStorage.removeItem("porra_user");
    setCurrentUser(null);
    setName("");
    setAccessCode("");
    setPredictions({});
    setPublicPredictions([]);
    setTab("mine");
  }

  if (!currentUser) {
    return (
      <LoginForm
        name={name}
        accessCode={accessCode}
        error={error}
        onNameChange={setName}
        onAccessCodeChange={setAccessCode}
        onSubmit={handleLogin}
      />
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

      <Navigation activeTab={tab} onTabChange={setTab} />

      {error && <p style={{ color: "red" }}>{error}</p>}
      {savedMessage && <p style={{ color: "green" }}>{savedMessage}</p>}

      {tab === "mine" && (
        <PredictionList
          matches={matches}
          predictions={predictions}
          onPredictionChange={updatePrediction}
          onSavePrediction={savePrediction}
        />
      )}

      {tab === "others" && (
        <PublicPredictions publicPredictions={publicPredictions} />
      )}

      {tab === "standings" && (
        <>
          <h2>Classificació</h2>
          <p>La classificació la calcularem quan definim resultats reals i punts.</p>
        </>
      )}
    </main>
  );
}