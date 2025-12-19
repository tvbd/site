        let playlistItems = [];
        let currentPlayingUrl = '';
        let currentView = 'playlist';
        let currentFilter = 'all';
        let resyncInterval = null;
        let hideIconsTimeout = null;
        let isStreamPlaying = false;

        const backgroundImageBase = 'https://bugsfreecdn.netlify.app/BugsfreeDefault/bg/';
        let backgroundImageIndex = parseInt(localStorage.getItem('bgIndex') || '0');
        const maxBackgroundImages = 20;

        function setBackgroundImage() {
            const imageUrl = `${backgroundImageBase}bg-default${backgroundImageIndex === 0 ? '' : backgroundImageIndex}.webp`;
            const loginPanel = document.getElementById('login-panel');
            loginPanel.style.background = `url('${imageUrl}') no-repeat center/cover`;
            backgroundImageIndex = (backgroundImageIndex + 1) % maxBackgroundImages;
            localStorage.setItem('bgIndex', backgroundImageIndex);
            loginPanel.onerror = () => {
                loginPanel.style.background = `url('https://bugsfreecdn.netlify.app/BugsfreeDefault/default-bg.webp') no-repeat center/cover`;
            };
        }

        function videovisible() {
            console.log('Hiding loading screen and showing app...');
            const loading = document.getElementById('loading');
            const app = document.getElementById('app');
            loading.style.display = 'none';
            app.style.display = 'flex';
        }

        function showNotification(message, duration = 3000) {
            console.log('Showing notification:', message);
            const notification = document.getElementById('notification');
            notification.textContent = message;
            notification.classList.add('show');
            notification.style.animation = `fadeIn 0.3s`;
            setTimeout(() => {
                notification.style.animation = `fadeOut 0.3s`;
                setTimeout(() => {
                    notification.classList.remove('show');
                    notification.style.animation = '';
                }, 300);
            }, duration);
        }

        function clearNotification() {
            const notification = document.getElementById('notification');
            notification.classList.remove('show');
            notification.style.animation = '';
        }

        function showBottomIcons() {
            const icons = document.querySelectorAll('.theme-toggle, .favorite-toggle, .history-toggle, .fullscreen-toggle, .settings-toggle, .app-info-toggle');
            icons.forEach(icon => icon.classList.add('visible'));
            clearTimeout(hideIconsTimeout);
            hideIconsTimeout = setTimeout(hideBottomIcons, 3000);
        }

        function hideBottomIcons() {
            const icons = document.querySelectorAll('.theme-toggle, .favorite-toggle, .history-toggle, .fullscreen-toggle, .settings-toggle, .app-info-toggle');
            icons.forEach(icon => icon.classList.remove('visible'));
        }

        function toggleSidebar() {
            console.log('Toggle sidebar clicked');
            const sidebar = document.getElementById('sidebar');
            sidebar.classList.toggle('open');
        }

        function toggleAppInfo() {
            const panel = document.getElementById('app-info-panel');
            panel.style.display = panel.style.display === 'block' ? 'none' : 'block';
        }

        function generateQRCode(address) {
            const qrCodeContainer = document.getElementById('qr-code');
            qrCodeContainer.innerHTML = '';
            try {
                console.log('Generating QR code for address:', address);
                QRCode.toDataURL(address, { width: 200, errorCorrectionLevel: 'H' }, (err, url) => {
                    if (err) {
                        console.error('QR code generation error:', err);
                        qrCodeContainer.innerHTML = `<p style="color: #ff4444;">Failed to generate QR code. Please copy the address manually: ${address}</p>`;
                    } else {
                        const img = document.createElement('img');
                        img.src = url;
                        qrCodeContainer.appendChild(img);
                        console.log('QR code successfully generated for address:', address);
                    }
                });
            } catch (error) {
                console.error('QR code generation error:', error);
                qrCodeContainer.innerHTML = `<p style="color: #ff4444;">Failed to generate QR code. Please copy the address manually: ${address}</p>`;
            }
        }

        function showPopupPage(page) {
            document.querySelectorAll('.popup-page').forEach(p => p.classList.remove('active'));
            const popupPage = document.getElementById(`${page}-page`);
            popupPage.classList.add('active');
            document.getElementById('app-info-panel').style.display = 'none';
        }

        function closePopup() {
            document.querySelectorAll('.popup-page').forEach(p => p.classList.remove('active'));
        }

        const cryptoData = {
            'BTC': 'Knock_to_github',
            'ETH': 'Knock_to_github',
            'USDT': 'Knock_to_github',
            'BNB': 'Knock_to_github',
            'SOL': 'Knock_to_github',
            'XRP': 'Knock_to_github',
            'ADA': 'Knock_to_github',
            'DOGE': 'Knock_to_github',
            'TRX': 'Knock_to_github',
            'PI': 'Knock_to_github'
        };

        async function loadLastPlaylist() {
            console.log('Starting loadLastPlaylist...');
            toggleSpinner(true);
            const lastPlaylist = JSON.parse(localStorage.getItem('lastPlaylist') || '{}');
            console.log('lastPlaylist from localStorage:', lastPlaylist);

            const loginPanel = document.getElementById('login-panel');
            const app = document.getElementById('app');

            if (lastPlaylist && lastPlaylist.source) {
                console.log('Found lastPlaylist, attempting to load...');
                try {
                    loginPanel.style.display = 'none';
                    app.style.display = 'flex';
                    showNotification('Loading last playlist...');
                    const success = await fetchPlaylist(lastPlaylist.source, true, lastPlaylist.name);
                    if (success && playlistItems.length > 0) {
                        console.log('Playlist loaded successfully:', playlistItems);
                        showNotification(`Playlist loaded: ${lastPlaylist.name}`);
                        videovisible();
                        initializePlayer();
                        displayPlaylist(playlistItems);
                    } else {
                        throw new Error('No valid channels loaded');
                    }
                } catch (error) {
                    console.error('Load last playlist error:', error);
                    showNotification(`Load failed: ${error.message}`);
                    loginPanel.style.display = 'flex';
                    app.style.display = 'none';
                } finally {
                    toggleSpinner(false);
                }
            } else {
                console.log('No lastPlaylist found, showing login panel');
                loginPanel.style.display = 'flex';
                app.style.display = 'none';
                toggleSpinner(false);
            }
        }

        async function login() {
            console.log('Login initiated');
            toggleSpinner(true);
            showNotification('Uploading playlist...');
            try {
                const useDefault = document.getElementById('use-default').checked;
                const defaultPlaylist = document.getElementById('default-playlist').value;
                const fileInput = document.getElementById('file-upload');
                const urlInput = document.getElementById('url-upload').value;

                // Check if user is trying to proceed without selecting a playlist or uploading a file/URL
                if (!useDefault && fileInput.files.length === 0 && !urlInput.trim()) {
                    showNotification('Please check "Use Default Playlist" or upload a file/URL to proceed.', 5000);
                    toggleSpinner(false);
                    return;
                }

                let sourceName = '';
                if (!useDefault && fileInput.files.length > 0) {
                    sourceName = fileInput.files[0].name;
                } else if (!useDefault && urlInput) {
                    try {
                        const url = new URL(urlInput);
                        sourceName = url.pathname.split('/').pop() || 'unknown.m3u';
                    } catch {
                        sourceName = urlInput.split('/').pop() || 'unknown.m3u';
                    }
                } else if (useDefault && defaultPlaylist) {
                    const url = new URL(defaultPlaylist);
                    sourceName = url.pathname.split('/').pop() || 'default.m3u';
                }

                if (!useDefault && (fileInput.files.length > 0 || urlInput.trim())) {
                    document.getElementById('login-panel').style.display = 'none';
                    document.getElementById('app').style.display = 'flex';
                    if (fileInput.files.length > 0) {
                        const file = fileInput.files[0];
                        const extension = file.name.split('.').pop().toLowerCase();
                        if (['m3u', 'json', 'txt'].includes(extension)) {
                            const text = await file.text();
                            const success = parsePlaylist(text, extension, urlInput || file.name, true, sourceName);
                            if (!success || playlistItems.length === 0) {
                                throw new Error('No valid channels loaded from file');
                            }
                            setTimeout(() => {
                                videovisible();
                                initializePlayer();
                                displayPlaylist(playlistItems);
                            }, 3000);
                        } else {
                            throw new Error('Unsupported file format');
                        }
                    } else if (urlInput) {
                        const success = await fetchPlaylist(urlInput, true, sourceName);
                        if (!success || playlistItems.length === 0) {
                            throw new Error('No valid channels loaded from URL');
                        }
                        setTimeout(() => {
                            videovisible();
                            initializePlayer();
                            displayPlaylist(playlistItems);
                        }, 3000);
                    }
                } else if (useDefault && defaultPlaylist) {
                    console.log('Loading default playlist:', defaultPlaylist);
                    document.getElementById('login-panel').style.display = 'none';
                    document.getElementById('app').style.display = 'flex';
                    const success = await fetchPlaylist(defaultPlaylist, false, sourceName);
                    if (success && playlistItems.length > 0) {
                        setTimeout(() => {
                            videovisible();
                            initializePlayer();
                            displayPlaylist(playlistItems);
                        }, 3000);
                    } else {
                        throw new Error('No valid channels loaded');
                    }
                } else {
                    showNotification('Please select a playlist or upload a file/URL');
                    toggleSpinner(false);
                    return;
                }

                setTimeout(() => {
                    console.log('Fallback: Forcing loading screen to hide after maximum timeout');
                    videovisible();
                    if (playlistItems.length > 0) {
                        initializePlayer();
                        displayPlaylist(playlistItems);
                    } else {
                        showNotification('Failed to load playlist. Please try again.');
                        document.getElementById('login-panel').style.display = 'flex';
                        document.getElementById('app').style.display = 'none';
                    }
                    toggleSpinner(false);
                }, 10000);
            } catch (error) {
                console.error('Login error:', error);
                showNotification(`Upload failed: ${error.message}`);
                document.getElementById('login-panel').style.display = 'flex';
                document.getElementById('app').style.display = 'none';
                toggleSpinner(false);
            }
        }

        async function fetchPlaylist(url, isUserUploaded = false, sourceName = '') {
            console.log('Fetching playlist:', url);
            toggleSpinner(true);
            try {
                const response = await fetch(url);
                if (!response.ok) throw new Error(`HTTP ${response.status}`);
                const text = await response.text();
                console.log('Playlist text:', text.slice(0, 100));
                const success = await parsePlaylist(text, url.split('.').pop().toLowerCase(), url, isUserUploaded, sourceName);
                if (!success) {
                    throw new Error('Failed to parse playlist');
                }
                return true;
            } catch (error) {
                console.error('Fetch error:', error);
                showNotification(`Upload failed: ${error.message}`);
                return false;
            } finally {
                toggleSpinner(false);
            }
        }

        async function parsePlaylist(text, extension, source, isUserUploaded = false, sourceName = '') {
            console.log('Parsing playlist, extension:', extension);
            toggleSpinner(true);
            try {
                playlistItems = [];
                if (extension === 'm3u') {
                    const lines = text.split('\n');
                    let currentItem = null;
                    for (const line of lines) {
                        if (line.startsWith('#EXTINF')) {
                            const nameMatch = line.match(/,(.+)/);
                            const logoMatch = line.match(/tvg-logo="([^"]+)"/);
                            currentItem = {
                                name: nameMatch ? nameMatch[1].trim() : 'Unknown',
                                logo: logoMatch ? logoMatch[1] : 'https://bugsfreecdn.netlify.app/BugsfreeDefault/default-logo.webp',
                                url: '',
                                source: source,
                                isOnline: false
                            };
                        } else if (line && !line.startsWith('#') && currentItem) {
                            currentItem.url = line.trim();
                            playlistItems.push(currentItem);
                            currentItem = null;
                        }
                    }
                } else if (extension === 'json') {
                    const data = JSON.parse(text);
                    data.forEach(item => {
                        playlistItems.push({
                            name: item.name || 'Unknown',
                            logo: item.logo || 'https://bugsfreecdn.netlify.app/BugsfreeDefault/default-logo.webp',
                            url: item.url || '',
                            source: source,
                            isOnline: false
                        });
                    });
                } else if (extension === 'txt') {
                    const lines = text.split('\n');
                    lines.forEach(line => {
                        if (line.trim()) {
                            playlistItems.push({
                                name: line.trim(),
                                logo: 'https://bugsfreecdn.netlify.app/BugsfreeDefault/default-logo.webp',
                                url: line.trim(),
                                source: source,
                                isOnline: false
                            });
                        }
                    });
                }

                console.log('Parsed items:', playlistItems);
                const statusChecks = playlistItems.map(async item => {
                    item.isOnline = await checkLinkStatus(item.url);
                    return item;
                });
                await Promise.all(statusChecks);

                if (isUserUploaded) {
                    addToHistory(source, sourceName);
                }
                currentView = 'playlist';
                currentFilter = 'all';
                updateChannelStatus();
                if (playlistItems.length > 0) {
                    showNotification(`Playlist uploaded: ${sourceName}`);
                    playChannel(playlistItems[0].url);
                    if (resyncInterval) {
                        clearInterval(resyncInterval);
                    }
                    startBackgroundResync();
                    resyncInterval = setInterval(startBackgroundResync, 5 * 60 * 1000);
                    return true;
                }
                showNotification('No valid channels loaded');
                return false;
            } catch (error) {
                console.error('Parse error:', error);
                showNotification(`Upload failed: ${error.message}`);
                return false;
            } finally {
                toggleSpinner(false);
            }
        }

        function toggleSpinner(show) {
            const spinner = document.getElementById('login-loading');
            console.log('Toggling spinner:', show);
            if (show) {
                spinner.classList.add('active');
                setTimeout(() => {
                    spinner.classList.remove('active');
                }, 5000);
            } else {
                spinner.classList.remove('active');
            }
        }

        async function checkLinkStatus(url) {
            try {
                console.log(`Checking status for URL: ${url}`);
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 5000);
                const response = await fetch(url, {
                    method: 'GET',
                    signal: controller.signal
                });
                clearTimeout(timeoutId);

                if (!response.ok) {
                    console.warn(`URL ${url} returned status: ${response.status}`);
                    return false;
                }

                const contentType = response.headers.get('Content-Type') || '';
                console.log(`Content-Type for ${url}: ${contentType}`);
                if (contentType.includes('application/vnd.apple.mpegurl') || contentType.includes('video/')) {
                    return true;
                }

                const blob = await response.blob();
                const streamSize = blob.size;
                console.log(`Stream size for ${url}: ${streamSize} bytes`);
                return streamSize > 0;
            } catch (error) {
                console.warn(`Link check failed for ${url}: ${error.message}`);
                return false;
            }
        }

        async function startBackgroundResync() {
            if (playlistItems.length > 0 && playlistItems.filter(item => !item.isOnline).length > 0) {
                await resyncOfflineChannels(true);
            }
        }

        async function resyncOfflineChannels(background = false) {
            if (!background) {
                toggleSpinner(true);
            }
            try {
                const offlineItems = playlistItems.filter(item => !item.isOnline);
                const statusChecks = offlineItems.map(async item => {
                    item.isOnline = await checkLinkStatus(item.url);
                    return item;
                });
                await Promise.all(statusChecks);
                displayPlaylist(playlistItems);
                updateChannelStatus();
                showNotification(background ? 'Background resync completed' : 'Resync completed');
            } finally {
                if (!background) {
                    toggleSpinner(false);
                }
            }
        }

        function updateChannelStatus() {
            const total = playlistItems.length;
            const online = playlistItems.filter(item => item.isOnline).length;
            const offline = total - online;
            document.getElementById('total-channels').textContent = total;
            document.getElementById('online-channels').textContent = online;
            document.getElementById('offline-channels').textContent = offline;
        }

        function filterChannels(filter) {
            currentFilter = filter;
            const buttons = document.querySelectorAll('.status-btn');
            buttons.forEach(btn => btn.classList.remove('active'));
            document.querySelector(`.status-btn[onclick="filterChannels('${filter}')"]`).classList.add('active');
            displayPlaylist(playlistItems);
        }

        function addToHistory(source, sourceName) {
            let history = JSON.parse(localStorage.getItem('playlistHistory') || '[]');
            if (!history.some(h => h.source === source)) {
                history.push({
                    name: sourceName || 'unknown.m3u',
                    source: source,
                    date: new Date().toLocaleString('en-GB', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                        hour: 'numeric',
                        minute: 'numeric',
                        hour12: true
                    })
                });
                localStorage.setItem('playlistHistory', JSON.stringify(history));
            }
            console.log('Saving lastPlaylist to localStorage:', { source, name: sourceName || 'unknown.m3u' });
            localStorage.setItem('lastPlaylist', JSON.stringify({ source, name: sourceName || 'unknown.m3u' }));
        }

        function toggleFavorites() {
            if (currentView === 'favorites') {
                currentView = 'playlist';
                loadPlaylist();
            } else {
                currentView = 'favorites';
                loadFavorites();
            }
        }

        function toggleHistory() {
            if (currentView === 'history') {
                currentView = 'playlist';
                loadPlaylist();
            } else {
                currentView = 'history';
                loadHistory();
            }
        }

        function loadHistory() {
            const history = JSON.parse(localStorage.getItem('playlistHistory') || '[]');
            displayHistory(history);
        }

        function deleteAllHistory() {
            localStorage.setItem('playlistHistory', '[]');
            localStorage.removeItem('lastPlaylist');
            if (resyncInterval) {
                clearInterval(resyncInterval);
                resyncInterval = null;
            }
            if (currentView === 'history') {
                loadHistory();
            }
            showNotification('History deleted');
        }

        function displayHistory(items) {
            const playlistContainer = document.getElementById('playlist-items');
            playlistContainer.innerHTML = '';
            items.forEach(item => {
                const div = document.createElement('div');
                div.className = 'playlist-item';
                div.innerHTML = `
                    <span>${item.name} (${item.date})</span>
                    <button class="delete-btn" data-source="${item.source}">
                        <i class="fas fa-trash"></i>
                    </button>
                    <button class="reload-btn" data-source="${item.source}">
                        <i class="fas fa-redo"></i>
                    </button>
                `;
                div.querySelector('.reload-btn').onclick = () => {
                    fetchPlaylist(item.source, true, item.name).then(success => {
                        if (success) {
                            currentView = 'playlist';
                            displayPlaylist(playlistItems);
                        }
                    });
                };
                div.querySelector('.delete-btn').onclick = () => deleteFromHistory(item.source);
                playlistContainer.appendChild(div);
            });
        }

        function deleteFromHistory(source) {
            let history = JSON.parse(localStorage.getItem('playlistHistory') || '[]');
            history = history.filter(h => h.source !== source);
            localStorage.setItem('playlistHistory', JSON.stringify(history));
            const lastPlaylist = JSON.parse(localStorage.getItem('lastPlaylist') || '{}');
            if (lastPlaylist.source === source) {
                localStorage.removeItem('lastPlaylist');
                if (resyncInterval) {
                    clearInterval(resyncInterval);
                    resyncInterval = null;
                }
            }
            loadHistory();
            showNotification('History entry deleted');
        }

        function addToFavorites(item) {
            let favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
            if (!favorites.some(f => f.url === item.url)) {
                favorites.push(item);
                localStorage.setItem('favorites', JSON.stringify(favorites));
                showNotification(`Added to favorites: ${item.name}`);
            }
        }

        function removeFromFavorites(item) {
            let favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
            favorites = favorites.filter(f => f.url !== item.url);
            localStorage.setItem('favorites', JSON.stringify(favorites));
            showNotification(`Removed from favorites: ${item.name}`);
        }

        function loadFavorites() {
            const favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
            displayPlaylist(favorites);
        }

        function loadPlaylist() {
            displayPlaylist(playlistItems);
        }

        function displayPlaylist(items, isHistory = false) {
            console.log('Displaying playlist:', items);
            const playlistContainer = document.getElementById('playlist-items');
            const favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
            playlistContainer.innerHTML = '';

            let filteredItems = items;
            if (currentView === 'playlist' && !isHistory) {
                if (currentFilter === 'online') {
                    filteredItems = items.filter(item => item.isOnline);
                } else if (currentFilter === 'offline') {
                    filteredItems = items.filter(item => !item.isOnline);
                }
            }

            filteredItems.forEach(item => {
                console.log('Rendering item:', item.name);
                const div = document.createElement('div');
                div.className = `playlist-item ${item.url === currentPlayingUrl ? 'playing' : ''}`;
                const isFavorite = favorites.some(f => f.url === item.url);
                div.innerHTML = `
                    <img src="${item.logo}" alt="${item.name}" onerror="this.src='https://bugsfreecdn.netlify.app/BugsfreeDefault/default-logo.webp'" />
                    <span>${item.name} (${item.isOnline ? 'Online' : 'Offline'})</span>
                    <button class="favorite-btn ${isFavorite ? 'active' : ''}" data-url="${item.url}">
                        <i class="fas fa-heart"></i>
                    </button>
                `;
                div.onclick = (e) => {
                    if (!e.target.closest('.favorite-btn') && !e.target.closest('.delete-btn')) {
                        playChannel(item.url);
                    }
                };
                div.querySelector('.favorite-btn').onclick = () => {
                    if (isFavorite) {
                        removeFromFavorites(item);
                    } else {
                        addToFavorites(item);
                    }
                    if (currentView === 'favorites') {
                        loadFavorites();
                    } else if (currentView === 'playlist') {
                        displayPlaylist(items, isHistory);
                    }
                };
                playlistContainer.appendChild(div);
            });
        }

        async function playChannel(url) {
            console.log('Playing channel:', url);
            toggleSpinner(true);
            clearNotification();
            isStreamPlaying = false;
            const item = playlistItems.find(item => item.url === url);
            if (item && !item.isOnline) {
                item.isOnline = await checkLinkStatus(url);
                if (!item.isOnline) {
                    showNotification('Channel offline, trying fallback.');
                    const video = document.getElementById('player');
                    const source = video.getElementsByTagName('source')[0];
                    source.src = 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8';
                    video.load();
                    video.play().then(() => {
                        isStreamPlaying = true;
                        clearNotification();
                        toggleSpinner(false);
                    }).catch(err => {
                        console.error('Playback error:', err);
                        toggleSpinner(false);
                    });
                    initializePlayer();
                    currentPlayingUrl = source.src;
                    displayPlaylist(playlistItems);
                    return;
                }
                displayPlaylist(playlistItems);
            }

            currentPlayingUrl = url;
            try {
                const video = document.getElementById('player');
                const source = video.getElementsByTagName('source')[0];
                source.src = url;
                video.load();
                video.play().then(() => {
                    isStreamPlaying = true;
                    clearNotification();
                    toggleSpinner(false);
                }).catch(err => {
                    console.error('Playback error:', err);
                    toggleSpinner(false);
                });
                initializePlayer();
                if (currentView === 'playlist') {
                    displayPlaylist(playlistItems);
                } else if (currentView === 'favorites') {
                    loadFavorites();
                }
            } catch (error) {
                console.error('Play channel error:', error);
                showNotification('Failed to play channel. Using fallback.');
                const video = document.getElementById('player');
                const source = video.getElementsByTagName('source')[0];
                source.src = 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8';
                video.load();
                video.play().then(() => {
                    isStreamPlaying = true;
                    clearNotification();
                    toggleSpinner(false);
                }).catch(err => {
                    console.error('Playback error:', err);
                    toggleSpinner(false);
                });
                initializePlayer();
                currentPlayingUrl = source.src;
                if (currentView === 'playlist') {
                    displayPlaylist(playlistItems);
                } else if (currentView === 'favorites') {
                    loadFavorites();
                }
            }
        }

        function searchChannels() {
            const query = document.getElementById('channel-search').value.toLowerCase();
            const items = document.querySelectorAll('.playlist-item');
            items.forEach(item => {
                const name = item.querySelector('span').textContent.toLowerCase();
                item.style.display = name.includes(query) ? 'flex' : 'none';
            });
        }

        async function uploadPlaylist() {
            console.log('Uploading playlist');
            toggleSpinner(true);
            showNotification('Uploading playlist...');
            try {
                const fileInput = document.getElementById('sidebar-file-upload');
                const urlInput = document.getElementById('sidebar-url-upload').value.trim();
                let sourceName = '';

                if (fileInput.files.length > 0) {
                    sourceName = fileInput.files[0].name;
                } else if (urlInput) {
                    try {
                        const url = new URL(urlInput);
                        sourceName = url.pathname.split('/').pop() || 'unknown.m3u';
                    } catch {
                        sourceName = urlInput.split('/').pop() || 'unknown.m3u';
                    }
                }

                if (fileInput.files.length > 0) {
                    const file = fileInput.files[0];
                    const extension = file.name.split('.').pop().toLowerCase();
                    if (['m3u', 'json', 'txt'].includes(extension)) {
                        const text = await file.text();
                        parsePlaylist(text, extension, urlInput || file.name, true, sourceName);
                        setTimeout(() => {
                            videovisible();
                            initializePlayer();
                            displayPlaylist(playlistItems);
                        }, 3000);
                    } else {
                        showNotification('Upload failed: Unsupported file format');
                    }
                } else if (urlInput) {
                    await fetchPlaylist(urlInput, true, sourceName);
                    setTimeout(() => {
                        videovisible();
                        initializePlayer();
                        displayPlaylist(playlistItems);
                    }, 3000);
                } else {
                    showNotification('Please select a file or enter a URL');
                }
            } catch (error) {
                console.error('Upload error:', error);
                showNotification(`Upload failed: ${error.message}`);
            } finally {
                toggleSpinner(false);
            }
        }

        async function loadDefaultPlaylist() {
            const url = document.getElementById('sidebar-default-playlist').value;
            if (url) {
                const sourceName = new URL(url).pathname.split('/').pop() || 'default.m3u';
                showNotification('Uploading playlist...');
                await fetchPlaylist(url, false, sourceName);
                setTimeout(() => {
                    videovisible();
                    initializePlayer();
                    displayPlaylist(playlistItems);
                }, 3000);
            }
        }

        function initializePlayer() {
            console.log('Initializing player');
            const video = document.querySelector('#player');
            const source = video.getElementsByTagName('source')[0].src;
            const options = {};
            video.onerror = () => {
                video.poster = 'https://bugsfreecdn.netlify.app/BugsfreeDefault/default-poster.png';
                console.error('Video error: Unable to load the video source');
            };

            if (Hls.isSupported()) {
                const config = { maxMaxBufferLength: 100 };
                const hls = new Hls(config);
                hls.loadSource(source);
                hls.on(Hls.Events.MANIFEST_PARSED, (event, data) => {
                    const levels = hls.levels.map(level => level.height);
                    options.quality = {
                        default: levels[0],
                        options: levels,
                        forced: true,
                        onChange: quality => {
                            hls.levels.forEach((level, index) => {
                                if (level.height === quality) {
                                    hls.currentLevel = index;
                                }
                            });
                        }
                    };
                    new Plyr(video, options);
                });
                hls.on(Hls.Events.ERROR, (event, data) => {
                    console.error('HLS error:', data);
                    setTimeout(() => {
                        if (!isStreamPlaying) {
                            showNotification('Error loading stream. Please try another channel.');
                        }
                    }, 2000);
                });
                hls.on(Hls.Events.LEVEL_LOADED, () => {
                    isStreamPlaying = true;
                    clearNotification();
                    toggleSpinner(false);
                });
                hls.attachMedia(video);
                window.hls = hls;
            } else {
                new Plyr(video, options);
            }
        }

        function toggleTheme() {
            const html = document.documentElement;
            const currentTheme = html.getAttribute('data-theme') || 'dark';
            html.setAttribute('data-theme', currentTheme === 'dark' ? 'light' : 'dark');
            document.querySelector('.theme-toggle i').className = currentTheme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
        }

        function toggleFullscreen() {
            const videoContainer = document.getElementById('video-container');
            if (!document.fullscreenElement) {
                videoContainer.requestFullscreen().then(() => {
                    document.querySelector('.fullscreen-toggle i').className = 'fas fa-compress';
                }).catch(err => console.error('Fullscreen error:', err));
            } else {
                document.exitFullscreen().then(() => {
                    document.querySelector('.fullscreen-toggle i').className = 'fas fa-expand';
                }).catch(err => console.error('Exit fullscreen error:', err));
            }
        }

        function toggleSettings() {
            const settingsPanel = document.getElementById('settings-panel');
            settingsPanel.style.display = settingsPanel.style.display === 'block' ? 'none' : 'block';
        }

        document.addEventListener('click', (event) => {
            const settingsPanel = document.getElementById('settings-panel');
            const settingsToggle = document.querySelector('.settings-toggle');
            const appInfoPanel = document.getElementById('app-info-panel');
            const appInfoToggle = document.querySelector('.app-info-toggle');
            if (!settingsPanel.contains(event.target) && !settingsToggle.contains(event.target)) {
                settingsPanel.style.display = 'none';
            }
            if (!appInfoPanel.contains(event.target) && !appInfoToggle.contains(event.target)) {
                appInfoPanel.style.display = 'none';
            }
        });

        function showShortcuts() {
            showNotification(
                'Keyboard Shortcuts:\n' +
                '- Arrow Right: Next channel\n' +
                '- Arrow Left: Previous channel\n' +
                '- Arrow Up: Volume up\n' +
                '- Arrow Down: Volume down\n' +
                '- F: Toggle full screen',
                5000
            );
        }

        function updateTimeDisplay() {
            const now = new Date();
            const options = { hour: 'numeric', minute: 'numeric', hour12: true };
            const time = now.toLocaleTimeString('en-US', options);
            const date = now.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
            document.getElementById('time-display').textContent = `${time} ${date}`;
        }

        function showTimeDisplay() {
            const timeDisplay = document.getElementById('time-display');
            updateTimeDisplay();
            timeDisplay.style.display = 'block';
            setTimeout(() => {
                timeDisplay.style.display = 'none';
            }, 5000);
        }

        document.getElementById('video-container').addEventListener('mousemove', showBottomIcons);
        document.getElementById('video-container').addEventListener('touchstart', () => {
            showTimeDisplay();
            showBottomIcons();
        });

        document.getElementById('app').addEventListener('mousemove', showBottomIcons);
        document.getElementById('app').addEventListener('touchstart', showBottomIcons);

        document.addEventListener('DOMContentLoaded', () => {
            console.log('DOM loaded');
            document.querySelector('.sidebar-toggle').addEventListener('click', toggleSidebar);
            setBackgroundImage();
            setInterval(setBackgroundImage, 8 * 60 * 60 * 1000);

            // Remove the event listeners for file and URL inputs since we no longer need to notify on input
            // The notification will now happen in the login() function when the user clicks "Enter Player"

            // Load the last playlist on page load
            loadLastPlaylist();

            document.getElementById('about-page').innerHTML = `
                <div class="popup-content">
                    <button class="close-btn" onclick="closePopup()">×</button>
                    <h2>About Circle TV</h2>
                    <p>Circle TV is a cutting-edge IPTV player designed to deliver seamless live TV streaming to users worldwide. Our mission is to provide a free, user-friendly platform that supports a wide range of playlists and streaming protocols, including HLS and DASH. Key features include real-time channel status checks, favorites management, viewing history, and cross-device compatibility. Developed by Bugsfree Studio, Circle TV is committed to enhancing your entertainment experience with modern design and robust functionality.</p>
                    <p><strong>Version:</strong> 1.0.0<br><strong>Contact:</strong> support@bugsfreestudio.com</p>
                </div>
            `;
            document.getElementById('uses-page').innerHTML = `
                <div class="popup-content">
                    <button class="close-btn" onclick="closePopup()">×</button>
                    <h2>Uses & Disclaimer</h2>
                    <p>Circle TV is a free IPTV player intended for personal use. Users are responsible for sourcing their own M3U playlists or streaming URLs. Bugsfree Studio does not host, distribute, or endorse any content streamed through Circle TV. We are not liable for the legality, quality, or availability of streamed content. Use of Circle TV is at your own risk, and no warranties, express or implied, are provided. By using Circle TV, you agree to comply with all applicable laws and regulations.</p>
                    <p><strong>Disclaimer:</strong> Circle TV is provided "as is." Bugsfree Studio is not responsible for any damages or losses resulting from its use. For support, contact support@bugsfreestudio.com.</p>
                </div>
            `;
            document.getElementById('donate-page').innerHTML = `
                <div class="popup-content">
                    <button class="close-btn" onclick="closePopup()">×</button>
                    <h2>Donate to Circle TV</h2>
                    <p>Your support helps keep Circle TV free and innovative. Donate using cryptocurrency to contribute to our development.</p>
                    <select id="crypto-select">
                        ${Object.keys(cryptoData).map(coin => `<option value="${coin}">${coin}</option>`).join('')}
                    </select>
                    <div id="qr-code"></div>
                    <input type="text" id="crypto-address" readonly>
                </div>
            `;
            document.getElementById('crypto-select').addEventListener('change', (e) => {
                const address = cryptoData[e.target.value];
                document.getElementById('crypto-address').value = address;
                generateQRCode(address);
            });

            const cryptoSelect = document.getElementById('crypto-select');
            const defaultAddress = cryptoData[cryptoSelect.value];
            document.getElementById('crypto-address').value = defaultAddress;
            generateQRCode(defaultAddress);
        });

        document.addEventListener('keydown', (event) => {
            const video = document.getElementById('player');
            const currentIndex = playlistItems.findIndex(item => item.url === currentPlayingUrl);

            switch (event.key) {
                case 'ArrowRight':
                    event.preventDefault();
                    if (currentIndex < playlistItems.length - 1) {
                        playChannel(playlistItems[currentIndex + 1].url);
                    }
                    break;
                case 'ArrowLeft':
                    event.preventDefault();
                    if (currentIndex > 0) {
                        playChannel(playlistItems[currentIndex - 1].url);
                    }
                    break;
                case 'ArrowUp':
                    event.preventDefault();
                    video.volume = Math.min(video.volume + 0.1, 1);
                    break;
                case 'ArrowDown':
                    event.preventDefault();
                    video.volume = Math.max(video.volume - 0.1, 0);
                    break;
                case 'f':
                case 'F':
                    event.preventDefault();
                    toggleFullscreen();
                    break;
            }
        });

        let touchStartX = 0;
        let touchStartY = 0;
        let touchEndX = 0;
        let touchEndY = 0;
        let lastTap = 0;

        document.getElementById('video-container').addEventListener('touchstart', (event) => {
            touchStartX = event.changedTouches[0].screenX;
            touchStartY = event.changedTouches[0].screenY;
            const currentTime = new Date().getTime();
            if (currentTime - lastTap < 300) {
                toggleFullscreen();
            }
            lastTap = currentTime;
        });

        document.getElementById('video-container').addEventListener('touchend', (event) => {
            touchEndX = event.changedTouches[0].screenX;
            touchEndY = event.changedTouches[0].screenY;
            handleSwipe();
        });

        function handleSwipe() {
            const deltaX = touchEndX - touchStartX;
            const deltaY = touchEndY - touchStartY;
            const video = document.getElementById('player');
            const currentIndex = playlistItems.findIndex(item => item.url === currentPlayingUrl);

            if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 50) {
                if (deltaX > 0) {
                    if (currentIndex > 0) {
                        playChannel(playlistItems[currentIndex - 1].url);
                    }
                } else {
                    if (currentIndex < playlistItems.length - 1) {
                        playChannel(playlistItems[currentIndex + 1].url);
                    }
                }
            } else if (Math.abs(deltaY) > Math.abs(deltaX) && Math.abs(deltaY) > 50) {
                if (deltaY > 0) {
                    video.volume = Math.max(video.volume - 0.1, 0);
                } else {
                    video.volume = Math.min(video.volume + 0.1, 1);
                }
            }
        }
