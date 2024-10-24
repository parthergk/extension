import express from "express";
import mongoose from "mongoose";
import bodyParser from "body-parser";
import { nanoid } from "nanoid";
import cors from "cors";
import dotenv from "dotenv";
import helmet from "helmet";  // Add helmet for basic security headers
import rateLimit from "express-rate-limit";  // Add rate-limiting to prevent abuse

dotenv.config();

const app = express();

// Configuration
const config = {
  PORT: process.env.PORT || 3000,
  MONGODB_URL: process.env.MONGODB_URL,
};

// Middleware
app.use(cors());  // Cross-Origin Resource Sharing
app.use(helmet());  // Helmet helps secure the app by setting various HTTP headers
app.use(bodyParser.json());

// Rate Limiting: Limit repeated requests to public APIs
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutes
  max: 100,  // Limit each IP to 100 requests per window
  message: "Too many requests, please try again later.",
});
app.use(limiter);

// MongoDB Connection
let isConnected = false;
const connectToDb = async () => {
  if (isConnected) return;

  try {
    await mongoose.connect(config.MONGODB_URL, {
      dbName: "group",
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    isConnected = true;
    console.log("Database connected");
  } catch (error) {
    console.error("MongoDB connection error:", error);
    process.exit(1);  // Exit the process if the connection fails
  }
};
connectToDb();

const groupSchema = new mongoose.Schema({
  name: { type: String, required: true },
  code: { type: String, required: true, unique: true },
  sharedItems: [
    {
      url: { type: String, required: true, unique: true }, // This won't work directly in arrays
      sharedAt: { type: Date, default: Date.now },
    },
  ],
});


const Group = mongoose.model("Group", groupSchema);

app.post("/groups/create", async (req, res) => {
  let { name } = req.body;
  if (!name) {
    return res.status(400).json({ success: false, message: "Group name is required" });
  }

  // Capitalize the first letter of the group name
  name = name.charAt(0).toUpperCase() + name.slice(1);

  const newGroup = new Group({ name, code: nanoid(8) });
  await newGroup.save();

  res.json({ success: true, group: newGroup });
});


// Join Group
app.post("/groups/join", async (req, res) => {
  const { code } = req.body;
  const group = await Group.findOne({ code });
  if (!group) return res.status(404).json({ success: false, message: "Group not found" });

  res.json({ success: true, group });
});

// Share Content
app.post("/groups/share", async (req, res) => {
  const { groupId, url } = req.body;
  
  const group = await Group.findById(groupId);
  if (!group) {
    return res.status(404).json({ success: false, message: "Group not found" });
  }

  // Check if the URL already exists
  const urlExists = group.sharedItems.some(item => item.url === url);
  if (urlExists) {
    return res.status(400).json({ success: false, message: "This URL has already been shared." });
  }


  group.sharedItems.push({ url });
  await group.save();
  
  res.json({ success: true, item: { url } });
});



// Get Shared Items
app.get("/groups/:groupId/items", async (req, res) => {
  const { groupId } = req.params;
  const group = await Group.findById(groupId);
  if (!group) return res.status(404).json({ success: false, message: "Group not found" });

  res.json({ success: true, items: group.sharedItems });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, message: "Something went wrong" });
});

// Start Server
app.listen(config.PORT, () => {
  console.log(`Server running on port ${config.PORT}`);
});
