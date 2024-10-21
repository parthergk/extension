document.addEventListener("DOMContentLoaded", function () {
  const createGroupBtn = document.getElementById("create-group-btn");
  const joinGroupBtn = document.getElementById("join-group-btn");
  const shareContentBtn = document.getElementById("share-content-btn");
  const groupList = document.querySelector(".group-list");
  const sharedItemsList = document.querySelector(".shared-items-list");

  let userId = "sk"; // Replace with actual user identification (e.g., user email or ID)
  let userGroup = null;

  // Check if the user is already in a group on extension load
  chrome.storage.local.get(["userGroup"], function (result) {
    if (result.userGroup) {
      userGroup = result.userGroup;
      updateGroupList();
      loadGroupItems(userGroup._id); // Automatically load the group content if user is in a group
    }
  });

  const apiUrl = "http://localhost:3000";

  // Create Group
  createGroupBtn.addEventListener("click", function () {
    if (userGroup) {
      alert("You are already part of a group.");
      return;
    }

    const groupName = document.getElementById("new-group-name").value;
    if (groupName) {
      fetch(`${apiUrl}/groups/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: groupName, userId: userId }),
      })
        .then((response) => response.json())
        .then((data) => {
          if (data.success) {
            userGroup = data.group;
            chrome.storage.local.set({ userGroup: userGroup }); // Persist the group in storage
            updateGroupList();
            loadGroupItems(userGroup._id); // Automatically load the group content
          }
        });
    }
  });

  // Join Group
  joinGroupBtn.addEventListener("click", function () {
    if (userGroup) {
      alert("You are already part of a group.");
      return;
    }

    const groupCode = document.getElementById("group-code").value;
    if (groupCode) {
      fetch(`${apiUrl}/groups/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: groupCode, userId: userId }),
      })
        .then((response) => response.json())
        .then((data) => {
          if (data.success) {
            userGroup = data.group;
            chrome.storage.local.set({ userGroup: userGroup }); // Persist the group in storage
            updateGroupList();
            loadGroupItems(userGroup._id); // Automatically load the group content
          }
        });
    }
  });

  // Share Content
  shareContentBtn.addEventListener("click", function () {
    if (!userGroup) {
      alert("You must join or create a group first.");
      return;
    }

    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      const currentTab = tabs[0];
      const contentUrl = currentTab.url;

      fetch(`${apiUrl}/groups/share`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          groupId: userGroup._id,
          url: contentUrl,
          userId: userId,
        }),
      })
        .then((response) => response.json())
        .then((data) => {
          if (data.success) {
            sharedItemsList.innerHTML += `<div>Shared with ${userGroup.name}: <a href="${contentUrl}" target="_blank">${contentUrl}</a></div>`;
            loadGroupItems(userGroup._id);
          }
        });
    });
  });

  function updateGroupList() {
    if (userGroup) {
      groupList.innerHTML = `
                <div class="group-item" id="${userGroup._id}">
                    <span>${userGroup.name}</span>
                    <button class="leave-group-btn" data-group-id="${userGroup._id}">Leave Group</button>
                </div>
            `;
    } else {
      groupList.innerHTML = "You are not part of any group.";
    }
  }

  // Load items for a specific group
  function loadGroupItems(groupId) {
    fetch(`${apiUrl}/groups/${groupId}/items`)
      .then((response) => response.json())
      .then((data) => {
        if (data.success) {
          const groupItems = data.items
            .map(
              (item) => `
                        <div class="shared-item">
                            <a href="${item.url}" target="_blank">${item.url}</a>
                        </div>
                    `
            )
            .join("");
          sharedItemsList.innerHTML = groupItems;
        }
      });
  }

  // Leave Group
  groupList.addEventListener("click", function (event) {
    if (event.target.classList.contains("leave-group-btn")) {
      // Clear the group data locally
      userGroup = null;
      chrome.storage.local.remove("userGroup"); // Clear the group from storage

      // Stop any further operations related to the group
      updateGroupList();
      sharedItemsList.innerHTML = ""; // Clear shared items

      // Stop any ongoing processes in the background (like alarms or API calls)
      chrome.alarms.clear("keepAlive"); // Stop the extension's background processes
      chrome.runtime.sendMessage({ action: "stopBackgroundTasks" }); // Optionally stop other tasks

      // Optionally, show a message to confirm the user has left the group
      alert("You have left the group, and the extension has stopped.");

      // You can also clear other relevant data stored in the extension if needed
      // chrome.storage.local.clear();  // Clear all local storage if required
    }
  });
});
