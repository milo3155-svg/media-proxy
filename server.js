const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
  res.send('Servidor Media Proxy MP3 Directo Activo 🚀');
});

app.get('/api/search', async (req, res) => {
  const query = req.query.q;
  if (!query) return res.status(400).json({ error: 'Falta la consulta' });

  // Fuente 1: Jamendo API (Servidor de MP3 directos y limpios)
  try {
    const jamendoRes = await axios.get(`https://api.jamendo.com/v3.0/tracks/?client_id=56d3042f&format=json&limit=15&search=${encodeURIComponent(query)}`, { timeout: 6000 });
    
    if (jamendoRes.data && jamendoRes.data.results && jamendoRes.data.results.length > 0) {
      const results = jamendoRes.data.results.map(track => ({
        id: track.id || '',
        title: track.name || 'Sin título',
        author: track.artist_name || 'Artista',
        thumbnailUrl: track.album_image || track.image || '',
        // Audio MP3 directo
        streamUrl: track.audio || ''
      }));

      return res.json(results);
    }
  } catch (e) {
    console.log('Error en Fuente 1 (Jamendo):', e.message);
  }

  // Fuente 2: Audius Provider (Respaldo secundario MP3)
  try {
    const audiusRes = await axios.get(`https://discoveryprovider.audius.co/v1/tracks/search?query=${encodeURIComponent(query)}&app_name=MediaApp`, { timeout: 6000 });

    if (audiusRes.data && audiusRes.data.data && audiusRes.data.data.length > 0) {
      const results = audiusRes.data.data.slice(0, 15).map(track => ({
        id: track.id || '',
        title: track.title || 'Sin título',
        author: track.user ? track.user.name : 'Artista',
        thumbnailUrl: track.artwork ? track.artwork['150x150'] : '',
        streamUrl: `https://discoveryprovider.audius.co/v1/tracks/${track.id}/stream?app_name=MediaApp`
      }));

      return res.json(results);
    }
  } catch (e) {
    console.log('Error en Fuente 2 (Audius):', e.message);
  }

  res.json([]);
});

app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});
