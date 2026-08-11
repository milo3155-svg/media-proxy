const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;

app.get('/', async (req, res) => {
  const query = req.query.q || 'bad bunny';
  const results = await searchMusic(query);
  res.json(results);
});

app.get('/api/search', async (req, res) => {
  const query = req.query.q || 'bad bunny';
  const results = await searchMusic(query);
  res.json(results);
});

async function searchMusic(query) {
  try {
    // API de Saavn para audio completo de alta fidelidad
    const response = await axios.get(`https://saavn.me/api/search/songs?query=${encodeURIComponent(query)}&page=1&limit=20`, { timeout: 8000 });
    
    if (response.data && response.data.data && response.data.data.results) {
      return response.data.data.results.map(item => {
        // Seleccionar la mejor calidad de audio disponible
        const downloadUrls = item.downloadUrl || [];
        const bestAudio = downloadUrls.length > 0 ? downloadUrls[downloadUrls.length - 1].link : '';
        
        // Seleccionar la mejor calidad de portada
        const images = item.image || [];
        const bestImage = images.length > 0 ? images[images.length - 1].link : '';

        return {
          id: item.id || '',
          title: item.name ? item.name.replace(/&quot;/g, '"').replace(/&amp;/g, '&') : 'Sin título',
          author: item.primaryArtists || 'Artista',
          thumbnailUrl: bestImage,
          streamUrl: bestAudio
        };
      });
    }
  } catch (e) {
    console.log('Error en búsqueda completa:', e.message);
  }
  return [];
}

app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});
