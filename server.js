const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
app.use(cors());

const PORT = process.env.PORT || 3000;

// API pública para extraer info de audio sin bloqueos
const PIPED_API = 'https://pipedapi.adminforge.de';
// 1. ENDPOINT DE BÚSQUEDA
app.get('/api/search', async (req, res) => {
    const query = req.query.q;
    if (!query) return res.json([]);

    try {
        const response = await axios.get(`${PIPED_API}/search?q=${encodeURIComponent(query)}&filter=all`, { timeout: 10000 });
        
        if (response.data && response.data.items) {
            const results = response.data.items
                .filter(item => item.type === 'stream') // Solo canciones/videos
                .slice(0, 15) // Tomamos los primeros 15 resultados
                .map(item => {
                    // El ID viene en la URL como /watch?v=ID
                    const videoId = item.url ? item.url.split('v=')[1] : 'desconocido';
                    return {
                        id: videoId,
                        title: item.title,
                        author: item.uploaderName,
                        thumbnailUrl: item.thumbnail
                    };
                });
            return res.json(results);
        }
        return res.json([]);
    } catch (error) {
        console.error("Error en búsqueda:", error.message);
        return res.status(500).json([{ title: 'Error del proxy', author: 'Reintenta en unos segundos' }]);
    }
});

// 2. ENDPOINT DE REPRODUCCIÓN (¡El que faltaba!)
app.get('/api/stream', async (req, res) => {
    const videoId = req.query.id;
    if (!videoId) return res.status(400).json({ error: 'Falta el ID' });

    try {
        const response = await axios.get(`${PIPED_API}/streams/${videoId}`, { timeout: 10000 });
        
        if (response.data && response.data.audioStreams && response.data.audioStreams.length > 0) {
            // Buscamos el mejor audio para Android (m4a)
            const audio = response.data.audioStreams.find(s => s.mimeType.includes('audio/mp4')) 
                          || response.data.audioStreams[0];
            return res.json({ url: audio.url });
        }
        return res.status(404).json({ error: 'No se encontró audio' });
    } catch (error) {
        console.error("Error en stream:", error.message);
        return res.status(500).json({ error: 'Fallo al obtener enlace' });
    }
});

app.listen(PORT, () => console.log('Proxy de música conectado y listo 🚀'));
