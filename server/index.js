const express = require("express");
const cors = require("cors");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

const instagramRoutes = require('./routes/instagramRoutes');
const tiktokRoutes = require('./routes/tiktokRoutes');

// Test route
app.get("/", (req, res) => {
  res.send("API is working 🚀");
});

// Example route
app.get("/posts", (req, res) => {
  res.json([
    { id: 1, title: "Instagram Post" },
    { id: 2, title: "TikTok Video" }
  ]);
});

app.use('/api/instagram', instagramRoutes);
app.use('/api/tiktok', tiktokRoutes);

const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});