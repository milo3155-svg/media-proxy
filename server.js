const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
app.use(cors());

const PORT = process.env.PORT || 3000;

// EL CEREBRO HÍBRIDO: Dos fuentes distintas para que no nos bloqueen
const SEARCH_API = 'https://vid.puffyan.us/api/v1/search'; // Para buscar
const STREAM_API = 'https://api.piped.projectsegfau.lt/streams'; // Para reproducir

// 1. ENDPOINT DE BÚSQUEDA (Conectado a Invidious)
app.get('/api/search', async (req, res) => {
    const query = req.query.q;
    if (!query) return res.json([]);

    try {
        const response = await axios.get(`${SEARCH_API}?q=${encodeURIComponent(query)}`, { timeout: 10000 });
        
        // Invidious devuelve un arreglo directo
        if (Array.isArray(response.data) && response.data.length > 0) {
            const results = response.data
                .filter(item => item.type === 'video') // Solo videos musicales
                .slice(0, 15)
                .map(item => ({
                    id: item.videoId,
                    title: item.title,
                    author: item.author,
                    thumbnailUrl: item.videoThumbnails ? item.videoThumbnails[0].url : ''
                }));
            return res.json(results);
        }
        return res.json([]);
    } catch (error) {
        console.error("Error en búsqueda:", error.message);
        return res.status(500).json([{ title: 'Error del proxy', author: 'Reintenta' }]);
    }
});

// 2. ENDPOINT DE REPRODUCCIÓN (Conectado a Piped)
app.get('/api/stream', async (req, res) => {
    const videoId = req.query.id;
    if (!videoId) return res.status(400).json({ error: 'Falta el ID' });

    try {
        const response = await axios.get(`${STREAM_API}/${videoId}`, { timeout: 10000 });
        
        const audioStreams = response.data.audioStreams || [];
        if (audioStreams.length > 0) {
            // Buscamos el mejor formato mp4 de audio
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

app.listen(PORT, () => console.log('Proxy híbrido conectado y blindado 🚀'));
