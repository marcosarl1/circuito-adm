export interface AuthTokens {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  username: string;
}

export interface AuthUser {
  id: string;
  username: string;
  role: string;
  created_at: string;
}

export interface LoginPayload {
  username: string;
  password: string;
}
