const express = require('express');
const cors = require('cors');
const YouTube = require('youtube-sr').default;
const axios = require('axios');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
  res.send('Servidor Media Proxy YouTube Activo 🚀');
});

app.get('/api/search', async (req, res) => {
  const query = req.query.q;
  if (!query) return res.status(400).json({ error: 'Falta la consulta' });

  try {
    const videos = await YouTube.search(query, { limit: 15, type: 'video' });

    const results = videos.map(video => ({
      id: video.id || '',
      title: video.title || 'Sin título',
      author: video.channel ? video.channel.name : 'Artista',
      thumbnailUrl: video.thumbnail ? video.thumbnail.url : '',
      streamUrl: `https://mi-media-proxy.onrender.com/api/audio?id=${video.id}`
    }));

    return res.json(results);
  } catch (e) {
    console.log('Error en búsqueda:', e.message);
    res.status(500).json({ error: 'Error al buscar' });
  }
});

// Endpoint proxy que resuelve la URL de audio nativa sin bloqueos
app.get('/api/audio', async (req, res) => {
  const videoId = req.query.id;
  if (!videoId) return res.status(400).send('Falta ID');

  try {
    const response = await axios.get(`https://pipedapi.kavin.rocks/streams/${videoId}`, { timeout: 6000 });
    if (response.data && response.data.audioStreams && response.data.audioStreams.length > 0) {
      // Redirige directamente al flujo de audio de alta calidad de YouTube
      return res.redirect(response.data.audioStreams[0].url);
    }
    res.status(404).send('Audio no disponible');
  } catch (e) {
    // Backup directo si falla la resolución de la instancia
    res.redirect(`https://invidious.drgns.space/latest_version?id=${videoId}&itag=140`);
  }
});

app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});
