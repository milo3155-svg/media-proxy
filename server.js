const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;

app.get('/', async (req, res) => {
  const query = req.query.q || 'bad bunny';
  const results = await searchWithFallback(query);
  res.json(results);
});

app.get('/api/search', async (req, res) => {
  const query = req.query.q || 'bad bunny';
  const results = await searchWithFallback(query);
  res.json(results);
});

async function searchWithFallback(query) {
  // Fuente 1: Deezer Public API
  try {
    const response = await axios.get(`https://api.deezer.com/search?q=${encodeURIComponent(query)}`, { timeout: 6000 });
    if (response.data && response.data.data && response.data.data.length > 0) {
      return response.data.data.map(item => ({
        id: item.id ? item.id.toString() : '',
        title: item.title || 'Sin título',
        author: item.artist ? item.artist.name : 'Artista',
        thumbnailUrl: item.album ? item.album.cover_medium : '',
        streamUrl: item.preview || ''
      }));
    }
  } catch (e) {
    console.log('Fallo en Fuente 1 (Deezer):', e.message);
  }

  // Fuente 2: Respaldo iTunes
  try {
    const response = await axios.get(`https://itunes.apple.com/search?term=${encodeURIComponent(query)}&entity=song&limit=20`, { timeout: 6000 });
    if (response.data && response.data.results) {
      return response.data.results.map(item => ({
        id: item.trackId ? item.trackId.toString() : '',
        title: item.trackName || 'Sin título',
        author: item.artistName || 'Artista',
        thumbnailUrl: item.artworkUrl100 ? item.artworkUrl100.replace('100x100bb', '300x300bb') : '',
        streamUrl: item.previewUrl || ''
      }));
    }
  } catch (e) {
    console.log('Fallo en Fuente 2 (iTunes):', e.message);
  }

  return [];
}

app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});
