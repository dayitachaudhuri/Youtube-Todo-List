// const apiUrl = 'http://localhost:3000/urls/playlist'; 
const apiUrl = 'https://render-api-lnkr.onrender.com/urls/playlist';

// Constants for views
const VIEW_PLAYLISTS = 'playlists';
const VIEW_VIDEOS = 'videos';

// DOM Elements
const urlList = document.getElementById('urlList');
const urlInput = document.getElementById('urlInput');
const addPlaylistButton = document.getElementById('addPlaylist');
const addVideoButton = document.getElementById('addVideo');
const backButtonContainer = document.getElementById('backButtonContainer');

// ------------------------------------------
// 1. HELPER FUNCTIONS
// ------------------------------------------

function extractPlaylistId(playlistUrl) {
    const match = playlistUrl.match(/[?&]list=([a-zA-Z0-9_-]+)/);
    return match ? match[1] : null; 
}

function extractVideoId(videoUrl) {
    const match = videoUrl.match(/[?&]v=([a-zA-Z0-9_-]+)/);
    return match ? match[1] : null;
}

// ------------------------------------------
// 2. LOCALSTORAGE FUNCTIONS
// ------------------------------------------

function saveCurrentView(view) {
    localStorage.setItem('currentView', view);
}

function saveLastPlaylist(playlistUrl) {
    localStorage.setItem('lastPlaylist', playlistUrl);
}

function restoreLastView() {
    const currentView = localStorage.getItem('currentView');

    if (currentView === VIEW_VIDEOS) {
        const lastPlaylistUrl = localStorage.getItem('lastPlaylist');
        if (lastPlaylistUrl) {
            fetchAllVideosOfPlaylist(lastPlaylistUrl);
        } else {
            fetchAllPlaylists(); 
        }
    } else {
        fetchAllPlaylists();
    }
}

function showBackButton() {
    backButtonContainer.style.display = 'block';
}

function hideBackButton() {
    backButtonContainer.style.display = 'none';
}

function goBackToPlaylists() {
    saveCurrentView(VIEW_PLAYLISTS);
    fetchAllPlaylists(); 
    hideBackButton(); 
}

// ------------------------------------------
// 3. GET API FUNCTIONS
// ------------------------------------------

async function fetchAllPlaylists() {
    saveCurrentView(VIEW_PLAYLISTS); 
    try {
        const response = await fetch(`${apiUrl}/all`);
        const data = await response.json();

        if (data && Array.isArray(data)) {
            displayPlaylists(data);
        }
    } catch (error) {
        console.error('Error fetching playlists:', error);
    }
}

async function fetchAllVideosOfPlaylist(playlistUrl) {
    saveCurrentView(VIEW_VIDEOS); 
    saveLastPlaylist(playlistUrl); 
    showBackButton(); 
    try {
        const response = await fetch(`${apiUrl}?playlistUrl=${encodeURIComponent(playlistUrl)}`);
        if (!response.ok) {
            throw new Error(`Failed to fetch video URLs: ${response.statusText}`);
        }

        const data = await response.json();
        displayVideos(data);
    } catch (error) {
        console.error('Error fetching video URLs:', error);
    }
}

// ------------------------------------------
// 4. POST API FUNCTIONS
// ------------------------------------------

async function addPlaylist() {
    const playlistUrl = urlInput.value.trim();
    const url = extractPlaylistId(playlistUrl);
    const isPlaylist = true;
    console.log(url);
    console.log(isPlaylist);
    if (!url) {
        alert('Valid Playlist URL is required.');
        return;
    }
    try {
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ url, isPlaylist }),
        });

        if (response.ok) {
            const message = await response.text();
            alert(message); 
        } else {
            const errorMessage = await response.text();
            alert(`Failed to add playlist: ${errorMessage}`);
        }
    } catch (error) {
        console.error('Error adding playlist:', error);
        alert('An error occurred while adding the playlist.');
    }
}

