const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;

app.get('/', async (req, res) => {
  const query = req.query.q || 'bad bunny';
  const results = await searchYouTube(query);
  res.json(results);
});

app.get('/api/search', async (req, res) => {
  const query = req.query.q || 'bad bunny';
  const results = await searchYouTube(query);
  res.json(results);
});

async function searchYouTube(query) {
  try {
    // Instancia de Piped API para extraer contenido completo de YouTube
    const response = await axios.get(`https://pipedapi.kavin.rocks/search?q=${encodeURIComponent(query)}&filter=music_songs`, { timeout: 9000 });
    
    if (response.data && response.data.items) {
      const items = response.data.items.filter(i => i.type === 'stream');
      
      // Obtener URLs directas para los primeros resultados
      const formattedResults = await Promise.all(items.slice(0, 15).map(async (item) => {
        let streamUrl = '';
        try {
          const detail = await axios.get(`https://pipedapi.kavin.rocks/streams/${item.url.split('v=')[1]}`, { timeout: 5000 });
          if (detail.data && detail.data.audioStreams && detail.data.audioStreams.length > 0) {
            // Seleccionar el mejor stream de audio completo
            streamUrl = detail.data.audioStreams[0].url;
          }
        } catch (e) {
          // Fallback a reproductor directo
        }

        return {
          id: item.url ? item.url.split('v=')[1] : '',
          title: item.title || 'Sin título',
          author: item.uploaderName || 'Artista',
          thumbnailUrl: item.thumbnail || '',
          streamUrl: streamUrl
        };
      }));

      return formattedResults.filter(r => r.streamUrl !== '');
    }
  } catch (e) {
    console.log('Error en Piped API:', e.message);
  }
  return [];
}

app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});
