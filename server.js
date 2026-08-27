const express = require('express');
const cors = require('cors');
const YouTube = require('youtube-sr').default;
const ytdl = require('@distube/ytdl-core'); // Extractor directo de alta estabilidad

const app = express();
app.use(cors());

const PORT = process.env.PORT || 3000;

// 1. ENDPOINT DE BÚSQUEDA (Autónomo con YouTube-SR)
app.get('/api/search', async (req, res) => {
    const query = req.query.q;
    if (!query) return res.json([]);

    try {
        // Búsqueda directa sin depender de APIs de terceros caídas
        const results = await YouTube.search(query, { limit: 15, type: 'video' });
        
        const formattedResults = results.map(video => ({
            id: video.id,
            title: video.title,
            author: video.channel ? video.channel.name : 'Artista',
            thumbnailUrl: video.thumbnail ? video.thumbnail.url : ''
        }));

        return res.json(formattedResults);
    } catch (error) {
        console.error("Error en búsqueda interna:", error.message);
        return res.status(500).json([{ title: 'Error de búsqueda', author: 'Reintenta' }]);
    }
});

// 2. ENDPOINT DE REPRODUCCIÓN (Extracción directa con ytdl-core)
app.get('/api/stream', async (req, res) => {
    const videoId = req.query.id;
    if (!videoId) return res.status(400).json({ error: 'Falta el ID del video' });

    try {
        const videoURL = `https://www.youtube.com/watch?v=${videoId}`;
        
        // Verificamos que el video sea válido y accesible
        const info = await ytdl.getInfo(videoURL);
        
        // Filtramos estrictamente los formatos que contengan solo audio de alta calidad
        const audioFormats = ytdl.filterFormats(info.formats, 'audioonly');
        
        if (audioFormats && audioFormats.length > 0) {
            // Tomamos el primer formato de audio disponible con URL directa
            return res.json({ url: audioFormats[0].url });
        }

        return res.status(404).json({ error: 'No se encontró un enlace de audio válido' });
    } catch (error) {
        console.error("Error crítico en stream:", error.message);
        return res.status(500).json({ error: 'Fallo al procesar el audio en el servidor' });
    }
});

app.listen(PORT, () => console.log('Backend autónomo y optimizado conectado 🚀'));
