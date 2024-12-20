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

// Save the current view to localStorage
function saveCurrentView(view) {
    localStorage.setItem('currentView', view);
}

// Save the last accessed playlist to localStorage
function saveLastPlaylist(playlistUrl) {
    localStorage.setItem('lastPlaylist', playlistUrl);
}

// Restore the last view and playlist
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

// Show the back button and update the view
function showBackButton() {
    backButtonContainer.style.display = 'block';
}

// Hide the back button
function hideBackButton() {
    backButtonContainer.style.display = 'none';
}

// Go back to the playlists view
function goBackToPlaylists() {
    saveCurrentView(VIEW_PLAYLISTS);
    fetchAllPlaylists(); 
    hideBackButton(); 
}

// Fetch all unique playlists from the server
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

// Display playlists as embedded YouTube videos
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

// Fetch all videos of a playlist from the server
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

// Display videos in the list
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

// Toggle the "completed" status of a video
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

// Remove a playlist by its URL from the list
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

// Remove a video by its URL
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

function extractPlaylistId(playlistUrl) {
    const match = playlistUrl.match(/[?&]list=([a-zA-Z0-9_-]+)/);
    return match ? match[1] : null; 
}

function extractVideoId(videoUrl) {
    const match = videoUrl.match(/[?&]v=([a-zA-Z0-9_-]+)/);
    return match ? match[1] : null;
}

async function addPlaylist() {
    const playlistUrl = urlInput.value.trim();
    if (!playlistUrl) return alert('Please enter a YouTube playlist URL.');

    const playlistId = extractPlaylistId(playlistUrl);
    const videoUrls = await fetchVideosFromPlaylist(playlistUrl);
    if (videoUrls.length === 0) {
        alert('No videos found in the playlist.');
        return;
    }

    await saveVideoUrls(videoUrls, playlistId);
    urlInput.value = '';
}

// Function to add a playlist
async function addVideo() {
    const videoUrl = urlInput.value.trim();
    if (!videoUrl) return alert('Please enter a YouTube video URL.');

    const videoId = extractVideoId(videoUrl);
    if (!videoId) return alert('Please enter a valid YouTube video URL.');

    await saveVideoUrls([videoId], 'NO PLAYLIST');
    urlInput.value = '';
}

// Event Listeners
addPlaylistButton.addEventListener('click', addPlaylist);
addVideoButton.addEventListener('click', addVideo);
document.getElementById('backButton').addEventListener('click', goBackToPlaylists);

// Restore the last view on page load
window.addEventListener('DOMContentLoaded', restoreLastView);