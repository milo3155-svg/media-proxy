const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
app.use(cors());

const PORT = process.env.PORT || 3000;

// Lista de servidores ultra rápidos de Invidious
const INSTANCES = [
  'https://inv.nerdvpn.de',
  'https://invidious.nerdvpn.de',
  'https://vid.puppethead.com'
];

app.get('/api/search', async (req, res) => {
  const query = req.query.q;
  if (!query) return res.status(400).json({ error: 'Falta la consulta' });

  for (const instance of INSTANCES) {
    try {
      const response = await axios.get(`${instance}/api/v1/search?q=${encodeURIComponent(query)}&type=video`, { timeout: 4000 });
      
      if (response.data && response.data.length > 0) {
        const results = response.data.slice(0, 10).map(item => ({
          id: item.videoId,
          title: item.title || 'Sin título',
          author: item.author || 'Artista',
          thumbnailUrl: item.videoThumbnails ? item.videoThumbnails[0]?.url : '',
          // Enlace directo al stream de audio en el servidor de Invidious (sin sobrecargar Render)
          streamUrl: `${instance}/latest_version?id=${item.videoId}&italic=1&itag=140`
        }));

        return res.json(results);
      }
    } catch (e) {
      console.log(`Instancia falló, probando siguiente...`);
    }
  }

  res.json([]);
});

app.listen(PORT, () => console.log('Proxy liviano listo'));
