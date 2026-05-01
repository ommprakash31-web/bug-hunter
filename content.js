(() => {
  const DEFAULT_SETTINGS = {
    enabled: true,
    delay: 2,
    difficulty: "medium",
    mute: false,
    highScore: 0
  };

  const state = {
    settings: { ...DEFAULT_SETTINGS },
    overlayVisible: false,
    iframe: null,
    delayTimer: null,
    loadingDone: false
  };

  const OVERLAY_ID = "bug-hunter-overlay";

  const createOverlay = () => {
    if (document.getElementById(OVERLAY_ID)) return;

    const overlay = document.createElement("div");
    overlay.id = OVERLAY_ID;
    overlay.className = "bug-hunter-overlay hidden";

    const shell = document.createElement("div");
    shell.className = "bug-hunter-shell";

    const closeBtn = document.createElement("button");
    closeBtn.className = "bug-hunter-close";
    closeBtn.type = "button";
    closeBtn.textContent = "✕";
    closeBtn.setAttribute("aria-label", "Close Bug Hunter game");
    closeBtn.addEventListener("click", hideOverlay);

    const iframe = document.createElement("iframe");
    iframe.className = "bug-hunter-iframe";
    iframe.src = chrome.runtime.getURL("game.html");
    iframe.title = "Bug Hunter: Loading Rescue";

    state.iframe = iframe;

    shell.appendChild(closeBtn);
    shell.appendChild(iframe);
    overlay.appendChild(shell);
    document.documentElement.appendChild(overlay);

    wireFrameMessaging();
  };

  const wireFrameMessaging = () => {
    window.addEventListener("message", (event) => {
      if (event.source !== state.iframe?.contentWindow) return;
      if (!event.data || event.data.type !== "bug-hunter") return;

      if (event.data.action === "request-config") {
        sendConfigToGame();
      }

      if (event.data.action === "save-high-score") {
        const nextScore = Number(event.data.value || 0);
        const current = Number(state.settings.highScore || 0);
        if (nextScore > current) {
          state.settings.highScore = nextScore;
          saveSettings();
        }
      }
    });
  };

  const sendConfigToGame = () => {
    if (!state.iframe?.contentWindow) return;

    state.iframe.contentWindow.postMessage(
      {
        type: "bug-hunter",
        action: "config",
        payload: {
          difficulty: state.settings.difficulty,
          mute: state.settings.mute,
          highScore: state.settings.highScore
        }
      },
      "*"
    );
  };

  function showOverlay() {
    if (state.overlayVisible || !state.settings.enabled) return;
    createOverlay();

    const overlay = document.getElementById(OVERLAY_ID);
    if (!overlay) return;

    overlay.classList.remove("hidden");
    state.overlayVisible = true;

    setTimeout(sendConfigToGame, 60);
  }

  function hideOverlay() {
    const overlay = document.getElementById(OVERLAY_ID);
    if (!overlay) return;

    overlay.classList.add("hidden");
    state.overlayVisible = false;

    state.iframe?.contentWindow?.postMessage(
      {
        type: "bug-hunter",
        action: "website-loaded"
      },
      "*"
    );

    setTimeout(() => {
      overlay.remove();
      state.iframe = null;
    }, 900);
  }

  const handleLoaded = () => {
    state.loadingDone = true;
    clearTimeout(state.delayTimer);

    if (state.overlayVisible) {
      hideOverlay();
    }
  };

  const startDelayWatcher = () => {
    clearTimeout(state.delayTimer);

    state.delayTimer = setTimeout(() => {
      if (!state.loadingDone && document.readyState !== "complete") {
        showOverlay();
      }
    }, Number(state.settings.delay) * 1000);
  };

  const saveSettings = () => {
    chrome.storage.local.set({ bugHunterSettings: state.settings });
  };

  const loadSettings = () => {
    chrome.storage.local.get(["bugHunterSettings"], (data) => {
      state.settings = { ...DEFAULT_SETTINGS, ...(data.bugHunterSettings || {}) };

      if (document.readyState === "complete") {
        state.loadingDone = true;
      }

      startDelayWatcher();
    });
  };

  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName !== "local" || !changes.bugHunterSettings) return;
    state.settings = { ...DEFAULT_SETTINGS, ...changes.bugHunterSettings.newValue };
    if (!state.settings.enabled && state.overlayVisible) {
      hideOverlay();
    }
  });

  window.addEventListener("load", handleLoaded, { once: true });
  document.addEventListener("readystatechange", () => {
    if (document.readyState === "complete") {
      handleLoaded();
    }
  });

  loadSettings();
})();
