(() => {
  const BUGS = [
    { title: "Syntax Error", prompt: "Unexpected token near line 21", options: ["Fix missing bracket", "Delete index.html", "Remove script tag", "Restart Wi-Fi"], answer: 0 },
    { title: "Undefined Variable", prompt: "User object is not defined", options: ["Declare variable before use", "Rename CSS file", "Delete form", "Clear browser history"], answer: 0 },
    { title: "Missing Semicolon", prompt: "Statement terminated incorrectly", options: ["Add semicolon", "Remove all semicolons", "Disable JavaScript", "Delete body tag"], answer: 0 },
    { title: "Broken Image Path", prompt: "Image 404 error", options: ["Fix src path", "Delete assets folder", "Turn off monitor", "Use random URL"], answer: 0 },
    { title: "Button Not Working", prompt: "Click does nothing", options: ["Add event listener", "Delete CSS file", "Remove body tag", "Refresh computer"], answer: 0 },
    { title: "CSS Not Loading", prompt: "Stylesheet not applied", options: ["Check rel and href", "Remove head tag", "Convert to TXT", "Disable cache forever"], answer: 0 },
    { title: "Wrong Class Name", prompt: "Element not styled", options: ["Match class names", "Delete class attribute", "Reload router", "Set opacity 0"], answer: 0 },
    { title: "API Failed", prompt: "Server responded with error", options: ["Add error handling", "Delete endpoint", "Disable internet", "Hardcode every response"], answer: 0 },
    { title: "Form Validation Missing", prompt: "Bad input accepted", options: ["Add client-side validation", "Remove form fields", "Disable submit button", "Rename HTML file"], answer: 0 },
    { title: "Navbar Not Responsive", prompt: "Menu overlaps on mobile", options: ["Use media queries", "Remove viewport meta", "Force fixed width", "Hide navbar"], answer: 0 },
    { title: "Infinite Loop Warning", prompt: "Loop never exits", options: ["Update loop condition", "Increase interval forever", "Use while(true)", "Delete console"], answer: 0 },
    { title: "LocalStorage Error", prompt: "Data not saved correctly", options: ["Check JSON parse/stringify", "Disable storage", "Use random keys", "Clear all tabs"], answer: 0 }
  ];

  const state = { score: 0, combo: 0, health: 100, highScore: 0, difficulty: "medium", mute: false, timer: 0, running: true, gamePaused: false };
  const $ = (id) => document.getElementById(id);
  const playfield = $("playfield");

  let bugSpawner;
  let timerInterval;

  const speeds = { easy: 9, medium: 7, hard: 5 };
  const spawnRates = { easy: 1800, medium: 1200, hard: 850 };

  const updateHUD = () => {
    $("score").textContent = state.score;
    $("combo").textContent = state.combo;
    $("timer").textContent = state.timer.toFixed(1);
    $("healthBar").value = state.health;
    $("highScore").textContent = state.highScore;
  };

  const playBeep = (ok) => {
    if (state.mute) return;
    const audio = new AudioContext();
    const osc = audio.createOscillator();
    const gain = audio.createGain();
    osc.type = "triangle";
    osc.frequency.value = ok ? 620 : 170;
    gain.gain.value = 0.03;
    osc.connect(gain);
    gain.connect(audio.destination);
    osc.start();
    osc.stop(audio.currentTime + 0.08);
  };

  const applyDifficulty = (difficulty) => {
    state.difficulty = speeds[difficulty] ? difficulty : "medium";
  };

  const getBug = () => BUGS[Math.floor(Math.random() * BUGS.length)];

  const spawnBug = () => {
    if (!state.running || state.gamePaused) return;

    const bugData = getBug();
    const node = document.createElement("button");
    node.className = "bug";
    node.textContent = "🐞";
    node.style.left = `${Math.random() * 88 + 4}%`;
    node.style.animationDuration = `${speeds[state.difficulty]}s`;

    const timeout = setTimeout(() => {
      state.health = Math.max(0, state.health - 10);
      state.combo = 0;
      node.remove();
      updateHUD();
      if (state.health === 0) endGame("System crashed! Too many bugs escaped.");
    }, speeds[state.difficulty] * 1000);

    node.addEventListener("click", () => {
      clearTimeout(timeout);
      node.remove();
      showQuiz(bugData);
    });

    playfield.appendChild(node);
  };

  const showQuiz = (bugData) => {
    state.gamePaused = true;
    const modal = $("quizModal");
    $("bugTitle").textContent = bugData.title;
    $("bugPrompt").textContent = bugData.prompt;

    const optionsBox = $("options");
    optionsBox.innerHTML = "";

    bugData.options.forEach((option, i) => {
      const button = document.createElement("button");
      button.textContent = `${String.fromCharCode(65 + i)}. ${option}`;
      button.addEventListener("click", () => {
        const correct = i === bugData.answer;
        if (correct) {
          state.combo += 1;
          state.score += 10 + state.combo * 2;
          playBeep(true);
        } else {
          state.combo = 0;
          state.health = Math.max(0, state.health - 12);
          playBeep(false);
        }

        updateHUD();
        modal.classList.add("hidden");
        state.gamePaused = false;

        if (state.health === 0) endGame("System crashed! Too many wrong fixes.");
      });
      optionsBox.appendChild(button);
    });

    modal.classList.remove("hidden");
  };

  const endGame = (message, loaded = false) => {
    if (!state.running) return;
    state.running = false;
    clearInterval(bugSpawner);
    clearInterval(timerInterval);

    if (loaded) {
      const bonus = Math.max(0, Math.floor(state.combo * 3 + state.health / 5));
      state.score += bonus;
    }

    if (state.score > state.highScore) {
      state.highScore = state.score;
      window.parent.postMessage({ type: "bug-hunter", action: "save-high-score", value: state.score }, "*");
    }

    updateHUD();
    const panel = $("statusPanel");
    panel.innerHTML = `<strong>${message}</strong><span> Final score: ${state.score}</span>`;
  };

  const start = () => {
    bugSpawner = setInterval(spawnBug, spawnRates[state.difficulty]);
    timerInterval = setInterval(() => {
      state.timer += 0.1;
      updateHUD();
    }, 100);
  };

  window.addEventListener("message", (event) => {
    const { data } = event;
    if (!data || data.type !== "bug-hunter") return;

    if (data.action === "config") {
      applyDifficulty(data.payload?.difficulty);
      state.mute = Boolean(data.payload?.mute);
      state.highScore = Number(data.payload?.highScore || 0);
      updateHUD();
      if (!bugSpawner) start();
    }

    if (data.action === "website-loaded") {
      endGame("Website Loaded Successfully ✅", true);
    }
  });

  // Request config immediately from content script.
  window.parent.postMessage({ type: "bug-hunter", action: "request-config" }, "*");
  updateHUD();
})();
