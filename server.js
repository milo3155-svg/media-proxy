const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
  res.send('Servidor Media Proxy MP3 Activo 🚀');
});

app.get('/api/search', async (req, res) => {
  const query = req.query.q;
  if (!query) return res.status(400).json({ error: 'Falta la consulta' });

  try {
    // API de búsqueda con transmisiones MP3 nativas y directas
    const response = await axios.get(`https://discoveryprovider.audius.co/v1/tracks/search?query=${encodeURIComponent(query)}&app_name=MediaApp`, { timeout: 8000 });

    if (response.data && response.data.data && response.data.data.length > 0) {
      const results = response.data.data.slice(0, 15).map(track => ({
        id: track.id || '',
        title: track.title || 'Sin título',
        author: track.user ? track.user.name : 'Artista',
        thumbnailUrl: track.artwork ? track.artwork['150x150'] : '',
        // Flujo directo MP3 que just_audio reproduce de forma instantánea
        streamUrl: `https://discoveryprovider.audius.co/v1/tracks/${track.id}/stream?app_name=MediaApp`
      }));

      return res.json(results);
    }
  } catch (e) {
    console.log('Error en búsqueda principal:', e.message);
  }

  // Respaldo secundario si no hay coincidencias
  try {
    const backupRes = await axios.get(`https://itunes.apple.com/search?term=${encodeURIComponent(query)}&entity=song&limit=15`, { timeout: 6000 });
    if (backupRes.data && backupRes.data.results) {
      const results = backupRes.data.results.map(item => ({
        id: item.trackId ? item.trackId.toString() : '',
        title: item.trackName || 'Sin título',
        author: item.artistName || 'Artista',
        thumbnailUrl: item.artworkUrl100 || '',
        streamUrl: item.previewUrl || ''
      }));
      return res.json(results);
    }
  } catch (e) {
    console.log('Error en respaldo:', e.message);
  }

  res.json([]);
});

app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});
