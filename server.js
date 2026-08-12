const express = require('express');
const cors = require('cors');
const ytsr = require('ytsr');
const ytdl = require('@distube/ytdl-core');

const app = express();
app.use(cors());

const PORT = process.env.PORT || 3000;

app.get('/api/search', async (req, res) => {
  const query = req.query.q;
  if (!query) return res.status(400).json({ error: 'Falta la consulta' });

  try {
    const searchResults = await ytsr(query, { limit: 5 });
    const items = searchResults.items.filter(item => item.type === 'video').map(item => ({
      id: item.id,
      title: item.title,
      author: item.author?.name || 'Artista',
      thumbnailUrl: item.bestThumbnail?.url || '',
      // Pasamos una URL interna de nuestra propia API para resolver el stream de audio
      streamUrl: `https://mi-media-proxy.onrender.com/api/stream?id=${item.id}`
    }));

    res.json(items);
  } catch (error) {
    console.error('Error en búsqueda:', error);
    res.json([]);
  }
});

// Endpoint que entrega el flujo de audio directo
app.get('/api/stream', async (req, res) => {
  const videoId = req.query.id;
  if (!videoId) return res.status(400).send('Falta el ID del video');

  try {
    const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
    const info = await ytdl.getInfo(videoUrl);
    
    // Filtramos únicamente los formatos de solo audio de mayor calidad
    const audioFormats = ytdl.filterFormats(info.formats, 'audioonly');
    
    if (audioFormats.length > 0) {
      // Redirigimos al reproductor directamente al archivo de audio crudo
      res.redirect(audioFormats[0].url);
    } else {
      res.status(404).send('No se encontró formato de audio');
    }
  } catch (error) {
    console.error('Error extrayendo audio:', error);
    res.status(500).send('Error procesando audio');
  }
});

app.listen(PORT, () => console.log(`Servidor proxy de audio activo en puerto ${PORT}`));
