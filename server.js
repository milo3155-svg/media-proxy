const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
app.use(cors());

const PORT = process.env.PORT || 3000;

const PIPED_API = 'https://api.piped.projectsegfau.lt';

// 1. ENDPOINT DE BÚSQUEDA ROBUSTO
app.get('/api/search', async (req, res) => {
    const query = req.query.q;
    if (!query) return res.json([]);

    try {
        const response = await axios.get(`${PIPED_API}/search?q=${encodeURIComponent(query)}&filter=all`, { timeout: 10000 });
        
        // Aceptamos tanto .items como si viene directo en un array
        const rawItems = response.data.items || (Array.isArray(response.data) ? response.data : []);

        if (rawItems.length > 0) {
            const results = rawItems
                .filter(item => item.type === 'stream' || item.url) // Filtramos videos/canciones
                .slice(0, 15)
                .map(item => {
                    const videoId = item.url ? item.url.split('v=')[1] : (item.videoId || 'desconocido');
                    return {
                        id: videoId,
                        title: item.title || 'Sin título',
                        author: item.uploaderName || item.uploader || 'Artista',
                        thumbnailUrl: item.thumbnail || item.thumbnailUrl || ''
                    };
                });
            return res.json(results);
        }
        return res.json([]);
    } catch (error) {
        console.error("Error en búsqueda:", error.message);
        return res.status(500).json([{ title: 'Error del proxy', author: 'Reintenta' }]);
    }
});

// 2. ENDPOINT DE REPRODUCCIÓN
app.get('/api/stream', async (req, res) => {
    const videoId = req.query.id;
    if (!videoId) return res.status(400).json({ error: 'Falta el ID' });

    try {
        const response = await axios.get(`${PIPED_API}/streams/${videoId}`, { timeout: 10000 });
        
        const audioStreams = response.data.audioStreams || [];
        if (audioStreams.length > 0) {
            const audio = audioStreams.find(s => s.mimeType && s.mimeType.includes('audio/mp4')) 
                          || audioStreams[0];
            return res.json({ url: audio.url });
        }
        return res.status(404).json({ error: 'No se encontró audio' });
    } catch (error) {
        console.error("Error en stream:", error.message);
        return res.status(500).json({ error: 'Fallo al obtener enlace' });
    }
});

app.listen(PORT, () => console.log('Proxy de música conectado y optimizado 🚀'));