async function addVideo() {
    const videoUrl = urlInput.value.trim();
    const url = extractVideoId(videoUrl);
    const isPlaylist = false;
    console.log(url);
    console.log(isPlaylist);
    if (!url) {
        alert('Valid Video URL is required.');
        return;
    }
    try {
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ url, isPlaylist }),
        });

        if (response.ok) {
            const message = await response.text();
            alert(message); 
        } else {
            const errorMessage = await response.text();
            alert(`Failed to add Video: ${errorMessage}`);
        }
    } catch (error) {
        console.error('Error adding video:', error);
        alert('An error occurred while adding the video.');
    }
}

// ------------------------------------------
// 5. DELETE API FUNCTIONS
// ------------------------------------------

async function removePlaylist(playlistUrl) {
    try {
        const response = await fetch(`${apiUrl}/all`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ playlistUrl }),
        });

        if (response.ok) {
            fetchAllPlaylists(); 
        } else {
            alert('Failed to remove playlist.');
        }
    } catch (error) {
        console.error('Error removing playlist:', error);
        alert('Failed to remove playlist.');
    }
}

async function removeVideo(videoUrl) {
    try {
        const response = await fetch(`${apiUrl}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ videoUrl }),
        });

        if (response.ok) {
            const lastPlaylistUrl = localStorage.getItem('lastPlaylist');
            fetchAllVideosOfPlaylist(lastPlaylistUrl); 
        } else {
            alert('Failed to remove video.');
        }
    } catch (error) {
        console.error('Error removing video:', error);
        alert('Failed to remove video.');
    }
}


//------------------------------------------
// 6. HTML DISPLAY FUNCTIONS
//------------------------------------------

function displayPlaylists(playlists) {
    urlList.innerHTML = '';

    playlists.forEach((playlist) => {
        const li = document.createElement('li');
        const videoUrl = `https://www.youtube.com/playlist?list=${playlist.playlist}`;
        const embedUrl = `https://www.youtube.com/embed/videoseries?list=${playlist.playlist}`;

        li.innerHTML = `
            <div>
                <iframe width="450" height="250" src="${embedUrl}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
            </div>
            <button onclick="removePlaylist('${playlist.playlist}')">Remove</button>
            <button onclick="fetchAllVideosOfPlaylist('${playlist.playlist}')">Show all videos</button>
        `;
        urlList.appendChild(li);
    });
}

function displayVideos(videos) {
    urlList.innerHTML = '';

    videos.forEach((video) => {
        const li = document.createElement('li');

        if (video.completed) {
            li.classList.add('completed');
        }

        const videoUrl = `https://www.youtube.com/watch?v=${video.url}`;
        const embedUrl = `https://www.youtube.com/embed/${video.url}`;

        li.innerHTML = `
            <div>
                <iframe width="450" height="250" src="${embedUrl}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
            </div>
            <div>
                <input type="checkbox" id="checkbox-${video.url}" ${video.completed ? 'checked' : ''} onclick="toggleCompleteVideo('${video.url}', this)">
                <label for="checkbox-${video.url}">Mark as Completed</label>
            </div>
            <button onclick="removeVideo('${video.url}')">Remove</button>
        `;
        urlList.appendChild(li);
    });
}

async function toggleCompleteVideo(videoUrl, checkbox) {
    const completed = checkbox.checked;

    try {
        const response = await fetch(`${apiUrl}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ videoUrl, completed }),
        });

        if (response.ok) {
            const listItem = checkbox.closest('li');
            if (completed) {
                listItem.classList.add('completed');
            } else {
                listItem.classList.remove('completed');
            }
        } else {
            alert('Failed to update video completion status.');
        }
    } catch (error) {
        console.error('Error updating video completion:', error);
        alert('Failed to update video completion status.');
    }
}

// Event Listeners
addPlaylistButton.addEventListener('click', addPlaylist);
addVideoButton.addEventListener('click', addVideo);
document.getElementById('backButton').addEventListener('click', goBackToPlaylists);

// Restore the last view on page load
window.addEventListener('DOMContentLoaded', restoreLastView);