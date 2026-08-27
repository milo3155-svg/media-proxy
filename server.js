const express = require('express');
const cors = require('cors');
const YouTube = require('youtube-sr').default;
const ytdl = require('@distube/ytdl-core');

const app = express();
app.use(cors());

const PORT = process.env.PORT || 3000;

// 1. BÚSQUEDA (Estable y funcionando)
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

// 2. STREAMING DIRECTO BLINDADO (Extracción local con ytdl-core)
app.get('/api/stream', async (req, res) => {
    const videoId = req.query.id;
    if (!videoId) return res.status(400).json({ error: 'Falta el ID del video' });

    try {
        const videoURL = `https://www.youtube.com/watch?v=${videoId}`;
        
        // Obtenemos la información completa del video de forma segura
        const info = await ytdl.getInfo(videoURL);
        
        // Filtramos formatos de audio disponibles
        const audioFormats = ytdl.filterFormats(info.formats, 'audioonly');
        
        if (audioFormats && audioFormats.length > 0) {
            // Seleccionamos el enlace directo con mejor estabilidad
            return res.json({ url: audioFormats[0].url });
        }

        return res.status(404).json({ error: 'No se encontró enlace de audio' });
    } catch (error) {
        console.error("Error crítico en stream:", error.message);
        return res.status(500).json({ error: 'Fallo al procesar el audio' });
    }
});

app.listen(PORT, () => console.log('Proxy autónomo definitivo activo 🚀'));
