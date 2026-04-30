// SW + cache kill-switch. Runs once per session before app boot.
// Defends against stale service workers / cache storage from previous deploys.
(function () {
  try {
    if (sessionStorage.getItem("__edzen_sw_killed") === "1") return;
    sessionStorage.setItem("__edzen_sw_killed", "1");

    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.getRegistrations().then(function (regs) {
        regs.forEach(function (r) { r.unregister().catch(function () {}); });
      }).catch(function () {});
    }
    if (typeof caches !== "undefined" && caches.keys) {
      caches.keys().then(function (keys) {
        keys.forEach(function (k) { caches.delete(k).catch(function () {}); });
      }).catch(function () {});
    }
  } catch (e) { /* no-op */ }
})();
