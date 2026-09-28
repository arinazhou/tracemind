/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** "1" for the GitHub Pages build: no backend, everything runs in the browser. */
  readonly VITE_STATIC?: string
}
