/// <reference types="vite/client" />

declare interface ImportMetaEnv {
  readonly VITE_GEMINI_API_KEY: string;
  // ...add more env variables if needed
}

declare interface ImportMeta {
  readonly env: ImportMetaEnv;
}
