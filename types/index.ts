export type User = {
  id: string;
  name: string;
  is_admin: boolean;
};

export type Match = {
  id: number;
  home_team: string;
  away_team: string;
  group_name: string;
  kickoff: string;
  home_score: number | null;
  away_score: number | null;
};

export type Prediction = {
  match_id: number;
  predicted_home: number | null;
  predicted_away: number | null;
};

export type PublicPrediction = {
  predicted_home: number | null;
  predicted_away: number | null;
  users: { name: string } | null;
  matches: Match | null;
};

export type AwardPrediction = {
  award_key: string;
  player_name: string;
};

export type PublicAwardPrediction = {
  award_key: string;
  player_name: string;
  users: { name: string } | null;
};

export type Tab = "mine" | "awards" | "groups" | "others" | "standings" | "admin";