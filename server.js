const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
app.use(cors());

const PORT = process.env.PORT || 3000;

const CLIENT_ID = '56d3042f';

app.get('/api/search', async (req, res) => {
  const query = req.query.q;
  if (!query) return res.json([]);

  try {
    const url = `https://api.jamendo.com/v3.0/tracks/?client_id=${CLIENT_ID}&format=json&limit=15&search=${encodeURIComponent(query)}&include=musicinfo`;
    const response = await axios.get(url, { timeout: 8000 });

    if (response.data && response.data.results && response.data.results.length > 0) {
      const results = response.data.results.map(track => ({
        id: String(track.id),
        title: track.name || 'Sin título',
        author: track.artist_name || 'Artista',
        thumbnailUrl: track.album_image || track.image || '',
        streamUrl: track.audio
      }));

      return res.json(results);
    }
  } catch (error) {
    console.error("Error en búsqueda:", error.message);
  }

  // Fallback de seguridad en caso de timeout
  res.json([
    {
      id: 'demo1',
      title: 'Demo Track 1 (Electro)',
      author: 'Jamendo Free',
      thumbnailUrl: 'https://images.jamendo.com/albums/s10/10005/covers/1.100.jpg',
      streamUrl: 'https://prod-1.storage.jamendo.com/c/s/p10005/10005_1.mp3'
    }
  ]);
});

app.listen(PORT, () => console.log('Proxy de música listo y optimizado'));
