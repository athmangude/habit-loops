import { GOOGLE_CLIENT_ID, SCOPES, DISCOVERY_DOCS } from '../config/google';
import type { GoogleUser, TokenResponse } from '../types/google';

let tokenClient: ReturnType<typeof google.accounts.oauth2.initTokenClient> | null = null;

export function loadGapiClient(): Promise<void> {
  return new Promise((resolve, reject) => {
    const check = () => {
      if (typeof gapi !== 'undefined') {
        gapi.load('client', async () => {
          try {
            await gapi.client.init({ discoveryDocs: DISCOVERY_DOCS });
            resolve();
          } catch (err) {
            reject(err);
          }
        });
      } else {
        setTimeout(check, 100);
      }
    };
    check();
  });
}

export function initTokenClient(
  onSuccess: (response: TokenResponse) => void,
  onError: (error: string) => void,
): void {
  const check = () => {
    if (typeof google !== 'undefined' && google.accounts) {
      tokenClient = google.accounts.oauth2.initTokenClient({
        client_id: GOOGLE_CLIENT_ID,
        scope: SCOPES,
        callback: (response) => {
          if (response.error) {
            onError(response.error);
          } else {
            onSuccess(response as TokenResponse);
          }
        },
      });
    } else {
      setTimeout(check, 100);
    }
  };
  check();
}

export function requestAccessToken(prompt?: string): void {
  if (tokenClient) {
    tokenClient.requestAccessToken({ prompt: prompt || '' });
  }
}

export function revokeToken(): void {
  const token = gapi.client.getToken();
  if (token) {
    google.accounts.oauth2.revoke(token.access_token, () => {});
    gapi.client.setToken(null);
  }
}

export async function fetchUserInfo(accessToken: string): Promise<GoogleUser> {
  const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const data = await response.json();
  return {
    name: data.name,
    email: data.email,
    picture: data.picture,
  };
}
