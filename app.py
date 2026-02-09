from flask import Flask, render_template, jsonify, send_from_directory
import os

app = Flask(__name__)
MUSIC_DIR = 'music'  # Folder where your MP3 files live

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/songs')
def get_songs():
    """
    Returns a list of all .mp3 files in the music folder.
    Currently returns just filenames as strings.
    """
    songs = []
    for filename in os.listdir(MUSIC_DIR):
        if filename.lower().endswith('.mp3'):
            songs.append(filename)
    return jsonify(songs)

@app.route('/music/<filename>')
def serve_music(filename):
    return send_from_directory(MUSIC_DIR, filename)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
