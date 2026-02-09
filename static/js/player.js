let currentPlaylist = [];
let currentIndex = 0;
let shuffle = false;
let playlists = JSON.parse(localStorage.getItem('playlists')) || {};
let allLibrarySongs = [];

const audio = document.getElementById('audio');
const volumeSlider = document.getElementById('volume');
const themeToggle = document.getElementById('theme-toggle');
const progressBar = document.getElementById('progress-bar');
const progressFill = document.getElementById('progress-fill');
const progressThumb = document.getElementById('progress-thumb');
const currentTimeEl = document.getElementById('current-time');
const durationEl = document.getElementById('duration');
const sortSelect = document.getElementById('sort-select');
const refreshRandomBtn = document.getElementById('refresh-random-btn');

// Theme
function setTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
    themeToggle.textContent = theme === 'dark' ? '☀️' : '🌙';
}

const savedTheme = localStorage.getItem('theme') ||
(window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
setTheme(savedTheme);

themeToggle.addEventListener('click', () => {
    const current = document.documentElement.getAttribute('data-theme');
    setTheme(current === 'dark' ? 'light' : 'dark');
});

volumeSlider.addEventListener('input', () => {
    audio.volume = volumeSlider.value;
});

// Progress & time
function formatTime(seconds) {
    const min = Math.floor(seconds / 60);
    const sec = Math.floor(seconds % 60);
    return `${min}:${sec.toString().padStart(2, '0')}`;
}

audio.addEventListener('timeupdate', () => {
    if (audio.duration) {
        const percent = (audio.currentTime / audio.duration) * 100;
        progressFill.style.width = `${percent}%`;
        progressThumb.style.left = `${percent}%`;
        currentTimeEl.textContent = formatTime(audio.currentTime);
    }
});

audio.addEventListener('loadedmetadata', () => {
    durationEl.textContent = formatTime(audio.duration);
    currentTimeEl.textContent = '0:00';
    progressFill.style.width = '0%';
    progressThumb.style.left = '0%';
});

progressBar.addEventListener('click', (e) => {
    const rect = progressBar.getBoundingClientRect();
    const pos = (e.clientX - rect.left) / rect.width;
    audio.currentTime = pos * audio.duration;
});

// Library with sorting
async function loadLibrary(sortMode = 'alpha') {
    const res = await fetch('/songs');
    let songs = await res.json();

    // Ensure we have an array of strings
    if (!Array.isArray(songs)) {
        console.error("Unexpected /songs response:", songs);
        songs = [];
    }

    if (sortMode === 'alpha') {
        songs.sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));
    } else if (sortMode === 'random') {
        songs = songs.sort(() => Math.random() - 0.5);
    }

    allLibrarySongs = songs;

    const list = document.getElementById('song-list');
    list.innerHTML = '';

    songs.forEach(song => {
        const li = document.createElement('li');
        li.className = 'song-item';

        const wrapper = document.createElement('div');
        wrapper.className = 'song-name-wrapper';

        const name = document.createElement('span');
        name.className = 'song-name';
        name.textContent = song;

        wrapper.appendChild(name);

        const addBtn = document.createElement('button');
        addBtn.className = 'secondary';
        addBtn.textContent = 'Add';
        addBtn.onclick = (e) => {
            e.stopPropagation();
            addToPlaylist(song);
        };

        li.append(wrapper, addBtn);
        li.onclick = () => playFromLibrary(song);
        list.appendChild(li);
    });

    // Show/hide refresh button only when random is active
    if (sortMode === 'random') {
        refreshRandomBtn.style.display = 'inline-block';
    } else {
        refreshRandomBtn.style.display = 'none';
    }
}

sortSelect.addEventListener('change', () => {
    loadLibrary(sortSelect.value);
});

refreshRandomBtn.addEventListener('click', () => {
    loadLibrary('random');
});

function playFromLibrary(song) {
    currentPlaylist = allLibrarySongs;
    currentIndex = currentPlaylist.indexOf(song);
    if (currentIndex === -1) currentIndex = 0;
    playSong(currentIndex);
}

