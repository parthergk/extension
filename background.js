// When the extension is installed or updated, create an alarm to keep it alive
chrome.runtime.onInstalled.addListener(() => {
  chrome.alarms.create("keepAlive", { periodInMinutes: 15 });
});

// Keep the extension alive as long as the user is in a group
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === "keepAlive") {
    chrome.storage.local.get(['userGroup'], function (result) {
      if (result.userGroup) {
        console.log("User is in a group. Keeping the extension active.");
        // Perform any background tasks or updates if needed
      } else {
        console.log("User is not in a group. No need to keep extension alive.");
      }
    });
  }
});

// When Chrome starts, check if the user is in a group and resume tasks
chrome.runtime.onStartup.addListener(() => {
  chrome.storage.local.get(['userGroup'], function (result) {
    if (result.userGroup) {
      console.log("Extension started again, and the user is still in a group.");
      // Reinitialize background tasks if needed
      chrome.alarms.create("keepAlive", { periodInMinutes: 15 });
    }
  });
});
