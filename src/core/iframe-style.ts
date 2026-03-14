export const FULLSCREEN_IFRAME_STYLE = {
  border: "none",
  width: "100%",
  height: "100%",
  position: "absolute",
  top: "0",
  left: "0",
} as const;

export const IFRAME_SANDBOX =
  "allow-scripts allow-same-origin allow-forms allow-popups allow-modals" as const;
