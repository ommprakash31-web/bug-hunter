const DEFAULT_SETTINGS = {
  enabled: true,
  delay: 2,
  difficulty: "medium",
  mute: false,
  highScore: 0
};

const state = { ...DEFAULT_SETTINGS };

const controls = {
  enabled: document.getElementById("enabled"),
  delay: document.getElementById("delay"),
  difficulty: document.getElementById("difficulty"),
  mute: document.getElementById("mute"),
  highScore: document.getElementById("highScore"),
  resetScore: document.getElementById("resetScore")
};

const render = () => {
  controls.enabled.checked = state.enabled;
  controls.delay.value = String(state.delay);
  controls.difficulty.value = state.difficulty;
  controls.mute.checked = state.mute;
  controls.highScore.textContent = String(state.highScore);
};

const save = () => {
  chrome.storage.local.set({ bugHunterSettings: state });
};

chrome.storage.local.get(["bugHunterSettings"], (data) => {
  Object.assign(state, DEFAULT_SETTINGS, data.bugHunterSettings || {});
  render();
});

controls.enabled.addEventListener("change", () => {
  state.enabled = controls.enabled.checked;
  save();
});

controls.delay.addEventListener("change", () => {
  state.delay = Number(controls.delay.value);
  save();
});

controls.difficulty.addEventListener("change", () => {
  state.difficulty = controls.difficulty.value;
  save();
});

controls.mute.addEventListener("change", () => {
  state.mute = controls.mute.checked;
  save();
});

controls.resetScore.addEventListener("click", () => {
  state.highScore = 0;
  save();
  render();
});
