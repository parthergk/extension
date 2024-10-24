document.addEventListener("DOMContentLoaded", function () {
  const createGroupBtn = document.getElementById("create-group-btn");
  const joinGroupBtn = document.getElementById("join-group-btn");
  const shareContentBtn = document.getElementById("share-content-btn");
  const groupList = document.querySelector(".group-list");
  const sharedItemsList = document.querySelector(".shared-items-list");
  const apiUrl = "https://extension-silk.vercel.app"; // Use HTTPS for secure communication
  let userGroup = null;

  // Input sanitization function
  function sanitizeInput(input) {
    const element = document.createElement("div");
    element.innerText = input;
    return element.innerHTML;
  }

  function addSharedItemToUI(item) {
    const sharedItem = document.createElement("div");
    sharedItem.classList.add("shared-item");
    sharedItem.innerHTML = `<a href="${sanitizeInput(item.url)}" target="_blank" rel="noopener noreferrer">${sanitizeInput(item.url)}</a>`;
    sharedItemsList.appendChild(sharedItem);
    // Check if item and item.url exist
    // if (item && item.url) {
    //   const sharedItem = document.createElement('div');
    //   sharedItem.classList.add('shared-item');
    //   sharedItem.innerHTML = `
    //     <a href="${sanitizeInput(item.url)}" target="_blank" rel="noopener noreferrer">${sanitizeInput(item.url)}</a>
    //     <span>Shared at: ${new Date(item.sharedAt).toLocaleString()}</span>
    //   `;
    //   sharedItemsList.appendChild(sharedItem);
    // } else {
    //   console.error("Error: Shared item is missing or doesn't have a URL:", item);
    // }
  }
  


  // Update Group List UI
  function updateGroupList() {
    const groupInfo = document.getElementById("group-info");
    groupInfo.innerHTML = userGroup
      ? `
        <div class="group-item" id="${userGroup._id}">
            <span>${sanitizeInput(userGroup.name)}</span>
            <span> (Code: ${sanitizeInput(userGroup.code)})</span>
            <button class="leave-group-btn share-button" data-group-id="${userGroup._id}">Leave</button>
        </div>`
      : "You are not part of any group.";
  }

  // Load Group Items from the backend
  async function loadGroupItems(groupId) {
    try {
      const response = await fetch(`${apiUrl}/groups/${groupId}/items`);
      const data = await response.json();
      if (data.success) {
        sharedItemsList.innerHTML = ''; // Clear current list
        data.items.forEach(addSharedItemToUI);
      }
    } catch (error) {
      console.error("Error loading group items:", error);
    }
  }

  // Share Content with the Group
  async function shareContent(contentUrl) {
    try {
      const response = await fetch(`${apiUrl}/groups/share`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-Token": "secure-csrf-token",
        },
        body: JSON.stringify({ groupId: userGroup._id, url: contentUrl }),
      });
      const data = await response.json();
      if (data.success) {
        // Add the newly shared item to the UI directly
        addSharedItemToUI(data.item); // Assume the backend returns the new item in `data.item`
      } else {
        alert(data.message || "Failed to share the URL.");
      }
    } catch (error) {
      console.error("Error sharing content:", error);
      alert("An error occurred while sharing the content.");
    }
  }

  // Event: Create Group
  createGroupBtn.addEventListener("click", async function () {
    if (userGroup) return alert("You are already part of a group.");

    const groupName = sanitizeInput(document.getElementById("new-group-name").value.trim());

    console.log("groupname",groupName);
    
    if (!groupName) {
      return alert("Group name cannot be empty.");
    }

    if (groupName.length <= 50) {
      try {
        const response = await fetch(`${apiUrl}/groups/create`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-CSRF-Token": "secure-csrf-token",
          },
          body: JSON.stringify({ name: groupName }),
        });
        const data = await response.json();
        console.log("new group",data);
        
        if (data.success) {
          userGroup = data.group;
          chrome.storage.local.set({ userGroup });
          updateGroupList();
          loadGroupItems(userGroup._id);
          alert(`Group created! Your group code: ${userGroup.code}`);
        }
      } catch (error) {
        console.error("Error creating group:", error);
      }
    } else {
      alert("Group name must be 50 characters or less.");
    }
  });

  // Event: Join Group
  joinGroupBtn.addEventListener("click", async function () {
    if (userGroup) return alert("You are already part of a group.");

    const groupCode = sanitizeInput(document.getElementById("group-code").value.trim());

    if (!groupCode) {
      return alert("Group code cannot be empty.");
    }

    if (groupCode.length === 8) {
      try {
        const response = await fetch(`${apiUrl}/groups/join`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-CSRF-Token": "secure-csrf-token",
          },
          body: JSON.stringify({ code: groupCode }),
        });
        const data = await response.json();
        if (data.success) {
          userGroup = data.group;
          chrome.storage.local.set({ userGroup });
          updateGroupList();
          loadGroupItems(userGroup._id);
        }
      } catch (error) {
        console.error("Error joining group:", error);
      }
    } else {
      alert("Group code must be 8 characters long.");
    }
  });

  // Event: Share Content
  shareContentBtn.addEventListener("click", async function () {
    if (!userGroup) return alert("Join or create a group first.");

    chrome.tabs.query({ active: true, currentWindow: true }, async function (tabs) {
      const contentUrl = sanitizeInput(tabs[0].url);
      await shareContent(contentUrl);
    });
  });

  // Event: Leave Group
  groupList.addEventListener("click", function (event) {
    if (event.target.classList.contains("leave-group-btn")) {
      userGroup = null;
      chrome.storage.local.remove("userGroup");
      updateGroupList();
      sharedItemsList.innerHTML = "";
      alert("You have left the group.");
    }
  });

  // Tab switching logic
  document.querySelectorAll(".tab-link").forEach((tabLink) => {
    tabLink.addEventListener("click", function () {
      document.querySelectorAll(".tab-link").forEach((link) => link.classList.remove("active"));
      document.querySelectorAll(".tab-content").forEach((content) => content.classList.remove("active"));
      this.classList.add("active");
      const tabName = this.querySelector(".tab-name").getAttribute("data-tab");
      document.getElementById(tabName).classList.add("active");
    });
  });

  // Initial setup: Check if the user is already in a group
  chrome.storage.local.get(["userGroup"], function (result) {
    if (result.userGroup) {
      userGroup = result.userGroup;
      updateGroupList();
      loadGroupItems(userGroup._id);
    }
  });
});
