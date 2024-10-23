document.addEventListener("DOMContentLoaded", function () {
  const createGroupBtn = document.getElementById("create-group-btn");
  const joinGroupBtn = document.getElementById("join-group-btn");
  const shareContentBtn = document.getElementById("share-content-btn");
  const groupList = document.querySelector(".group-list");
  const sharedItemsList = document.querySelector(".shared-items-list");

  let userGroup = null;
  const apiUrl = "https://share-url.onrender.com"; // Use HTTPS for secure communication

  // Check if user already has a group stored
  chrome.storage.local.get(["userGroup"], function (result) {
    if (result.userGroup) {
      userGroup = result.userGroup;
      updateGroupList();
      loadGroupItems(userGroup._id);
    }
  });

  // Input sanitization function
  function sanitizeInput(input) {
    const element = document.createElement("div");
    element.innerText = input;
    return element.innerHTML;
  }

  // Create Group
  createGroupBtn.addEventListener("click", async function () {
    if (userGroup) return alert("You are already part of a group.");

    const groupName = sanitizeInput(
      document.getElementById("new-group-name").value.trim()
    );

    // Check if groupName is empty
    if (!groupName) {
      return alert("Group name cannot be empty.");
    }

    if (groupName.length <= 50) {
      try {
        const response = await fetch(`${apiUrl}/groups/create`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-CSRF-Token": "secure-csrf-token", // Add CSRF token for protection
          },
          body: JSON.stringify({ name: groupName }),
        });
        const data = await response.json();
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

  // Join Group
  joinGroupBtn.addEventListener("click", async function () {
    if (userGroup) return alert("You are already part of a group.");

    const groupCode = sanitizeInput(
      document.getElementById("group-code").value.trim()
    );

    // Check if groupCode is empty
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

  // Share Content
  shareContentBtn.addEventListener("click", async function () {
    if (!userGroup) return alert("Join or create a group first.");

    chrome.tabs.query(
      { active: true, currentWindow: true },
      async function (tabs) {
        const contentUrl = sanitizeInput(tabs[0].url);
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
            // URL shared successfully
            sharedItemsList.innerHTML += `<div>Shared: <a href="${contentUrl}" target="_blank" rel="noopener noreferrer">${contentUrl}</a></div>`;
            loadGroupItems(userGroup._id);
          } else {
            // URL already exists
            alert(data.message || "Failed to share the URL."); // Show existing URL message or fallback error
          }
        } catch (error) {
          console.error("Error sharing content:", error);
          alert("An error occurred while sharing the content."); // General error message
        }
      }
    );
  });

  // Update Group List
  function updateGroupList() {
    const groupInfo = document.getElementById("group-info");
    groupInfo.innerHTML = userGroup
      ? `
        <div class="group-item" id="${userGroup._id}">
            <span>${sanitizeInput(userGroup.name)}</span>
            <span> (Code: ${sanitizeInput(
              userGroup.code
            )})</span> <!-- Displaying the group code -->
            <button class="leave-group-btn share-button" data-group-id="${
              userGroup._id
            }">Leave</button>
        </div>`
      : "You are not part of any group.";
  }

  // Load Group Items
  async function loadGroupItems(groupId) {
    try {
      const response = await fetch(`${apiUrl}/groups/${groupId}/items`);
      const data = await response.json();
      if (data.success) {
        sharedItemsList.innerHTML = data.items
          .map(
            (item) => `
                    <div class="shared-item">
                        <a href="${sanitizeInput(
                          item.url
                        )}" target="_blank" rel="noopener noreferrer">${sanitizeInput(
              item.url
            )}</a>
                    </div>`
          )
          .join("");
      }
    } catch (error) {
      console.error("Error loading group items:", error);
    }
  }

  // Leave Group
  groupList.addEventListener("click", function (event) {
    if (event.target.classList.contains("leave-group-btn")) {
      userGroup = null;
      chrome.storage.local.remove("userGroup");
      updateGroupList();
      sharedItemsList.innerHTML = "";
      alert("You have left the group.");
    }
  });

  document.querySelectorAll(".tab-link").forEach((tabLink) => {
    tabLink.addEventListener("click", function () {
        // Remove 'active' class from all tab links and contents
        document.querySelectorAll(".tab-link").forEach((link) => link.classList.remove("active"));
        document.querySelectorAll(".tab-content").forEach((content) => content.classList.remove("active"));

        // Add 'active' class to the clicked tab and its corresponding content
        this.classList.add("active");
        const tabName = this.querySelector(".tab-name").getAttribute("data-tab");
        document.getElementById(tabName).classList.add("active");
    });
});

});
