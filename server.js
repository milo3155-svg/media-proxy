const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
  res.send('Servidor Media Proxy Activo 🚀');
});

app.get('/api/search', async (req, res) => {
  const query = req.query.q;
  if (!query) return res.status(400).json({ error: 'Falta la consulta' });

  try {
    // API confiable y sin bloqueo de IPs
    const response = await axios.get(`https://itunes.apple.com/search?term=${encodeURIComponent(query)}&entity=song&limit=25`, { timeout: 8000 });
    
    if (response.data && response.data.results) {
      const results = response.data.results.map(item => ({
        id: item.trackId ? item.trackId.toString() : '',
        title: item.trackName || 'Sin título',
        author: item.artistName || 'Artista',
        thumbnailUrl: item.artworkUrl100 ? item.artworkUrl100.replace('100x100bb', '300x300bb') : '',
        streamUrl: item.previewUrl || ''
      }));
      return res.json(results);
    }
  } catch (e) {
    console.log('Error al consultar la fuente:', e.message);
  }

  res.json([]);
});

app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});
