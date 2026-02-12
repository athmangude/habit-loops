/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_GOOGLE_CLIENT_ID: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare namespace google {
  namespace accounts {
    namespace oauth2 {
      function initTokenClient(config: {
        client_id: string;
        scope: string;
        callback: (response: { access_token: string; expires_in: number; scope: string; token_type: string; error?: string }) => void;
      }): { requestAccessToken: (opts?: { prompt?: string }) => void };
      function revoke(token: string, callback: () => void): void;
    }
  }
}

declare namespace gapi {
  function load(api: string, callback: () => void): void;
  namespace client {
    function init(config: { discoveryDocs: string[] }): Promise<void>;
    function setToken(token: { access_token: string } | null): void;
    function getToken(): { access_token: string } | null;
    namespace sheets {
      namespace spreadsheets {
        function create(request: unknown): Promise<{ result: { spreadsheetId: string } }>;
        function get(request: unknown): Promise<{ result: unknown }>;
        function batchUpdate(request: unknown): Promise<unknown>;
        namespace values {
          function get(request: unknown): Promise<{ result: { values?: string[][] } }>;
          function update(request: unknown): Promise<unknown>;
          function batchUpdate(request: unknown): Promise<unknown>;
          function append(request: unknown): Promise<unknown>;
        }
      }
    }
    namespace drive {
      namespace files {
        function list(request: unknown): Promise<{ result: { files: Array<{ id: string; name: string }> } }>;
        function create(request: unknown): Promise<{ result: { id: string } }>;
      }
    }
  }
}
