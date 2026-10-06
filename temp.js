
    const urlInput = document.getElementById('url-input');
    const backBtn = document.getElementById('back-btn');
    const forwardBtn = document.getElementById('forward-btn');
    const reloadBtn = document.getElementById('reload-btn');
    const newTabBtn = document.getElementById('new-tab-btn');
    const tabsContainer = document.getElementById('tabs-container');
    const searchEngine = document.getElementById('search-engine');
    const settingsBtn = document.getElementById('settings-btn');
    const tabBar = document.getElementById('tab-bar');

    let tabs = {};
    let activeTabId = null;

    function renderTabs() {
      tabsContainer.innerHTML = '';
      const tabEntries = Object.entries(tabs);

      for (let i = 0; i < tabEntries.length; i++) {
        const [id, tab] = tabEntries[i];
        const tabEl = document.createElement('div');

        let className = 'tab';
        if (id === activeTabId) className += ' active';
        // Hide separator for the tab right before the active one, and the very last tab
        if (i === tabEntries.length - 1 || (tabEntries[i+1] && tabEntries[i+1][0] === activeTabId)) {
          className += ' hide-separator';
        }
        tabEl.className = className;

        // Favicon or Spinner
        if (tab.isLoading) {
          const spinEl = document.createElement('div');
          spinEl.className = 'spinner';
          tabEl.appendChild(spinEl);
        } else if (tab.favicon) {
          const imgEl = document.createElement('img');
          imgEl.src = tab.favicon;
          imgEl.style.width = '16px';
          imgEl.style.height = '16px';
          imgEl.style.marginRight = '6px';
          tabEl.appendChild(imgEl);
        } else {
          const iconEl = document.createElement('div');
          iconEl.style.width = '16px';
          iconEl.style.height = '16px';
          iconEl.style.borderRadius = '50%';
          iconEl.style.background = '#ccc';
          iconEl.style.flexShrink = '0';
          iconEl.style.marginRight = '6px';
          tabEl.appendChild(iconEl);
        }

        const titleEl = document.createElement('div');
        titleEl.className = 'tab-title';
        titleEl.innerText = tab.title || 'New Tab';

        const closeEl = document.createElement('div');
        closeEl.className = 'tab-close';
        closeEl.innerHTML = '&times;';
        closeEl.onclick = (e) => {
          e.stopPropagation();
          window.browserAPI.closeTab(id);
        };

        tabEl.onclick = () => {
          window.browserAPI.switchTab(id);
          activeTabId = id;
          renderTabs();
          urlInput.value = tabs[id].url || '';
        };

        tabEl.appendChild(titleEl);
        tabEl.appendChild(closeEl);
        tabsContainer.appendChild(tabEl);
      }
    }

    window.browserAPI.onTabCreated((id) => {
      tabs[id] = { url: 'https://www.google.com', title: 'Loading...' };
      activeTabId = id;
      renderTabs();
      // Auto-focus URL bar so user can start typing immediately
      setTimeout(() => { urlInput.focus(); urlInput.select(); }, 100);
    });

    window.browserAPI.onTabClosed((id) => {
      delete tabs[id];
      renderTabs();
    });

    if (window.browserAPI.onTabSwitched) {
      window.browserAPI.onTabSwitched((id) => {
        if (tabs[id]) {
          activeTabId = id;
          renderTabs();
          urlInput.value = tabs[id].url || '';
        }
      });
    }

    window.browserAPI.onUrlChanged((id, url) => {
      if (tabs[id]) {
        tabs[id].url = url;
        // basic history logging
        window._historyLog = window._historyLog || [];
        if (window._historyLog[window._historyLog.length-1] !== url) {
          window._historyLog.push(url);
        }
        if (id === activeTabId) {
          urlInput.value = url;
        }
      }
    });

    window.browserAPI.onTitleChanged((id, title) => {
      if (tabs[id]) {
        tabs[id].title = title;
        renderTabs();
      }
    });

    let isCreatingTab = false;
    newTabBtn.onclick = () => {
      if (isCreatingTab) return;
      isCreatingTab = true;
      window.browserAPI.newTab();
      setTimeout(() => isCreatingTab = false, 300);
    };

    function isUrl(string) {
      try {
        new URL(string);
        return true;
      } catch (_) {
        const domainPattern = /^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        return domainPattern.test(string) || string.startsWith('localhost:');
      }
    }

    function getSearchUrl(query, engine) {
      const encodedQuery = encodeURIComponent(query);
      if (engine === 'yahoo') {
        return 'https://search.yahoo.com/search?p=' + encodedQuery;
      } else if (engine === 'duckduckgo') {
        return 'https://duckduckgo.com/?q=' + encodedQuery;
      }
      return 'https://www.google.com/search?q=' + encodedQuery;
    }

    urlInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        let input = urlInput.value.trim();
        if (isUrl(input)) {
           window.browserAPI.navigateTo(input);
        } else {
           window.browserAPI.navigateTo(getSearchUrl(input, searchEngine.value));
        }
      }
    });

    backBtn.addEventListener('click', () => { window.browserAPI.goBack(); });
    forwardBtn.addEventListener('click', () => { window.browserAPI.goForward(); });
    reloadBtn.addEventListener('click', () => { window.browserAPI.reload(); });
    searchEngine.addEventListener('change', () => { window.browserAPI.reload(); });

    // Settings Toggle Logic
    const settingsPanel = document.getElementById('settings-panel');
    let settingsOpen = false;

    function openSettings() {
      settingsOpen = true;
      settingsPanel.style.display = 'block';
      window.browserAPI.toggleSettingsPanel(true);
    }

    function closeSettings() {
      settingsOpen = false;
      settingsPanel.style.display = 'none';
      window.browserAPI.toggleSettingsPanel(false);
    }

    settingsBtn.addEventListener('click', () => {
      if (settingsOpen) { closeSettings(); } else { openSettings(); }
    });

    window.browserAPI.onOpenSettings(() => {
      if (settingsOpen) { closeSettings(); } else { openSettings(); }
    });

    const togglePapyrus = document.getElementById('toggle-papyrus');
    const toggleComicSans = document.getElementById('toggle-comicsans');
    const toggleAtom = document.getElementById('toggle-atom');
    const toggleCat = document.getElementById('toggle-cat');
    const toggleScience = document.getElementById('toggle-science');

    document.getElementById('import-bookmarks-btn').addEventListener('click', () => {
      window.browserAPI.importBookmarks();
    });

    document.getElementById('view-history-btn').addEventListener('click', () => {
      alert("History Tracker: \\n" + (window._historyLog || []).slice(-10).join('\\n'));
    });

    window.browserAPI.onBookmarksImported((urls) => {
      alert('Imported ' + urls.length + ' bookmarks from Chrome!');
      console.log(urls);
    });

    if (window.browserAPI.onTargetUrlChanged) {
      window.browserAPI.onTargetUrlChanged((url) => {
        const bar = document.getElementById('hover-url-bar');
        if (url) {
          bar.innerText = url;
          bar.style.display = 'block';
        } else {
          bar.style.display = 'none';
        }
      });
    }

    if (window.browserAPI.onLoadingState) {
      window.browserAPI.onLoadingState((id, isLoading) => {
        if (tabs[id]) {
          tabs[id].isLoading = isLoading;
          renderTabs();
        }
      });
    }

    if (window.browserAPI.onFaviconChanged) {
      window.browserAPI.onFaviconChanged((id, favicon) => {
        if (tabs[id]) {
          tabs[id].favicon = favicon;
          renderTabs();
        }
      });
    }

    let downloadTimeout;
    if (window.browserAPI.onDownloadStarted) {
      const dBar = document.getElementById('downloads-bar');
      window.browserAPI.onDownloadStarted((filename) => {
        dBar.style.display = 'flex';
        dBar.innerHTML = '<div class="download-item">Downloading: ' + filename + '...</div>';
      });
      window.browserAPI.onDownloadProgress((filename, progress) => {
        dBar.innerHTML = '<div class="download-item">Downloading: ' + filename + ' (' + (progress === 'paused' ? 'Paused' : Math.round(progress*100)+'%') + ')</div>';
      });
      window.browserAPI.onDownloadCompleted((filename, path) => {
        dBar.innerHTML = '<div class="download-item" style="cursor:pointer;" onclick="this.parentElement.style.display=\'none\'">Finished: ' + filename + ' (Click to dismiss)</div>';
        clearTimeout(downloadTimeout);
        downloadTimeout = setTimeout(() => { dBar.style.display = 'none'; }, 5000);
      });
      window.browserAPI.onDownloadFailed((filename) => {
        dBar.innerHTML = '<div class="download-item" style="color:red;cursor:pointer;" onclick="this.parentElement.style.display=\'none\'">Failed: ' + filename + '</div>';
      });
    }

    togglePapyrus.addEventListener('change', (e) => {
      window.browserAPI.toggleSetting('papyrus', e.target.checked);
      if (e.target.checked) {
        toggleComicSans.checked = false;
        window.browserAPI.toggleSetting('comicsans', false);
      }
    });

    toggleComicSans.addEventListener('change', (e) => {
      window.browserAPI.toggleSetting('comicsans', e.target.checked);
      if (e.target.checked) {
        togglePapyrus.checked = false;
        window.browserAPI.toggleSetting('papyrus', false);
      }
    });

    toggleAtom.addEventListener('change', (e) => {
      window.browserAPI.toggleSetting('atom', e.target.checked);
    });

    toggleCat.addEventListener('change', (e) => {
      window.browserAPI.toggleSetting('cat', e.target.checked);
    });

    toggleScience.addEventListener('change', (e) => {
      document.getElementById('science-lab').style.display = e.target.checked ? 'flex' : 'none';
      window.browserAPI.toggleSetting('science', e.target.checked);
    });

    // Science Lab logic
    function createBubbles(container) {
      for(let i=0; i<6; i++) {
        let b = document.createElement('div');
        b.className = 'bubble';
        b.style.width = b.style.height = (Math.random()*5 + 2) + 'px';
        b.style.left = (Math.random()*80 + 10) + '%';
        b.style.animationDuration = (Math.random()*1.5 + 1) + 's';
        b.style.animationDelay = (Math.random()*2) + 's';
        container.appendChild(b);
      }
    }
    document.querySelectorAll('.beaker-tall, .beaker-wide').forEach(b => createBubbles(b));

    window.mixChemicals = function(el) {
      const colors = ['#e74c3c', '#3498db', '#2ecc71', '#9b59b6', '#f1c40f', '#e67e22', '#1abc9c', '#ff6b81'];
      const liquid = el.querySelector('.liquid');
      let next = colors[Math.floor(Math.random()*colors.length)];
      liquid.style.backgroundColor = next;
    };

    // Generate Periodic Table
    const ptContainer = document.getElementById('periodic-table');

    const ptColors = {
      nonmetal: '#a0e6ff',
      noble: '#ffc0cb',
      alkali: '#ffb347',
      alkaline: '#fdfd96',
      metalloid: '#98fb98',
      halogen: '#ffb6c1',
      transition: '#d3d3d3',
      postTransition: '#c1ffc1'
    };

    const elements = [
      { n: 1, sym: 'H', c: 1, r: 1, type: 'nonmetal' }, { n: 2, sym: 'He', c: 18, r: 1, type: 'noble' },
      { n: 3, sym: 'Li', c: 1, r: 2, type: 'alkali' }, { n: 4, sym: 'Be', c: 2, r: 2, type: 'alkaline' },
      { n: 5, sym: 'B', c: 13, r: 2, type: 'metalloid' }, { n: 6, sym: 'C', c: 14, r: 2, type: 'nonmetal' }, { n: 7, sym: 'N', c: 15, r: 2, type: 'nonmetal' }, { n: 8, sym: 'O', c: 16, r: 2, type: 'nonmetal' }, { n: 9, sym: 'F', c: 17, r: 2, type: 'halogen' }, { n: 10, sym: 'Ne', c: 18, r: 2, type: 'noble' },
      { n: 11, sym: 'Na', c: 1, r: 3, type: 'alkali' }, { n: 12, sym: 'Mg', c: 2, r: 3, type: 'alkaline' },
      { n: 13, sym: 'Al', c: 13, r: 3, type: 'postTransition' }, { n: 14, sym: 'Si', c: 14, r: 3, type: 'metalloid' }, { n: 15, sym: 'P', c: 15, r: 3, type: 'nonmetal' }, { n: 16, sym: 'S', c: 16, r: 3, type: 'nonmetal' }, { n: 17, sym: 'Cl', c: 17, r: 3, type: 'halogen' }, { n: 18, sym: 'Ar', c: 18, r: 3, type: 'noble' },
      { n: 19, sym: 'K', c: 1, r: 4, type: 'alkali' }, { n: 20, sym: 'Ca', c: 2, r: 4, type: 'alkaline' },
      { n: 21, sym: 'Sc', c: 3, r: 4, type: 'transition' }, { n: 22, sym: 'Ti', c: 4, r: 4, type: 'transition' }, { n: 23, sym: 'V', c: 5, r: 4, type: 'transition' }, { n: 24, sym: 'Cr', c: 6, r: 4, type: 'transition' }, { n: 25, sym: 'Mn', c: 7, r: 4, type: 'transition' }, { n: 26, sym: 'Fe', c: 8, r: 4, type: 'transition' }, { n: 27, sym: 'Co', c: 9, r: 4, type: 'transition' }, { n: 28, sym: 'Ni', c: 10, r: 4, type: 'transition' }, { n: 29, sym: 'Cu', c: 11, r: 4, type: 'transition' }, { n: 30, sym: 'Zn', c: 12, r: 4, type: 'transition' }, { n: 31, sym: 'Ga', c: 13, r: 4, type: 'postTransition' }, { n: 32, sym: 'Ge', c: 14, r: 4, type: 'metalloid' }, { n: 33, sym: 'As', c: 15, r: 4, type: 'metalloid' }, { n: 34, sym: 'Se', c: 16, r: 4, type: 'nonmetal' }, { n: 35, sym: 'Br', c: 17, r: 4, type: 'halogen' }, { n: 36, sym: 'Kr', c: 18, r: 4, type: 'noble' }
    ];

    function getContrastYIQ(hexcolor){
        if (hexcolor.startsWith('#')) hexcolor = hexcolor.slice(1);
        var r = parseInt(hexcolor.substr(0,2),16);
        var g = parseInt(hexcolor.substr(2,2),16);
        var b = parseInt(hexcolor.substr(4,2),16);
        var yiq = ((r*299)+(g*587)+(b*114))/1000;
        return (yiq >= 128) ? 'black' : 'white';
    }

    for (let r = 1; r <= 4; r++) {
      for (let c = 1; c <= 18; c++) {
        const el = elements.find(e => e.r === r && e.c === c);
        const cell = document.createElement('div');
        if (el) {
          const bgColor = ptColors[el.type] || '#fff';
          cell.className = 'pt-element';
          cell.style.backgroundColor = bgColor;
          cell.innerHTML = '<span class="pt-number">' + el.n + '</span><span class="pt-symbol">' + el.sym + '</span>';
          cell.title = 'Atomic Number: ' + el.n;

          cell.onclick = () => {
            document.documentElement.style.setProperty('--theme-color', bgColor);
            document.documentElement.style.setProperty('--theme-text', getContrastYIQ(bgColor));
            // Send element data to main process for atom mode
            window.browserAPI.selectElement(el.n, bgColor);
          };
        } else {
          cell.className = 'pt-empty';
        }
        ptContainer.appendChild(cell);
      }
    }

    // Notify main process that the UI is ready
    window.browserAPI.appReady();
