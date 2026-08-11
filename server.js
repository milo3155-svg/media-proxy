const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;

// Ruta de prueba
app.get('/', (req, res) => {
  res.send('Servidor Media Proxy Activo 🚀');
});

// Endpoint de Búsqueda
app.get('/api/search', async (req, res) => {
  const query = req.query.q;
  if (!query) return res.status(400).json({ error: 'Falta la consulta' });

  try {
    const response = await axios.get(`https://saavn.me/api/search/songs?query=${encodeURIComponent(query)}&page=1&limit=20`);
    if (response.data && response.data.data) {
      const results = response.data.data.results.map(item => ({
        id: item.id,
        title: item.name,
        author: item.primaryArtists,
        thumbnailUrl: item.image ? item.image[item.image.length - 1].link : '',
        streamUrl: item.downloadUrl ? item.downloadUrl[item.downloadUrl.length - 1].link : ''
      }));
      return res.json(results);
    }
    res.json([]);
  } catch (error) {
    res.status(500).json({ error: 'Error procesando la búsqueda' });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});
