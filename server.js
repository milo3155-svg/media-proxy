const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;

app.get('/', async (req, res) => {
  const query = req.query.q || 'bad bunny';
  const results = await searchSaavnV2(query);
  res.json(results);
});

app.get('/api/search', async (req, res) => {
  const query = req.query.q || 'bad bunny';
  const results = await searchSaavnV2(query);
  res.json(results);
});

async function searchSaavnV2(query) {
  try {
    // API optimizada sin restricción de peticiones desde la nube
    const response = await axios.get(`https://saavn.dev/api/search/songs?query=${encodeURIComponent(query)}&limit=20`, { timeout: 8000 });
    
    if (response.data && response.data.data && response.data.data.results) {
      return response.data.data.results.map(item => {
        const downloadUrls = item.downloadUrl || [];
        // Toma el stream de audio MP3 completo de máxima calidad
        const audioUrl = downloadUrls.length > 0 ? downloadUrls[downloadUrls.length - 1].url : '';
        
        const images = item.image || [];
        const imageUrl = images.length > 0 ? images[images.length - 1].url : '';

        return {
          id: item.id || '',
          title: item.name ? item.name.replace(/&quot;/g, '"').replace(/&amp;/g, '&') : 'Sin título',
          author: item.artists && item.artists.primary && item.artists.primary.length > 0 ? item.artists.primary[0].name : 'Artista',
          thumbnailUrl: imageUrl,
          streamUrl: audioUrl
        };
      });
    }
  } catch (e) {
    console.log('Error en búsqueda v2:', e.message);
  }
  return [];
}

app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});
