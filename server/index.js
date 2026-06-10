require('dotenv').config();

const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const { ensureSeedData } = require('./utils/resolveRefs');

const aiRoutes = require('./routes/aiRoutes');
const postRoutes = require('./routes/postRoutes');
const storyRoutes = require('./routes/storyRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

app.get('/', (req, res) => {
  res.json({ message: 'API AI Community Manager 🚀', version: '1.0.0' });
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', mongodb: true });
});

app.use('/api/ai', aiRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/stories', storyRoutes);

async function start() {
  try {
    await connectDB();
    await ensureSeedData();

    app.listen(PORT, () => {
      console.log(`Serveur démarré sur http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Impossible de démarrer le serveur:', error.message);
    process.exit(1);
  }
}

start();
