from flask import Flask, request, jsonify
import yt_dlp

app = Flask(__name__)

@app.route('/')
def home():
    return jsonify({"estado": "Servidor de audio activo y blindado"})

@app.route('/extraer', methods=['GET'])
def extraer_audio():
    video_id = request.args.get('id')
    if not video_id:
        return jsonify({"error": "Falta el ID del video"}), 400
    
    url = f"https://www.youtube.com/watch?v={video_id}"
    
    ydl_opts = {
        'format': 'bestaudio/best',
        'quiet': True,
        'no_warnings': True,
    }
    
    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(url, download=False)
            # Extrae la URL directa del audio limpio, evadiendo a VEVO
            return jsonify({"url_directa": info['url']})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if _name_ == '__main__':
    app.run(host='0.0.0.0', port=10000)