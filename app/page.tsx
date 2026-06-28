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
  KnockoutPrediction,
  PublicKnockoutPrediction,
  KnockoutResult,
} from "@/types";
import { PublicAwards } from "@/components/PublicAwards";
import { AdminAwards } from "@/components/AdminAwards";
import { KnockoutBracket } from "@/components/KnockoutBracket";
import { KnockoutPredictions } from "@/components/KnockoutPredictions";
import { calculateRealGroupStandings } from "@/lib/groupStandings";
import { generateBracketTree, resolveRoundOf32 } from "@/lib/knockout";
import { PublicKnockoutPredictions } from "@/components/PublicKnockoutPredictions";
import { AdminKnockoutResults } from "@/components/AdminKnockoutResults";
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
  const [predictionSection, setPredictionSection] = useState<
    "groups" | "awards" | "knockout"
  >("groups");
  const [publicSection, setPublicSection] = useState<
    "matches" | "groups" | "awards" | "knockout"
  >("matches");
  const [publicKnockoutPredictions, setPublicKnockoutPredictions] = useState<
    PublicKnockoutPrediction[]
  >([]);
  const [knockoutResults, setKnockoutResults] = useState<
    Record<number, KnockoutResult>
  >({});
  const [editedOfficialResults, setEditedOfficialResults] = useState<
    Record<number, { home_score: number | null; away_score: number | null }>
  >({});
  const groupStagePredictionDeadline = new Date("2026-06-13T17:00:00+02:00");
  const areGroupStagePredictionsClosed = new Date() >= groupStagePredictionDeadline;
  const lastGroupStageMatch = matches
    .filter((match) => match.group_name)
    .sort(
      (a, b) =>
        new Date(b.kickoff).getTime() - new Date(a.kickoff).getTime()
    )[0];

  const knockoutPredictionsDeadline = new Date("2026-06-29T19:00:00");

  const areKnockoutPredictionsOpen = new Date() < knockoutPredictionsDeadline;

  const [awardPredictions, setAwardPredictions] = useState<
    Record<string, AwardPrediction>
  >({});
  const [knockoutPredictions, setKnockoutPredictions] = useState<
    Record<number, KnockoutPrediction>
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
      loadPublicKnockoutPredictions();
      loadKnockoutResults();
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

    const { data: knockoutPredictionsData, error: knockoutPredictionsError } =
      await supabase
        .from("knockout_predictions")
        .select("match_id, predicted_home, predicted_away, qualified_team")
        .eq("user_id", userId);

    if (knockoutPredictionsError) {
      setError("No s'han pogut carregar els pronòstics d'eliminatòries.");
      return;
    }

    const knockoutPredictionsByMatch: Record<number, KnockoutPrediction> = {};

    for (const prediction of knockoutPredictionsData || []) {
      knockoutPredictionsByMatch[prediction.match_id] = prediction;
    }

    setKnockoutPredictions(knockoutPredictionsByMatch);
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

  async function loadPublicKnockoutPredictions() {
    const { data, error } = await supabase
      .from("knockout_predictions")
      .select(`
      match_id,
      predicted_home,
      predicted_away,
      qualified_team,
      users (
        name,
        group_name
      )
    `)
      .range(0, 10000);

    if (error) {
      setError("No s'han pogut carregar les eliminatòries dels altres.");
      return;
    }

    setPublicKnockoutPredictions(
      (data ?? []) as unknown as PublicKnockoutPrediction[]
    );
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

    setEditedOfficialResults((current) => ({
      ...current,
      [matchId]: {
        home_score: current[matchId]?.home_score ?? null,
        away_score: current[matchId]?.away_score ?? null,
        [field]: numericValue,
      },
    }));
  }

  async function saveOfficialResult(matchId: number) {
    const match = matches.find((item) => item.id === matchId);

    if (!match) return;

    const editedResult = editedOfficialResults[matchId];

    const homeScore =
      editedResult?.home_score !== undefined
        ? editedResult.home_score
        : match.home_score;

    const awayScore =
      editedResult?.away_score !== undefined
        ? editedResult.away_score
        : match.away_score;

    if (homeScore === null || awayScore === null) {
      setError("Has d'omplir els dos resultats abans de desar.");
      return;
    }

    setError("");
    setSavedMessage("");

    const { error } = await supabase
      .from("matches")
      .update({
        home_score: homeScore,
        away_score: awayScore,
      })
      .eq("id", matchId);

    if (error) {
      setError("No s'ha pogut desar el resultat oficial.");
      return;
    }

    setMatches((currentMatches) =>
      currentMatches.map((item) =>
        item.id === matchId
          ? {
            ...item,
            home_score: homeScore,
            away_score: awayScore,
          }
          : item
      )
    );

    setEditedOfficialResults((current) => {
      const next = { ...current };
      delete next[matchId];
      return next;
    });

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

  function updateKnockoutPrediction(
    matchId: number,
    field: "predicted_home" | "predicted_away" | "qualified_team",
    value: string
  ) {
    setKnockoutPredictions((current) => {
      const currentPrediction = current[matchId];

      const nextPrediction: KnockoutPrediction = {
        match_id: matchId,
        predicted_home: currentPrediction?.predicted_home ?? null,
        predicted_away: currentPrediction?.predicted_away ?? null,
        qualified_team: currentPrediction?.qualified_team ?? null,
      };

      if (field === "qualified_team") {
        nextPrediction.qualified_team = value;
      } else {
        nextPrediction[field] = value === "" ? null : Number(value);
      }

      const groupStandings = calculateRealGroupStandings(matches);
      const roundOf32Matches = resolveRoundOf32(groupStandings);
      const bracket = generateBracketTree(roundOf32Matches, current);

      const knockoutMatch = bracket.matches.find((match) => match.id === matchId);

      if (
        knockoutMatch &&
        nextPrediction.predicted_home !== null &&
        nextPrediction.predicted_away !== null
      ) {
        if (nextPrediction.predicted_home > nextPrediction.predicted_away) {
          nextPrediction.qualified_team = knockoutMatch.homeTeam;
        } else if (nextPrediction.predicted_home < nextPrediction.predicted_away) {
          nextPrediction.qualified_team = knockoutMatch.awayTeam;
        } else if (
          nextPrediction.qualified_team !== knockoutMatch.homeTeam &&
          nextPrediction.qualified_team !== knockoutMatch.awayTeam
        ) {
          nextPrediction.qualified_team = null;
        }
      }

      return {
        ...current,
        [matchId]: nextPrediction,
      };
    });
  }

  async function saveKnockoutPrediction(matchId: number) {
    if (!currentUser) return;

    const prediction = knockoutPredictions[matchId];

    if (
      !prediction ||
      prediction.predicted_home === null ||
      prediction.predicted_away === null ||
      !prediction.qualified_team
    ) {
      setError("Has d'indicar resultat i equip classificat.");
      return;
    }

    const { error } = await supabase.from("knockout_predictions").upsert({
      user_id: currentUser.id,
      match_id: matchId,
      predicted_home: prediction.predicted_home,
      predicted_away: prediction.predicted_away,
      qualified_team: prediction.qualified_team,
    });

    if (error) {
      console.error(error);
      setError(`No s'ha pogut desar el pronòstic d'eliminatòries: ${error.message}`);
      return;
    }

    setSavedMessage("Pronòstic d'eliminatòries desat correctament.");
    loadPublicKnockoutPredictions();
  }

  async function saveAllKnockoutPredictions() {
    if (!currentUser) return;

    const completedPredictions = Object.values(knockoutPredictions).filter(
      (prediction) =>
        prediction.predicted_home !== null &&
        prediction.predicted_away !== null &&
        prediction.qualified_team
    );

    if (completedPredictions.length === 0) {
      setError("No hi ha cap pronòstic d'eliminatòries complet per desar.");
      return;
    }

    const rowsToSave = completedPredictions.map((prediction) => ({
      user_id: currentUser.id,
      match_id: prediction.match_id,
      predicted_home: prediction.predicted_home,
      predicted_away: prediction.predicted_away,
      qualified_team: prediction.qualified_team,
    }));

    const { error } = await supabase
      .from("knockout_predictions")
      .upsert(rowsToSave);

    if (error) {
      console.error(error);
      setError(`No s'han pogut desar els pronòstics d'eliminatòries: ${error.message}`);
      return;
    }

    setSavedMessage("Pronòstics d'eliminatòries desats correctament.");
    loadPublicKnockoutPredictions();
  }

  async function loadKnockoutResults() {
    const { data, error } = await supabase
      .from("knockout_results")
      .select("match_id, official_home, official_away, qualified_team");

    if (error) {
      setError("No s'han pogut carregar els resultats d'eliminatòries.");
      return;
    }

    const resultsByMatch: Record<number, KnockoutResult> = {};

    for (const result of data || []) {
      resultsByMatch[result.match_id] = result;
    }

    setKnockoutResults(resultsByMatch);
  }
  function updateKnockoutResult(
    matchId: number,
    field: "official_home" | "official_away" | "qualified_team",
    value: string
  ) {
    setKnockoutResults((current) => {
      const currentResult = current[matchId];

      const nextResult: KnockoutResult = {
        match_id: matchId,
        official_home: currentResult?.official_home ?? null,
        official_away: currentResult?.official_away ?? null,
        qualified_team: currentResult?.qualified_team ?? null,
      };

      if (field === "qualified_team") {
        nextResult.qualified_team = value;
      } else {
        nextResult[field] = value === "" ? null : Number(value);
      }

      const groupStandings = calculateRealGroupStandings(matches);
      const roundOf32Matches = resolveRoundOf32(groupStandings);

      const resultPredictions = Object.fromEntries(
        Object.values(current).map((result) => [
          result.match_id,
          { qualified_team: result.qualified_team },
        ])
      );

      const bracket = generateBracketTree(roundOf32Matches, resultPredictions);
      const knockoutMatch = bracket.matches.find((match) => match.id === matchId);

      if (
        knockoutMatch &&
        nextResult.official_home !== null &&
        nextResult.official_away !== null
      ) {
        if (nextResult.official_home > nextResult.official_away) {
          nextResult.qualified_team = knockoutMatch.homeTeam;
        } else if (nextResult.official_home < nextResult.official_away) {
          nextResult.qualified_team = knockoutMatch.awayTeam;
        } else if (
          nextResult.qualified_team !== knockoutMatch.homeTeam &&
          nextResult.qualified_team !== knockoutMatch.awayTeam
        ) {
          nextResult.qualified_team = null;
        }
      }

      return {
        ...current,
        [matchId]: nextResult,
      };
    });
  }

  async function saveKnockoutResult(matchId: number) {
    const result = knockoutResults[matchId];

    if (
      !result ||
      result.official_home === null ||
      result.official_away === null ||
      !result.qualified_team
    ) {
      setError("Has d'indicar resultat i equip classificat.");
      return;
    }

    const { error } = await supabase.from("knockout_results").upsert({
      match_id: matchId,
      official_home: result.official_home,
      official_away: result.official_away,
      qualified_team: result.qualified_team,
      updated_at: new Date().toISOString(),
    });

    if (error) {
      console.error(error);
      setError(`No s'ha pogut desar el resultat d'eliminatòries: ${error.message}`);
      return;
    }

    setSavedMessage("Resultat d'eliminatòries desat correctament.");
    loadKnockoutResults();
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

  const filteredPublicKnockoutPredictions =
    selectedGroup === "ALL" || selectedGroup === null
      ? publicKnockoutPredictions
      : publicKnockoutPredictions.filter(
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
        <>
          <div className="tabs" style={{ marginBottom: "16px" }}>
            <button
              className={predictionSection === "groups" ? "tab active" : "tab"}
              onClick={() => setPredictionSection("groups")}
            >
              Fase de Grups
            </button>

            <button
              className={predictionSection === "awards" ? "tab active" : "tab"}
              onClick={() => setPredictionSection("awards")}
            >
              Premis
            </button>

            <button
              className={predictionSection === "knockout" ? "tab active" : "tab"}
              onClick={() => setPredictionSection("knockout")}
            >
              Eliminatòries
            </button>
          </div>

          {predictionSection === "groups" && (
            <PredictionList
              matches={matches}
              predictions={predictions}
              predictionsClosed={areGroupStagePredictionsClosed}
              onPredictionChange={updatePrediction}
              onSaveAllPredictions={saveAllPredictions}
            />
          )}

          {predictionSection === "awards" && (
            <AwardPredictions
              predictions={awardPredictions}
              predictionsClosed={areGroupStagePredictionsClosed}
              onAwardChange={updateAwardPrediction}
              onSaveAward={saveAwardPrediction}
            />
          )}

          {predictionSection === "knockout" && (
            <KnockoutPredictions
              matches={matches}
              predictions={knockoutPredictions}
              knockoutResults={knockoutResults}
              predictionsOpen={areKnockoutPredictionsOpen}
              onPredictionChange={updateKnockoutPrediction}
              onSaveAllPredictions={saveAllKnockoutPredictions}
            />
          )}
        </>
      )}

      {tab === "others" && (
        <>
          <div className="tabs" style={{ marginBottom: "16px" }}>
            <button
              className={publicSection === "matches" ? "tab active" : "tab"}
              onClick={() => setPublicSection("matches")}
            >
              Fase de Grups
            </button>

            <button
              className={publicSection === "groups" ? "tab active" : "tab"}
              onClick={() => setPublicSection("groups")}
            >
              Grups
            </button>

            <button
              className={publicSection === "awards" ? "tab active" : "tab"}
              onClick={() => setPublicSection("awards")}
            >
              Premis
            </button>

            <button
              className={publicSection === "knockout" ? "tab active" : "tab"}
              onClick={() => setPublicSection("knockout")}
            >
              Eliminatòries
            </button>
          </div>

          {publicSection === "matches" && (
            <PublicPredictions publicPredictions={filteredPublicPredictions} />
          )}

          {publicSection === "groups" && (
            <PredictedGroupStandings
              matches={matches}
              publicPredictions={filteredPublicPredictions}
            />
          )}

          {publicSection === "awards" && (
            <PublicAwards
              publicAwardPredictions={filteredPublicAwardPredictions}
              awardResults={awardResults}
            />
          )}

          {publicSection === "knockout" && (
            <PublicKnockoutPredictions
              matches={matches}
              publicKnockoutPredictions={filteredPublicKnockoutPredictions}
            />
          )}
        </>
      )}

      {tab === "standings" && (
        <Standings
          matches={matches}
          publicPredictions={filteredPublicPredictions}
          publicAwardPredictions={filteredPublicAwardPredictions}
          allPublicPredictions={publicPredictions}
          allPublicAwardPredictions={publicAwardPredictions}
          awardResults={awardResults}
          publicKnockoutPredictions={filteredPublicKnockoutPredictions}
          allPublicKnockoutPredictions={publicKnockoutPredictions}
          knockoutResults={knockoutResults}
        />
      )}

      {tab === "admin" && currentUser.is_admin && (
        <>
          <details className="card" open>
            <summary className="admin-section-summary">
              Resultats oficials
            </summary>

            <div className="admin-section-content">
              <AdminResults
                matches={matches}
                editedResults={editedOfficialResults}
                onResultChange={updateOfficialResult}
                onSaveResult={saveOfficialResult}
              />
            </div>
          </details>

          <details className="card">
            <summary className="admin-section-summary">
              Classificació real dels grups
            </summary>

            <div className="admin-section-content">
              <AdminGroupStandings matches={matches} />
            </div>
          </details>

          <details className="card">
            <summary className="admin-section-summary">
              Resultats oficials eliminatòries
            </summary>

            <div className="admin-section-content">
              <AdminKnockoutResults
                matches={matches}
                results={knockoutResults}
                onResultChange={updateKnockoutResult}
                onSaveResult={saveKnockoutResult}
              />
            </div>
          </details>

          <details className="card">
            <summary className="admin-section-summary">
              Resultats oficials dels premis
            </summary>

            <div className="admin-section-content">
              <AdminAwards
                results={awardResults}
                onResultChange={updateAwardResult}
                onSaveResult={saveAwardResult}
              />
            </div>
          </details>
        </>
      )}
    </main>
  );
}