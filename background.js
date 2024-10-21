// Listen for events or messages from the popup (popup.js) or other extension parts
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.type === "shareContent") {
      // Handle sharing content in the background (e.g., storing content or notifying group members)
      console.log("Content shared:", request.contentUrl);
  
      // Example: Send a notification when content is shared
      chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icon48.png',
        title: 'Content Shared',
        message: 'Your content has been shared successfully!'
      });
  
      sendResponse({ status: "success" });
    }
  });
  
  // You can add other event listeners for managing group updates, alerts, or notifications
  chrome.runtime.onInstalled.addListener(function() {
    console.log("Extension installed");
  });
  