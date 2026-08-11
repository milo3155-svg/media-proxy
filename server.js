const express = require('express');
const cors = require('cors');
const axios = require('axios');
const { exec } = require('youtube-dl-exec');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
  res.send('Servidor Media Proxy con Extractor Activo 🚀');
});

app.get('/api/search', async (req, res) => {
  const query = req.query.q;
  if (!query) return res.status(400).json({ error: 'Falta la consulta' });

  try {
    const searchRes = await axios.get(`https://api.vante.dev/api/v1/search?q=${encodeURIComponent(query)}&type=video`, { timeout: 8000 });
    
    if (searchRes.data && searchRes.data.length > 0) {
      const topResults = searchRes.data.slice(0, 10);
      
      const results = topResults.map(item => ({
        id: item.videoId,
        title: item.title,
        author: item.author,
        thumbnailUrl: `https://i.ytimg.com/vi/${item.videoId}/hqdefault.jpg`,
        streamUrl: `https://mi-media-proxy.onrender.com/api/stream?id=${item.videoId}`
      }));

      return res.json(results);
    }
  } catch (e) {
    console.log('Error en búsqueda:', e.message);
  }

  res.json([]);
});

app.get('/api/stream', async (req, res) => {
  const videoId = req.query.id;
  if (!videoId) return res.status(400).send('Falta ID');

  try {
    const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
    const output = await exec(videoUrl, {
      dumpSingleJson: true,
      noWarnings: true,
      noCallHome: true,
      preferFreeFormats: true,
      youtubeSkipDashManifest: true
    });

    const format = output.formats.find(f => f.acodec !== 'none' && f.vcodec === 'none') || output.formats[0];
    
    if (format && format.url) {
      return res.redirect(format.url);
    }
    res.status(404).send('Stream no encontrado');
  } catch (e) {
    console.log('Error al extraer stream:', e.message);
    res.status(500).send('Error interno');
  }
});

app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});
