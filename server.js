const express = require('express');
const cors = require('cors');
const ytsr = require('ytsr');

const app = express();
app.use(cors());

const PORT = process.env.PORT || 3000;

app.get('/api/search', async (req, res) => {
  const query = req.query.q;
  if (!query) return res.status(400).json({ error: 'Falta la consulta' });

  try {
    // Buscamos directamente en YouTube, que es la fuente más rápida
    const searchResults = await ytsr(query, { limit: 5 });
    const items = searchResults.items.filter(item => item.type === 'video').map(item => ({
      id: item.id,
      title: item.title,
      author: item.author?.name || 'Artista',
      thumbnailUrl: item.bestThumbnail?.url || '',
      // Usaremos el ID para construir el stream
      streamUrl: `https://www.youtube.com/watch?v=${item.id}`
    }));

    res.json(items);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error buscando en YouTube" });
  }
});

app.listen(PORT, () => console.log('Servidor proxy activo'));
