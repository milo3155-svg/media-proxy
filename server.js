const express = require('express');
const cors = require('cors');
const YouTube = require('youtube-sr').default;
const axios = require('axios');

const app = express();
app.use(cors());

const PORT = process.env.PORT || 3000;

// 1. BÚSQUEDA PERFECTA (Ya validada y funcionando)
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

// 2. STREAMING BLINDADO (Extracción directa por respaldo de alta disponibilidad)
app.get('/api/stream', async (req, res) => {
    const videoId = req.query.id;
    if (!videoId) return res.status(400).json({ error: 'Falta el ID del video' });

    try {
        // Consultamos una instancia de Piped optimizada para extracción de enlaces de audio
        const response = await axios.get(`https://pipedapi.kavin.rocks/streams/${videoId}`, { timeout: 8000 });
        const audioStreams = response.data.audioStreams || [];
        
        // Buscamos el mejor stream de audio disponible
        const audio = audioStreams.find(s => s.mimeType && s.mimeType.includes('audio/mp4')) || audioStreams[0];
        
        if (audio && audio.url) {
            return res.json({ url: audio.url });
        }

        return res.status(404).json({ error: 'No se encontró enlace de audio' });
    } catch (error) {
        // Fallback de respaldo con otra ruta si la principal parpadea
        try {
            const fallback = await axios.get(`https://api.piped.projectsegfau.lt/streams/${videoId}`, { timeout: 8000 });
            const streams = fallback.data.audioStreams || [];
            if (streams.length > 0 && streams[0].url) {
                return res.json({ url: streams[0].url });
            }
        } catch (err) {}

        console.error("Error crítico en stream:", error.message);
        return res.status(500).json({ error: 'Fallo al procesar el audio' });
    }
});

app.listen(PORT, () => console.log('Proxy de música totalmente operativo 🚀'));
