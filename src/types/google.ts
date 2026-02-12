export interface GoogleUser {
  name: string;
  email: string;
  picture: string;
}

export interface TokenResponse {
  access_token: string;
  expires_in: number;
  scope: string;
  token_type: string;
}
