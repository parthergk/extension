document.addEventListener("DOMContentLoaded", function () {
  const groupNameInput = document.getElementById("group-name");
  const groupCodeInput = document.getElementById("group-code");
  const groupList = document.getElementById("group-list");
  const createGroupBtn = document.getElementById("create-group-btn");
  const joinGroupBtn = document.getElementById("join-group-btn");
  const shareContentBtn = document.getElementById("share-content-btn");

  // Load existing groups from localStorage
  let groups = JSON.parse(localStorage.getItem("groups")) || [];

  // Function to display groups
  function displayGroups() {
    groupList.innerHTML = "";
    groups.forEach((group) => {
      const li = document.createElement("li");
      li.textContent = group.name;
      groupList.appendChild(li);
    });
  }

  displayGroups();

  // Create Group
  createGroupBtn.addEventListener("click", function () {
    const groupName = groupNameInput.value.trim();
    if (groupName) {
      const newGroup = {
        name: groupName,
        code: Math.random().toString(36).substr(2, 5),
      };
      groups.push(newGroup);
      localStorage.setItem("groups", JSON.stringify(groups));
      displayGroups();
      groupNameInput.value = "";
      alert("Group created! Code: " + newGroup.code);
    }
  });

  // Join Group
  joinGroupBtn.addEventListener("click", function () {
    const groupCode = groupCodeInput.value.trim();
    const group = groups.find((g) => g.code === groupCode);
    if (group) {
      alert("Joined group: " + group.name);
    } else {
      alert("Group not found!");
    }
  });

  // Share Content
  // Share Content button click handler
  shareContentBtn.addEventListener("click", function () {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      const currentTab = tabs[0];
      const contentUrl = currentTab.url;

      // Send message to background.js
      chrome.runtime.sendMessage(
        { type: "shareContent", contentUrl: contentUrl },
        function (response) {
          console.log(response.status);
        }
      );

      alert("Content shared: " + contentUrl);
    });
  });

//   shareContentBtn.addEventListener("click", function () {
//     chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
//       const currentTab = tabs[0];
//       alert("Content shared: " + currentTab.url);
//       // Here you would add the shared content to a group
//     });
//   });
});
