const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
app.use(cors());

const PORT = process.env.PORT || 3000;

// Lista de servidores espejo de Piped para respaldo automático
const PIPED_INSTANCES = [
  'https://pipedapi.kavin.rocks',
  'https://api.piped.private.coffee',
  'https://pipedapi.mha.fi'
];

app.get('/api/search', async (req, res) => {
  const query = req.query.q;
  if (!query) return res.status(400).json({ error: 'Falta la consulta' });

  for (const instance of PIPED_INSTANCES) {
    try {
      const response = await axios.get(`${instance}/search?q=${encodeURIComponent(query)}&filter=music_songs`, { timeout: 4000 });
      
      if (response.data && response.data.items && response.data.items.length > 0) {
        const results = response.data.items.slice(0, 15).map(item => {
          // Extraer la URL del ID del video
          const videoId = item.url ? item.url.replace('/watch?v=', '') : '';
          return {
            id: videoId,
            title: item.title || 'Sin título',
            author: item.uploaderName || 'Artista',
            thumbnailUrl: item.thumbnail || '',
            // Pasamos el ID al endpoint de reproducción
            streamUrl: `https://mi-media-proxy.onrender.com/api/stream?id=${videoId}`
          };
        });

        return res.json(results);
      }
    } catch (e) {
      console.log(`Fallo en instancia ${instance}, intentando siguiente...`);
    }
  }

  res.json([]);
});

app.get('/api/stream', async (req, res) => {
  const videoId = req.query.id;
  if (!videoId) return res.status(400).send('Falta el ID');

  for (const instance of PIPED_INSTANCES) {
    try {
      const response = await axios.get(`${instance}/streams/${videoId}`, { timeout: 4000 });
      
      if (response.data && response.data.audioStreams && response.data.audioStreams.length > 0) {
        // Seleccionamos la primera fuente directa de audio disponible
        const audioUrl = response.data.audioStreams[0].url;
        return res.redirect(audioUrl);
      }
    } catch (e) {
      console.log(`Fallo stream en ${instance}...`);
    }
  }

  res.status(500).send('No se pudo obtener el audio');
});

app.listen(PORT, () => console.log('Proxy de música Piped activo'));
