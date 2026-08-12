const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
app.use(cors());

const PORT = process.env.PORT || 3000;

// Lista de hosts oficiales de la red Audius
const AUDIUS_HOSTS = [
  'https://discoveryprovider.audius.co',
  'https://audius-dp.cultex.net',
  'https://creatornode2.audius.co'
];

async function getAudiusHost() {
  try {
    const response = await axios.get('https://api.audius.co', { timeout: 3000 });
    if (response.data && response.data.data && response.data.data.length > 0) {
      return response.data.data[0];
    }
  } catch (e) {
    console.log("Usando host Audius de respaldo...");
  }
  return AUDIUS_HOSTS[0];
}

app.get('/api/search', async (req, res) => {
  const query = req.query.q;
  if (!query) return res.status(400).json({ error: 'Falta la consulta' });

  try {
    const host = await getAudiusHost();
    const response = await axios.get(`${host}/v1/tracks/search?query=${encodeURIComponent(query)}&app_name=MediaApp`, { timeout: 5000 });

    if (response.data && response.data.data) {
      const results = response.data.data.map(track => {
        // Enlace directo al stream de audio en MP3 de alta velocidad
        const streamUrl = `${host}/v1/tracks/${track.id}/stream?app_name=MediaApp`;
        const artwork = track.artwork ? track.artwork['150x150'] || track.artwork['480x480'] : '';

        return {
          id: track.id,
          title: track.title || 'Sin título',
          author: track.user?.name || 'Artista',
          thumbnailUrl: artwork,
          streamUrl: streamUrl
        };
      });

      return res.json(results);
    }
  } catch (error) {
    console.error("Error en búsqueda Audius:", error.message);
  }

  res.json([]);
});

app.listen(PORT, () => console.log('Proxy Audius listo y activo'));
