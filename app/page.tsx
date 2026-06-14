"use client";

import { useEffect, useState } from "react";
import { LoginForm } from "@/components/LoginForm";
import { Navigation } from "@/components/Navigation";
import { PredictionList } from "@/components/PredictionList";
import { PublicPredictions } from "@/components/PublicPredictions";
import { AdminResults } from "@/components/AdminResults";
import { AdminGroupStandings } from "@/components/AdminGroupStandings";
import { Standings } from "@/components/Standings";
import { PredictedGroupStandings } from "@/components/PredictedGroupStandings";
import { AwardPredictions } from "@/components/AwardPredictions";
import type {
  AwardPrediction,
  AwardResult,
  Match,
  Prediction,
  PublicAwardPrediction,
  PublicPrediction,
  Tab,
  User,
} from "@/types";
import { PublicAwards } from "@/components/PublicAwards";
import { AdminAwards } from "@/components/AdminAwards";
import { supabase } from "@/lib/supabase";

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
  const groupStagePredictionDeadline = new Date("2026-06-13T17:00:00+02:00");
  const areGroupStagePredictionsClosed = new Date() >= groupStagePredictionDeadline;
  const [awardPredictions, setAwardPredictions] = useState<
    Record<string, AwardPrediction>
  >({});
  const [publicAwardPredictions, setPublicAwardPredictions] = useState<
    PublicAwardPrediction[]
  >([]);
  const [awardResults, setAwardResults] = useState<Record<string, AwardResult>>({});
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);

  useEffect(() => {
    const savedUser = localStorage.getItem("porra_user");
    if (savedUser) setCurrentUser(JSON.parse(savedUser));
  }, []);

  useEffect(() => {
    if (currentUser) {
      loadData(currentUser.id);
      loadPublicPredictions();
      loadAwardPredictions(currentUser.id);
      loadPublicAwardPredictions();
      loadAwardResults();
    }
  }, [currentUser]);

  useEffect(() => {
    if (currentUser && selectedGroup === null) {
      setSelectedGroup(currentUser.group_name ?? "ALL");
    }
  }, [currentUser, selectedGroup]);

  async function handleLogin(event: React.FormEvent) {
    event.preventDefault();
    setError("");

    const { data, error } = await supabase
      .from("users")
      .select("id, name, is_admin, group_name")
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

  async function handleRegister(event: React.FormEvent) {
    event.preventDefault();
    setError("");

    const cleanName = name.trim();
    const cleanCode = accessCode.trim();

    if (!cleanName) {
      setError("Has d'escriure un nom.");
      return;
    }

    if (!/^\d{4}$/.test(cleanCode)) {
      setError("El PIN ha de tenir exactament 4 dígits.");
      return;
    }

    const { data, error } = await supabase
      .from("users")
      .insert({
        name: cleanName,
        access_code: cleanCode,
        is_admin: false,
      })
      .select("id, name, is_admin, group_name")
      .single();

    if (error || !data) {
      setError("No s'ha pogut crear l'usuari. Potser aquest nom ja existeix.");
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

    const savedDraft = localStorage.getItem(`porra_draft_predictions_${userId}`);

    if (savedDraft) {
      const draftPredictions = JSON.parse(savedDraft);
      setPredictions({
        ...predictionsByMatch,
        ...draftPredictions,
      });
      return;
    }

    setPredictions(predictionsByMatch);
  }

  async function loadPublicPredictions() {
    const pageSize = 1000;
    let from = 0;
    let allPredictions: PublicPrediction[] = [];

    while (true) {
      const { data, error } = await supabase
        .from("predictions")
        .select(`
        predicted_home,
        predicted_away,
        users (
          name,
          group_name
        ),
        matches (
          id,
          home_team,
          away_team,
          group_name,
          kickoff,
          home_score,
          away_score
        )
      `)
        .range(from, from + pageSize - 1);

      if (error) {
        setError("No s'han pogut carregar les porres dels altres.");
        return;
      }

      const page = (data ?? []) as unknown as PublicPrediction[];
      allPredictions = [...allPredictions, ...page];

      if (page.length < pageSize) {
        break;
      }

      from += pageSize;
    }

    setPublicPredictions(allPredictions);
  }

  function updatePrediction(
    matchId: number,
    field: "predicted_home" | "predicted_away",
    value: string
  ) {
    const numericValue = value === "" ? null : Number(value);

    setPredictions((current) => {
      const updatedPredictions = {
        ...current,
        [matchId]: {
          match_id: matchId,
          predicted_home: current[matchId]?.predicted_home ?? null,
          predicted_away: current[matchId]?.predicted_away ?? null,
          [field]: numericValue,
        },
      };

      if (currentUser) {
        localStorage.setItem(
          `porra_draft_predictions_${currentUser.id}`,
          JSON.stringify(updatedPredictions)
        );
      }

      return updatedPredictions;
    });
  }

  async function savePrediction(matchId: number) {
    if (!currentUser) return;

    if (areGroupStagePredictionsClosed) {
      setError("Els pronòstics de la fase de grups estan tancats.");
      return;
    }

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
    setAwardPredictions({});
    setPublicAwardPredictions([]);
  }

  function updateOfficialResult(
    matchId: number,
    field: "home_score" | "away_score",
    value: string
  ) {
    const numericValue = value === "" ? null : Number(value);

    setMatches((currentMatches) =>
      currentMatches.map((match) =>
        match.id === matchId
          ? {
            ...match,
            [field]: numericValue,
          }
          : match
      )
    );
  }

  async function saveOfficialResult(matchId: number) {
    const match = matches.find((item) => item.id === matchId);

    if (!match) return;

    if (match.home_score === null || match.away_score === null) {
      setError("Has d'omplir els dos resultats abans de desar.");
      return;
    }

    setError("");
    setSavedMessage("");

    const { error } = await supabase
      .from("matches")
      .update({
        home_score: match.home_score,
        away_score: match.away_score,
      })
      .eq("id", matchId);

    if (error) {
      setError("No s'ha pogut desar el resultat oficial.");
      return;
    }

    setSavedMessage("Resultat oficial desat correctament.");
  }

  async function loadAwardPredictions(userId: string) {
    const { data, error } = await supabase
      .from("award_predictions")
      .select("award_key, player_name")
      .eq("user_id", userId);

    if (error) {
      setError("No s'han pogut carregar els premis individuals.");
      return;
    }

    const predictionsByAward: Record<string, AwardPrediction> = {};

    for (const prediction of data || []) {
      predictionsByAward[prediction.award_key] = prediction;
    }

    setAwardPredictions(predictionsByAward);
  }

  async function loadPublicAwardPredictions() {
    const { data, error } = await supabase.from("award_predictions").select(`
    award_key,
    player_name,
    users (
      name,
      group_name
    )
  `);

    if (error) {
      setError("No s'han pogut carregar les prediccions de premis.");
      return;
    }

    setPublicAwardPredictions(
      (data ?? []) as unknown as PublicAwardPrediction[]
    );
  }

  function updateAwardPrediction(awardKey: string, value: string) {
    setAwardPredictions((current) => ({
      ...current,
      [awardKey]: {
        award_key: awardKey,
        player_name: value,
      },
    }));
  }

  async function saveAwardPrediction(awardKey: string) {
    if (!currentUser) return;

    if (areGroupStagePredictionsClosed) {
      setError("Les votacions dels premis individuals estan tancades.");
      return;
    }

    const prediction = awardPredictions[awardKey];

    if (!prediction || prediction.player_name.trim() === "") {
      setError("Has d'escriure el nom del jugador abans de desar.");
      return;
    }

    setError("");
    setSavedMessage("");

    const { error } = await supabase.from("award_predictions").upsert(
      {
        user_id: currentUser.id,
        award_key: awardKey,
        player_name: prediction.player_name.trim(),
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id,award_key" }
    );

    if (error) {
      setError("No s'ha pogut desar el premi individual.");
      return;
    }

    setSavedMessage("Premi individual desat correctament.");
    loadPublicAwardPredictions();
  }

  async function loadAwardResults() {
    const { data, error } = await supabase
      .from("award_results")
      .select("award_key, player_name");

    if (error) {
      setError("No s'han pogut carregar els resultats dels premis.");
      return;
    }

    const resultsByAward: Record<string, AwardResult> = {};

    for (const result of data || []) {
      resultsByAward[result.award_key] = result;
    }

    setAwardResults(resultsByAward);
  }

  function updateAwardResult(awardKey: string, value: string) {
    setAwardResults((current) => ({
      ...current,
      [awardKey]: {
        award_key: awardKey,
        player_name: value,
      },
    }));
  }

  async function saveAwardResult(awardKey: string) {
    const result = awardResults[awardKey];

    if (!result || result.player_name.trim() === "") {
      setError("Has d'escriure el nom del jugador abans de desar.");
      return;
    }

    setError("");
    setSavedMessage("");

    const { error } = await supabase.from("award_results").upsert(
      {
        award_key: awardKey,
        player_name: result.player_name.trim(),
        updated_at: new Date().toISOString(),
      },
      { onConflict: "award_key" }
    );

    if (error) {
      setError("No s'ha pogut desar el resultat del premi.");
      return;
    }

    setSavedMessage("Resultat del premi desat correctament.");
  }

  async function saveAllPredictions() {
    if (!currentUser) return;

    if (areGroupStagePredictionsClosed) {
      setError("Els pronòstics de la fase de grups estan tancats.");
      return;
    }

    const completedPredictions = Object.values(predictions).filter((prediction) => {
      const match = matches.find((item) => item.id === prediction.match_id);

      if (!match) return false;

      const isExceptionMatch =
        (match.home_team === "Mexico" && match.away_team === "South Africa") ||
        (match.home_team === "Korea Republic" && match.away_team === "Czechia") ||
        (match.home_team === "Canada" && match.away_team === "Bosnia and Herzegovina") ||
        (match.home_team === "USA" && match.away_team === "Paraguay");

      const exceptionMatchLocked =
        isExceptionMatch && new Date() >= new Date(match.kickoff);

      return (
        !exceptionMatchLocked &&
        prediction.predicted_home !== null &&
        prediction.predicted_away !== null
      );
    });

    if (completedPredictions.length === 0) {
      setError("No hi ha cap pronòstic complet per desar.");
      return;
    }

    setError("");
    setSavedMessage("");

    const rows = completedPredictions.map((prediction) => ({
      user_id: currentUser.id,
      match_id: prediction.match_id,
      predicted_home: prediction.predicted_home,
      predicted_away: prediction.predicted_away,
      updated_at: new Date().toISOString(),
    }));

    const { error } = await supabase.from("predictions").upsert(rows, {
      onConflict: "user_id,match_id",
    });

    if (error) {
      setError("No s'han pogut desar tots els pronòstics.");
      return;
    }

    setSavedMessage("Tots els pronòstics completats s'han desat correctament.");
    localStorage.removeItem(`porra_draft_predictions_${currentUser.id}`);
    loadPublicPredictions();
  }

  const filteredPublicPredictions =
    selectedGroup === "ALL" || selectedGroup === null
      ? publicPredictions
      : publicPredictions.filter(
        (prediction) =>
          prediction.users?.group_name === selectedGroup ||
          prediction.users?.group_name === null
      );

  const filteredPublicAwardPredictions =
    selectedGroup === "ALL" || selectedGroup === null
      ? publicAwardPredictions
      : publicAwardPredictions.filter(
        (prediction) =>
          prediction.users?.group_name === selectedGroup ||
          prediction.users?.group_name === null
      );

  if (!currentUser) {
    return (
      <LoginForm
        name={name}
        accessCode={accessCode}
        error={error}
        onNameChange={setName}
        onAccessCodeChange={setAccessCode}
        onLogin={handleLogin}
        onRegister={handleRegister}
      />
    );
  }

  return (
    <main className="page">
      <div className="header">
        <h1>Porra Mundial 2026</h1>
        <p>
          Has entrat com <strong>{currentUser.name}</strong>
          {currentUser.is_admin ? " · Administrador" : ""}
        </p>
      </div>

      <div className="top-actions">

        <button className="logout-button" onClick={logout}>
          Sortir
        </button>

        <select
          value={selectedGroup ?? "ALL"}
          onChange={(e) => setSelectedGroup(e.target.value)}
          className="group-filter"
          aria-label="Filtre de grup"
        >
          <option value="ALL">🌍 Tots</option>
          <option value="PERLA">🍻 PERLA</option>
          <option value="ORIOL GÜELL">⚽ ORIOL GÜELL</option>
        </select>
      </div>

      <Navigation
        activeTab={tab}
        isAdmin={currentUser.is_admin}
        publicTabsEnabled={areGroupStagePredictionsClosed}
        onTabChange={setTab}
      />

      {error && <p className="error">{error}</p>}
      {savedMessage && <p className="success">{savedMessage}</p>}

      {tab === "mine" && (
        <PredictionList
          matches={matches}
          predictions={predictions}
          predictionsClosed={areGroupStagePredictionsClosed}
          onPredictionChange={updatePrediction}
          onSaveAllPredictions={saveAllPredictions}
        />
      )}

      {tab === "awards" && (
        <AwardPredictions
          predictions={awardPredictions}
          predictionsClosed={areGroupStagePredictionsClosed}
          onAwardChange={updateAwardPrediction}
          onSaveAward={saveAwardPrediction}
        />
      )}

      {tab === "publicAwards" && (
        <PublicAwards
          publicAwardPredictions={filteredPublicAwardPredictions}
          awardResults={awardResults}
        />
      )}

      {tab === "groups" && (
        <PredictedGroupStandings
          matches={matches}
          publicPredictions={filteredPublicPredictions}
        />
      )}

      {tab === "others" && (
        <PublicPredictions publicPredictions={filteredPublicPredictions} />
      )}

      {tab === "standings" && (
        <Standings
          matches={matches}
          publicPredictions={filteredPublicPredictions}
          publicAwardPredictions={filteredPublicAwardPredictions}
          awardResults={awardResults}
        />
      )}

      {tab === "admin" && currentUser.is_admin && (
        <>
          <AdminResults
            matches={matches}
            onResultChange={updateOfficialResult}
            onSaveResult={saveOfficialResult}
          />

          <AdminGroupStandings matches={matches} />

          <AdminAwards
            results={awardResults}
            onResultChange={updateAwardResult}
            onSaveResult={saveAwardResult}
          />
        </>
      )}
    </main>
  );
}