// Playlists
function loadPlaylists() {
    const list = document.getElementById('playlist-list');
    list.innerHTML = '';

    Object.keys(playlists).forEach(name => {
        const li = document.createElement('li');
        li.className = 'song-item';

        const wrapper = document.createElement('div');
        wrapper.className = 'song-name-wrapper';

        const span = document.createElement('span');
        span.className = 'song-name';
        span.textContent = name;

        wrapper.appendChild(span);

        const viewBtn = document.createElement('button');
        viewBtn.className = 'secondary';
        viewBtn.textContent = 'View';
        viewBtn.onclick = (e) => {
            e.stopPropagation();
            viewPlaylist(name);
        };

        const removeBtn = document.createElement('button');
        removeBtn.className = 'remove-btn';
        removeBtn.textContent = 'Delete';
        removeBtn.onclick = (e) => {
            e.stopPropagation();
            if (confirm(`Delete playlist "${name}"?`)) {
                delete playlists[name];
                localStorage.setItem('playlists', JSON.stringify(playlists));
                loadPlaylists();
                if (currentPlaylist === playlists[name]) {
                    document.getElementById('current-playlist').innerHTML = '';
                }
            }
        };

        li.append(wrapper, viewBtn, removeBtn);
        list.appendChild(li);
    });
}

function createPlaylist() {
    const nameInput = document.getElementById('playlist-name');
    const name = nameInput.value.trim();
    if (name && !playlists[name]) {
        playlists[name] = [];
        localStorage.setItem('playlists', JSON.stringify(playlists));
        loadPlaylists();
        nameInput.value = '';
    }
}

function addToPlaylist(song) {
    const playlistName = prompt('Add to which playlist?');
    if (playlistName && playlists[playlistName]) {
        if (!playlists[playlistName].includes(song)) {
            playlists[playlistName].push(song);
            localStorage.setItem('playlists', JSON.stringify(playlists));
            if (currentPlaylist === playlists[playlistName]) {
                viewPlaylist(playlistName);
            }
        }
    }
}

function viewPlaylist(name) {
    currentPlaylist = playlists[name].slice();
    const div = document.getElementById('current-playlist');
    div.innerHTML = `<h3>${name}</h3><ul class="song-list"></ul>`;
    const ul = div.querySelector('ul');

    currentPlaylist.forEach((song, i) => {
        const li = document.createElement('li');
        li.className = 'song-item';

        const wrapper = document.createElement('div');
        wrapper.className = 'song-name-wrapper';

        const span = document.createElement('span');
        span.className = 'song-name';
        span.textContent = song;

        wrapper.appendChild(span);

        const playBtn = document.createElement('button');
        playBtn.textContent = 'Play';
        playBtn.onclick = (e) => {
            e.stopPropagation();
            playSong(i);
        };

        const removeSongBtn = document.createElement('button');
        removeSongBtn.className = 'remove-btn';
        removeSongBtn.textContent = 'Remove';
        removeSongBtn.onclick = (e) => {
            e.stopPropagation();
            if (confirm(`Remove "${song}" from "${name}"?`)) {
                currentPlaylist.splice(i, 1);
                playlists[name] = currentPlaylist.slice();
                localStorage.setItem('playlists', JSON.stringify(playlists));
                viewPlaylist(name);
                if (currentIndex === i && audio.src.includes(encodeURIComponent(song))) {
                    audio.pause();
                    document.getElementById('now-playing').textContent = 'Nothing playing';
                }
            }
        };

        li.append(wrapper, playBtn, removeSongBtn);
        li.onclick = () => playSong(i);
        ul.appendChild(li);
    });
}

function playSong(index) {
    if (!currentPlaylist.length) return;
    currentIndex = index;
    const song = currentPlaylist[currentIndex];
    audio.src = `/music/${encodeURIComponent(song)}`;
    audio.play().catch(err => console.log("Play error:", err));
    document.getElementById('now-playing').innerHTML = `<span class="song-name">${song}</span>`;

    progressFill.style.width = '0%';
    progressThumb.style.left = '0%';
    currentTimeEl.textContent = '0:00';
    durationEl.textContent = '0:00';
}

function togglePlayPause() {
    audio.paused ? audio.play() : audio.pause();
}

function playNext() {
    if (!currentPlaylist.length) return;
    if (shuffle) {
        currentIndex = Math.floor(Math.random() * currentPlaylist.length);
    } else {
        currentIndex = (currentIndex + 1) % currentPlaylist.length;
    }
    playSong(currentIndex);
}

function playPrevious() {
    if (!currentPlaylist.length) return;
    currentIndex = (currentIndex - 1 + currentPlaylist.length) % currentPlaylist.length;
    playSong(currentIndex);
}

function toggleShuffle() {
    shuffle = !shuffle;
    document.getElementById('shuffle-status').textContent = shuffle ? 'On' : 'Off';
}

function seekForward()  { audio.currentTime += 10; }
function seekBackward() { audio.currentTime = Math.max(0, audio.currentTime - 10); }

window.onload = () => {
    sortSelect.value = 'alpha';          // Force dropdown back to Alphabetical on every reload
    loadLibrary('alpha');
    loadPlaylists();
    audio.volume = volumeSlider.value;
};
