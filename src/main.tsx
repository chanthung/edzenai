import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Auto-recover from stale chunk references after a redeploy.
// When the browser holds an old index.html and tries to import a hashed JS chunk
// that no longer exists, we silently reload once. The session flag prevents loops.
(function setupChunkErrorRecovery() {
  const FLAG = "__edzen_chunk_reloaded";
  const isChunkError = (msg: string) =>
    /Loading chunk|ChunkLoadError|Failed to fetch dynamically imported module|Importing a module script failed/i.test(
      msg || ""
    );
  const tryReload = (msg: string) => {
    if (!isChunkError(msg)) return;
    try {
      if (sessionStorage.getItem(FLAG) === "1") return;
      sessionStorage.setItem(FLAG, "1");
    } catch { /* ignore */ }
    window.location.reload();
  };
  window.addEventListener("error", (e) => tryReload(e?.message || ""));
  window.addEventListener("unhandledrejection", (e) => {
    const reason: any = e?.reason;
    tryReload(typeof reason === "string" ? reason : reason?.message || "");
  });
})();

createRoot(document.getElementById("root")!).render(<App />);
