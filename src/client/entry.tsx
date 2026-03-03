import { hydrate } from "preact";
import type { InitialState } from "../types/initial-state.js";
import { DirectoryApp } from "./directory-app.js";
import { FileApp } from "./file-app.js";
import { initTheme } from "./theme.js";

const state = (window as { __INITIAL_STATE__?: InitialState })
  .__INITIAL_STATE__;

const root = document.getElementById("app");

if (root && state) {
  if (state.mode === "directory") {
    hydrate(<DirectoryApp {...state} />, root);
  } else {
    hydrate(<FileApp {...state} />, root);
  }
} else {
  console.error("[peek] hydration failed: missing #app or initial state");
}

// Theme init runs regardless of hydration — toggle should always work
initTheme();
