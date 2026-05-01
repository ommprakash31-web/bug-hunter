// Background service worker kept lightweight for future extension events.
chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.get(["bugHunterSettings"], (data) => {
    if (data.bugHunterSettings) return;

    chrome.storage.local.set({
      bugHunterSettings: {
        enabled: true,
        delay: 2,
        difficulty: "medium",
        mute: false,
        highScore: 0
      }
    });
  });
});
