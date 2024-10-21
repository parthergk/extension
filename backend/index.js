const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors'); // Add this line to import cors

const app = express();
const port = 3000;

// Use CORS middleware
app.use(cors());

app.use(bodyParser.json());

mongoose.connect('mongodb+srv://gauravKumar:gaurav123@cluster0.swj1o.mongodb.net/?retryWrites=true&w=majority',
    { dbName: "group", useNewUrlParser: true, useUnifiedTopology: true }
  )

// Define Group Schema
const groupSchema = new mongoose.Schema({
    name: String,
    code: String,
    members: [String],  // List of member IDs or emails
    sharedItems: [
        {
            url: String,
            sharedBy: String,
            sharedAt: { type: Date, default: Date.now }
        }
    ]
});

const Group = mongoose.model('Group', groupSchema);

// API to create a group
app.post('/groups/create', async (req, res) => {
    const { name, userId } = req.body;

    const newGroup = new Group({
        name: name,
        code: Date.now().toString(),  // Generate a unique group code
        members: [userId]
    });

    await newGroup.save();
    console.log("gruop is created", name);
    
    res.json({ success: true, group: newGroup });
});

// API to join a group
app.post('/groups/join', async (req, res) => {
    const { code, userId } = req.body;

    const group = await Group.findOne({ code });
    if (!group) return res.status(404).json({ success: false, message: "Group not found" });

    if (!group.members.includes(userId)) {
        group.members.push(userId);
        await group.save();
    }

    console.log("Join this group");
    
    res.json({ success: true, group });
});

// API to share content with a group
app.post('/groups/share', async (req, res) => {
    const { groupId, url, userId } = req.body;

    const group = await Group.findById(groupId);
    if (!group) return res.status(404).json({ success: false, message: "Group not found" });

    group.sharedItems.push({ url, sharedBy: userId });
    await group.save();

    console.log("Shared content",url);
    

    res.json({ success: true, group });
});

// API to get group details and shared content
app.get('/groups/:groupId', async (req, res) => {
    const { groupId } = req.params;

    const group = await Group.findById(groupId);
    if (!group) return res.status(404).json({ success: false, message: "Group not found" });

    res.json({ success: true, group });
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});

// API to get shared items for a specific group
app.get('/groups/:groupId/items', async (req, res) => {
    const { groupId } = req.params;

    const group = await Group.findById(groupId);
    if (!group) return res.status(404).json({ success: false, message: "Group not found" });

    res.json({ success: true, items: group.sharedItems }); // Return sharedItems for the group
});

