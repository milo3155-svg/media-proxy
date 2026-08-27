const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
app.use(cors());

const PORT = process.env.PORT || 3000;

// Búsqueda directa ultra rápida usando una API ligera de respaldo
app.get('/api/search', async (req, res) => {
    const query = req.query.q;
    if (!query) return res.json([]);

    try {
        // Usamos la API de NewPipeextractor pública de respaldo
        const response = await axios.get(`https://pipedapi.kavin.rocks/search?q=${encodeURIComponent(query)}&filter=videos`, { timeout: 8000 });
        const items = response.data.items || [];
        
        const results = items.slice(0, 15).map(item => ({
            id: item.url ? item.url.split('v=')[1] : item.videoId,
            title: item.title,
            author: item.uploaderName || 'Artista',
            thumbnailUrl: item.thumbnail
        }));

        return res.json(results);
    } catch (error) {
        // Si kavin falla temporalmente, usamos un fallback inteligente con búsqueda en Invidious direct
        try {
            const fallback = await axios.get(`https://invidious.projectsegfau.lt/api/v1/search?q=${encodeURIComponent(query)}`, { timeout: 8000 });
            const results = fallback.data.slice(0, 15).map(item => ({
                id: item.videoId,
                title: item.title,
                author: item.author,
                thumbnailUrl: item.videoThumbnails ? item.videoThumbnails[0].url : ''
            }));
            return res.json(results);
        } catch (err) {
            return res.json([]);
        }
    }
});

app.get('/api/stream', async (req, res) => {
    const videoId = req.query.id;
    if (!videoId) return res.status(400).json({ error: 'Falta el ID' });

    try {
        const response = await axios.get(`https://pipedapi.kavin.rocks/streams/${videoId}`, { timeout: 8000 });
        const audioStreams = response.data.audioStreams || [];
        const audio = audioStreams.find(s => s.mimeType && s.mimeType.includes('audio/mp4')) || audioStreams[0];
        if (audio && audio.url) {
            return res.json({ url: audio.url });
        }
        return res.status(404).json({ error: 'No se encontró audio' });
    } catch (error) {
        return res.status(500).json({ error: 'Fallo al obtener enlace' });
    }
});

app.listen(PORT, () => console.log('Proxy final listo 🚀'));
