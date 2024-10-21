document.addEventListener('DOMContentLoaded', function () {
    const createGroupBtn = document.getElementById('create-group-btn');
    const joinGroupBtn = document.getElementById('join-group-btn');
    const shareContentBtn = document.getElementById('share-content-btn');
    const groupList = document.querySelector('.group-list');
    const sharedItemsList = document.querySelector('.shared-items-list');

    let userId = "sk";  // Replace with actual user identification (e.g., user email or ID)
    let userGroup = null;   // Store the single group the user is part of

    // API Base URL
    const apiUrl = 'http://localhost:3000';

    // Create Group
    createGroupBtn.addEventListener('click', function () {
        if (userGroup) {
            alert('You are already part of a group. You can only be in one group.');
            return;
        }

        const groupName = document.getElementById('new-group-name').value;
        if (groupName) {
            fetch(`${apiUrl}/groups/create`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ name: groupName, userId: userId })
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    userGroup = data.group;
                    updateGroupList();
                    loadGroupItems(userGroup._id); // Automatically load the newly created group content
                }
            });
        }
    });

    // Join Group
    joinGroupBtn.addEventListener('click', function () {
        if (userGroup) {
            alert('You are already part of a group. You can only be in one group.');
            return;
        }

        const groupCode = document.getElementById('group-code').value;
        if (groupCode) {
            fetch(`${apiUrl}/groups/join`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ code: groupCode, userId: userId })
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    userGroup = data.group;
                    updateGroupList();
                    loadGroupItems(userGroup._id); // Automatically load the joined group content
                }
            });
        }
    });

    // Share Content
    shareContentBtn.addEventListener('click', function () {
        if (!userGroup) {
            alert('You must join or create a group before sharing content.');
            return;
        }

        chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
            const currentTab = tabs[0];
            const contentUrl = currentTab.url;

            fetch(`${apiUrl}/groups/share`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ groupId: userGroup._id, url: contentUrl, userId: userId })
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    sharedItemsList.innerHTML += `<div>Shared with ${userGroup.name}: <a href="${contentUrl}" target="_blank">${contentUrl}</a></div>`;
                    loadGroupItems(userGroup._id); // Reload group items to show newly shared content
                }
            });
        });
    });

    function updateGroupList() {
        if (userGroup) {
            groupList.innerHTML = `
                <div class="group-item" id="${userGroup._id}">
                    <span>${userGroup.name}</span>
                    <button class="leave-group-btn" data-group-id="${userGroup._id}">Leave</button>
                </div>
            `;
        } else {
            groupList.innerHTML = 'You are not part of any group.';
        }
    }

    // Load items for a specific group
    function loadGroupItems(groupId) {
        fetch(`${apiUrl}/groups/${groupId}/items`)
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    const groupItems = data.items.map(item => `
                        <div class="shared-item">
                            <a href="${item.url}" target="_blank">${item.url}</a>
                        </div>
                    `).join('');
                    sharedItemsList.innerHTML = groupItems;
                }
            });
    }

    // Leaving a group functionality
    groupList.addEventListener('click', function (event) {
        if (event.target.classList.contains('leave-group-btn')) {
            const groupId = event.target.getAttribute('data-group-id');
            fetch(`${apiUrl}/groups/leave`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ groupId: groupId, userId: userId })
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    userGroup = null;
                    updateGroupList();
                    sharedItemsList.innerHTML = ''; // Clear shared items when leaving the group
                }
            });
        }
    });
});
