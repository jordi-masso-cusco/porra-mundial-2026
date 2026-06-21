export type User = {
    id: string;
    name: string;
    is_admin: boolean;
    group_name: string | null;
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
    users: { name: string; group_name: string | null } | null;
    matches: Match | null;
};

export type AwardPrediction = {
    award_key: string;
    player_name: string;
};

export type PublicAwardPrediction = {
    award_key: string;
    player_name: string;
    users: { name: string; group_name: string | null } | null;
};

export type AwardResult = {
    award_key: string;
    player_name: string;
};

export type KnockoutPrediction = {
    match_id: number;
    predicted_home: number | null;
    predicted_away: number | null;  
    qualified_team: string | null;
};

export type PublicKnockoutPrediction = {
    match_id: number;
    predicted_home: number | null;
    predicted_away: number | null;
    qualified_team: string | null;
    users: { name: string; group_name: string | null } | null;
};

export type KnockoutResult = {
  match_id: number;
  official_home: number | null;
  official_away: number | null;
  qualified_team: string | null;
};

export type Tab =
    | "mine"
    | "awards"
    | "publicAwards"
    | "groups"
    | "others"
    | "standings"
    | "knockout"
    | "admin";