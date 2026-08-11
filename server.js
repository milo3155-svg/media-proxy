const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;

// Ruta principal de verificación
app.get('/', (req, res) => {
  res.send('Servidor Media Proxy Activo 🚀');
});

// Endpoint de búsqueda con múltiples fuentes de respaldo
app.get('/api/search', async (req, res) => {
  const query = req.query.q;
  if (!query) return res.status(400).json({ error: 'Falta la consulta' });

  // Fuente 1: API JioSaavn
  try {
    const response = await axios.get(`https://saavn.me/api/search/songs?query=${encodeURIComponent(query)}&page=1&limit=20`, { timeout: 7000 });
    if (response.data && response.data.data && response.data.data.results && response.data.data.results.length > 0) {
      const results = response.data.data.results.map(item => ({
        id: item.id || '',
        title: item.name || 'Sin título',
        author: item.primaryArtists || 'Artista',
        thumbnailUrl: item.image && item.image.length > 0 ? item.image[item.image.length - 1].link : '',
        streamUrl: item.downloadUrl && item.downloadUrl.length > 0 ? item.downloadUrl[item.downloadUrl.length - 1].link : ''
      }));
      return res.json(results);
    }
  } catch (e) {
    console.log('Error en Fuente 1, intentando Fuente 2...');
  }

  // Fuente 2: API Respaldo Invidious
  try {
    const response = await axios.get(`https://invidious.nerdvpn.de/api/v1/search?q=${encodeURIComponent(query)}&type=video`, { timeout: 7000 });
    if (Array.isArray(response.data) && response.data.length > 0) {
      const results = response.data.map(item => ({
        id: item.videoId || '',
        title: item.title || 'Sin título',
        author: item.author || 'Artista',
        thumbnailUrl: `https://i.ytimg.com/vi/${item.videoId}/hqdefault.jpg`,
        streamUrl: ''
      }));
      return res.json(results);
    }
  } catch (e) {
    console.log('Error en Fuente 2');
  }

  res.json([]);
});

app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});
