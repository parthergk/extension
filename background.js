chrome.runtime.onInstalled.addListener(() => {
  // Set an alarm to run every 15 minutes
  chrome.alarms.create("keepAlive", { periodInMinutes: 15 });
});

// Listen for the alarm to trigger the background task periodically
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === "keepAlive") {
      console.log("Alarm triggered. Keeping the extension active.");
      // Perform any background tasks or make sure your service worker stays alive
      // For example, you could fetch data or update some state.
  }
});

// Optional: Add an event listener to reactivate the extension if it goes idle
chrome.runtime.onStartup.addListener(() => {
  console.log("Extension started again!");
});
