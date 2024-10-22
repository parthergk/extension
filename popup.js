document.addEventListener('DOMContentLoaded', function () {
    const createGroupBtn = document.getElementById('create-group-btn');
    const joinGroupBtn = document.getElementById('join-group-btn');
    const shareContentBtn = document.getElementById('share-content-btn');
    const groupList = document.querySelector('.group-list');
    const sharedItemsList = document.querySelector('.shared-items-list');

    let userGroup = null;
    const apiUrl = 'http://localhost:3000';  // Use HTTPS for secure communication

    // Check if user already has a group stored
    chrome.storage.local.get(['userGroup'], function (result) {
        if (result.userGroup) {
            userGroup = result.userGroup;
            updateGroupList();
            loadGroupItems(userGroup._id);
        }
    });

    // Input sanitization function
    function sanitizeInput(input) {
        const element = document.createElement('div');
        element.innerText = input;
        return element.innerHTML;
    }

    // Create Group
    createGroupBtn.addEventListener('click', async function () {
        if (userGroup) return alert('You are already part of a group.');

        const groupName = sanitizeInput(document.getElementById('new-group-name').value);
        if (groupName && groupName.length <= 50) {
            try {
                const response = await fetch(`${apiUrl}/groups/create`, {
                    method: 'POST',
                    headers: { 
                        'Content-Type': 'application/json',
                        'X-CSRF-Token': 'secure-csrf-token'  // Add CSRF token for protection
                    },
                    body: JSON.stringify({ name: groupName })
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
                console.error('Error creating group:', error);
            }
        }
    });

    // Join Group
    joinGroupBtn.addEventListener('click', async function () {
        if (userGroup) return alert('You are already part of a group.');

        const groupCode = sanitizeInput(document.getElementById('group-code').value);
        if (groupCode && groupCode.length === 8) {
            try {
                const response = await fetch(`${apiUrl}/groups/join`, {
                    method: 'POST',
                    headers: { 
                        'Content-Type': 'application/json',
                        'X-CSRF-Token': 'secure-csrf-token'
                    },
                    body: JSON.stringify({ code: groupCode })
                });
                const data = await response.json();
                if (data.success) {
                    userGroup = data.group;
                    chrome.storage.local.set({ userGroup });
                    updateGroupList();
                    loadGroupItems(userGroup._id);
                }
            } catch (error) {
                console.error('Error joining group:', error);
            }
        }
    });

    // Share Content
shareContentBtn.addEventListener('click', async function () {
    if (!userGroup) return alert('Join or create a group first.');

    chrome.tabs.query({ active: true, currentWindow: true }, async function (tabs) {
        const contentUrl = sanitizeInput(tabs[0].url);
        try {
            const response = await fetch(`${apiUrl}/groups/share`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'X-CSRF-Token': 'secure-csrf-token'
                },
                body: JSON.stringify({ groupId: userGroup._id, url: contentUrl })
            });
            const data = await response.json();
            if (data.success) {
                // URL shared successfully
                sharedItemsList.innerHTML += `<div>Shared: <a href="${contentUrl}" target="_blank" rel="noopener noreferrer">${contentUrl}</a></div>`;
                loadGroupItems(userGroup._id);
            } else {
                // URL already exists
                alert(data.message || 'Failed to share the URL.'); // Show existing URL message or fallback error
            }
        } catch (error) {
            console.error('Error sharing content:', error);
            alert('An error occurred while sharing the content.'); // General error message
        }
    });
});


    // Update Group List
    function updateGroupList() {
        groupList.innerHTML = userGroup ? `
            <div class="group-item" id="${userGroup._id}">
                <span>${sanitizeInput(userGroup.name)}</span>
                <button class="leave-group-btn" data-group-id="${userGroup._id}">Leave</button>
            </div>` : 'You are not part of any group.';
    }

    // Load Group Items
    async function loadGroupItems(groupId) {
        try {
            const response = await fetch(`${apiUrl}/groups/${groupId}/items`);
            const data = await response.json();
            if (data.success) {
                sharedItemsList.innerHTML = data.items.map(item => `
                    <div class="shared-item">
                        <a href="${sanitizeInput(item.url)}" target="_blank" rel="noopener noreferrer">${sanitizeInput(item.url)}</a>
                    </div>`).join('');
            }
        } catch (error) {
            console.error('Error loading group items:', error);
        }
    }

    // Leave Group
    groupList.addEventListener('click', function (event) {
        if (event.target.classList.contains('leave-group-btn')) {
            userGroup = null;
            chrome.storage.local.remove('userGroup');
            updateGroupList();
            sharedItemsList.innerHTML = '';
            alert('You have left the group.');
        }
    });
});