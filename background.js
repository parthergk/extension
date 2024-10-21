chrome.runtime.onInstalled.addListener(() => {
  chrome.alarms.create("keepAlive", { periodInMinutes: 15 });
});

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === "keepAlive") {
      chrome.storage.local.get(['userGroup'], function (result) {
          if (result.userGroup) {
              console.log("User is in a group. Keeping the extension active.");
              // Add additional background tasks if needed
          }
      });
  }
});

chrome.runtime.onStartup.addListener(() => {
  chrome.storage.local.get(['userGroup'], function (result) {
      if (result.userGroup) {
          console.log("Extension started again and user is still in a group.");
          // Reinitialize background tasks if needed
      }
  });
});
