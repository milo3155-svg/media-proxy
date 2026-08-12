const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
app.use(cors());

const PORT = process.env.PORT || 3000;

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
          const videoId = item.url ? item.url.replace('/watch?v=', '') : '';
          return {
            id: videoId,
            title: item.title || 'Sin título',
            author: item.uploaderName || 'Artista',
            thumbnailUrl: item.thumbnail || '',
            streamUrl: `https://mi-media-proxy.onrender.com/api/stream?id=${videoId}`
          };
        });

        return res.json(results);
      }
    } catch (e) {
      console.log(`Error buscando en ${instance}`);
    }
  }

  res.json([]);
});

// TRANSMISIÓN DIRECTA (SIN REDIRECCIÓN)
app.get('/api/stream', async (req, res) => {
  const videoId = req.query.id;
  if (!videoId) return res.status(400).send('Falta el ID');

  for (const instance of PIPED_INSTANCES) {
    try {
      const response = await axios.get(`${instance}/streams/${videoId}`, { timeout: 4000 });
      
      if (response.data && response.data.audioStreams && response.data.audioStreams.length > 0) {
        const audioUrl = response.data.audioStreams[0].url;
        
        // Render solicita el audio y lo canaliza directo a la app
        const audioStream = await axios({
          method: 'get',
          url: audioUrl,
          responseType: 'stream'
        });

        res.setHeader('Content-Type', 'audio/mpeg');
        return audioStream.data.pipe(res);
      }
    } catch (e) {
      console.log(`Error obteniendo stream en ${instance}`);
    }
  }

  res.status(500).send('No se pudo obtener el audio');
});

app.listen(PORT, () => console.log('Proxy de audio directo activo'));
