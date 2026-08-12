const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
app.use(cors());

const PORT = process.env.PORT || 3000;

// API Key oficial y pública de Jamendo para desarrolladores
const CLIENT_ID = '56d3042f';

// 1. BÚSQUEDA DE MÚSICA
app.get('/api/search', async (req, res) => {
  const query = req.query.q;
  if (!query) return res.status(400).json({ error: 'Falta la consulta' });

  try {
    const url = `https://api.jamendo.com/v3.0/tracks/?client_id=${CLIENT_ID}&format=json&limit=15&search=${encodeURIComponent(query)}&include=musicinfo`;
    const response = await axios.get(url, { timeout: 6000 });

    if (response.data && response.data.results) {
      const results = response.data.results.map(track => ({
        id: track.id,
        title: track.name || 'Sin título',
        author: track.artist_name || 'Artista',
        thumbnailUrl: track.album_image || track.image || '',
        // Apuntamos al endpoint interno de transmisión directa en Render
        streamUrl: `https://mi-media-proxy.onrender.com/api/stream?url=${encodeURIComponent(track.audio)}`
      }));

      return res.json(results);
    }
  } catch (error) {
    console.error("Error en búsqueda Jamendo:", error.message);
  }

  res.json([]);
});

// 2. TRANSMISIÓN DE AUDIO DIRECTA (FLUIDA Y RÁPIDA)
app.get('/api/stream', async (req, res) => {
  const audioUrl = req.query.url;
  if (!audioUrl) return res.status(400).send('Falta la URL de audio');

  try {
    const audioResponse = await axios({
      method: 'get',
      url: audioUrl,
      responseType: 'stream',
      timeout: 10000
    });

    res.setHeader('Content-Type', 'audio/mpeg');
    audioResponse.data.pipe(res);
  } catch (error) {
    console.error("Error transmitiendo audio:", error.message);
    res.status(500).send('Error en transmisión de audio');
  }
});

app.listen(PORT, () => console.log('Proxy Jamendo Stream activo'));
