const express = require('express');
const cors = require('cors');
const YouTube = require('youtube-sr').default;
const axios = require('axios');

const app = express();
app.use(cors());

const PORT = process.env.PORT || 3000;

// 1. BÚSQUEDA (Totalmente estable y funcional)
app.get('/api/search', async (req, res) => {
    const query = req.query.q;
    if (!query) return res.json([]);

    try {
        const results = await YouTube.search(query, { limit: 15, type: 'video' });
        const formattedResults = results.map(video => ({
            id: video.id,
            title: video.title,
            author: video.channel ? video.channel.name : 'Artista',
            thumbnailUrl: video.thumbnail ? video.thumbnail.url : ''
        }));
        return res.json(formattedResults);
    } catch (error) {
        console.error("Error en búsqueda:", error.message);
        return res.status(500).json([{ title: 'Error de búsqueda', author: 'Reintenta' }]);
    }
});

// 2. STREAMING BLINDADO (Con múltiples pasarelas de respaldo para evitar bloqueos de IP)
app.get('/api/stream', async (req, res) => {
    const videoId = req.query.id;
    if (!videoId) return res.status(400).json({ error: 'Falta el ID del video' });

    // Pasarelas públicas de alta velocidad para extracción de audio en nube
    const gateways = [
        `https://pipedapi.kavin.rocks/streams/${videoId}`,
        `https://api.piped.projectsegfau.lt/streams/${videoId}`,
        `https://invidious.privacyredirect.com/api/v1/videos/${videoId}`
    ];

    for (const url of gateways) {
        try {
            const response = await axios.get(url, { timeout: 6000 });
            
            // Si es formato Piped
            if (response.data.audioStreams) {
                const audio = response.data.audioStreams.find(s => s.mimeType && s.mimeType.includes('audio/mp4')) || response.data.audioStreams[0];
                if (audio && audio.url) return res.json({ url: audio.url });
            }
            
            // Si es formato Invidious
            if (response.data.adaptiveFormats) {
                const audio = response.data.adaptiveFormats.find(f => f.type && f.type.includes('audio/'));
                if (audio && audio.url) return res.json({ url: audio.url });
            }
        } catch (err) {
            continue; // Intentamos con la siguiente pasarela si una falla
        }
    }

    return res.status(500).json({ error: 'Fallo al obtener enlace de audio en todas las pasarelas' });
});

app.listen(PORT, () => console.log('Proxy resiliente conectado 🚀'));
