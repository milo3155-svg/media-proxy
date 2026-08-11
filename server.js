const express = require('express');
const cors = require('cors');
const YouTube = require('youtube-sr').default;

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
    // Búsqueda directa de videos en YouTube sin necesidad de API keys
    const videos = await YouTube.search(query, { limit: 15, type: 'video' });

    const results = videos.map(video => ({
      id: video.id || '',
      title: video.title || 'Sin título',
      author: video.channel ? video.channel.name : 'Artista',
      thumbnailUrl: video.thumbnail ? video.thumbnail.url : '',
      // URL de reproducción completa a través de un relay de streaming público
      streamUrl: `https://cobalt-api.kavin.rocks/stream?url=https://www.youtube.com/watch?v=${video.id}`
    }));

    return res.json(results);
  } catch (e) {
    console.log('Error en búsqueda:', e.message);
    res.status(500).json({ error: 'Error al buscar' });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});
