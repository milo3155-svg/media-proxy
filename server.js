const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;

// Función de búsqueda universal en iTunes
async function fetchMusic(query) {
  try {
    const response = await axios.get(`https://itunes.apple.com/search?term=${encodeURIComponent(query)}&entity=song&limit=25`, { timeout: 8000 });
    if (response.data && response.data.results) {
      return response.data.results.map(item => ({
        id: item.trackId ? item.trackId.toString() : '',
        title: item.trackName || 'Sin título',
        author: item.artistName || 'Artista',
        thumbnailUrl: item.artworkUrl100 ? item.artworkUrl100.replace('100x100bb', '300x300bb') : '',
        streamUrl: item.previewUrl || ''
      }));
    }
  } catch (e) {
    console.log('Error en búsqueda:', e.message);
  }
  return [];
}

// Ruta principal (Acepta búsquedas directo o muestra Coldplay por defecto)
app.get('/', async (req, res) => {
  const query = req.query.q || 'coldplay';
  const results = await fetchMusic(query);
  res.json(results);
});

// Ruta secundaria por compatibilidad
app.get('/api/search', async (req, res) => {
  const query = req.query.q || 'coldplay';
  const results = await fetchMusic(query);
  res.json(results);
});

app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});
