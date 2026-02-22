(function() {
  // --- РљРћРќР¤РР“РЈР РђР¦РРЇ ---
  const PAGE_SIZE_REACTIONS = 100;
  const PAGE_SIZE_COMMENTS = 50;
  const PAGE_SIZE_REPOSTS = 10;
  const MAX_PAGES = 50;
  const MAX_PEOPLE_PAGES = 100;
  const MAX_JOB_PAGES = 40; // РњР°РєСЃРёРјСѓРј СЃС‚СЂР°РЅРёС† РІР°РєР°РЅСЃРёР№
  const REACTION_TYPES = ['LIKE', 'PRAISE', 'EMPATHY', 'INTEREST', 'ENTERTAINMENT', 'MAYBE'];

  let state = { postUrn: null, socialDetailUrn: null, shareUrn: null };
  let isScrapingPeople = false;
  let isScrapingConnections = false;
  let isScrapingJobs = false; // Р¤Р»Р°Рі РґР»СЏ РїР°СЂСЃРёРЅРіР° РІР°РєР°РЅСЃРёР№
  let isScrapingProfiles = false;
  const FIGHTERS_CACHE_KEY = 'li_parser_fighters_cache_v1';
  const PROFILE_FETCH_DELAY_MIN = 900;
  const PROFILE_FETCH_DELAY_MAX = 1800;

  // --- 1. UI (РРќРўР•Р Р¤Р•Р™РЎ) ---
  const PANEL_ID = 'li-scraper-panel';
  const oldPanel = document.getElementById(PANEL_ID);
  if (oldPanel) oldPanel.remove();

  function createEl(tag, className = '', text = '') {
      const el = document.createElement(tag);
      if (className) el.className = className;
      if (text) el.innerHTML = text;
      return el;
  }

  const panel = createEl('div');
  panel.id = PANEL_ID;

  // HEADER
  const header = createEl('div', 'lip-header');
  const titleArea = createEl('div', '', 'рџ”Ґ LinkedIn Parser'); 
  
  const resetBtn = createEl('button', 'lip-reset-btn', 'рџ”„ РЎР±СЂРѕСЃ');
  resetBtn.title = "РћС‡РёСЃС‚РёС‚СЊ С‚РµРєСѓС‰РёРµ ID РїРѕСЃС‚РѕРІ";
  resetBtn.onclick = (e) => {
      e.stopPropagation(); 
      resetState();
  };
  
  const headerControls = createEl('div', '', '');
  headerControls.style.display = 'flex';
  headerControls.style.alignItems = 'center';
  
  const indicator = createEl('div', '', '');
  Object.assign(indicator.style, { width: '8px', height: '8px', borderRadius: '50%', background: '#00ff00', boxShadow: '0 0 5px #00ff00', marginRight: '5px' });
  
  headerControls.appendChild(indicator);
  headerControls.appendChild(resetBtn);
  
  header.appendChild(titleArea);
  header.appendChild(headerControls);
  panel.appendChild(header);

  // BODY
  const body = createEl('div', 'lip-body');

  const statusLikes = createEl('div', 'lip-status', 'Р–РґСѓ РєР»РёРєР° РїРѕ Р»Р°Р№РєР°Рј...');
  body.appendChild(statusLikes);

  const statusComments = createEl('div', 'lip-status', 'Р–РґСѓ РєР»РёРєР° РїРѕ "Comments"...');
  body.appendChild(statusComments);

  const statusReposts = createEl('div', 'lip-status', 'Р–РґСѓ РєР»РёРєР° РїРѕ "Reposts"...');
  body.appendChild(statusReposts);

  const statusPeople = createEl('div', 'lip-status', 'Р–РґСѓ СЃС‚СЂР°РЅРёС†Сѓ РїРѕРёСЃРєР° Р»СЋРґРµР№...');
  body.appendChild(statusPeople);

  const statusConnections = createEl('div', 'lip-status', 'Р–РґСѓ СЃС‚СЂР°РЅРёС†Сѓ РєРѕРЅРЅРµРєС‚РѕРІ...');
  body.appendChild(statusConnections);

  const statusJobs = createEl('div', 'lip-status', 'Р–РґСѓ СЃС‚СЂР°РЅРёС†Сѓ РІР°РєР°РЅСЃРёР№...');
  body.appendChild(statusJobs);

  const statusProfiles = createEl('div', 'lip-status', 'Р–РґСѓ Р±Р°Р·Сѓ Р±РѕР№С†РѕРІ РёР· Р±Р»РѕРєР° 4...');
  body.appendChild(statusProfiles);

  // BUTTONS
  const btnLikes = createEl('button', 'lip-btn', 'рџ‘Ќ РЎРѕР±СЂР°С‚СЊ Р›Р°Р№РєРё');
  btnLikes.disabled = true;
  body.appendChild(btnLikes);

  const btnComments = createEl('button', 'lip-btn', 'рџ’¬ РЎРѕР±СЂР°С‚СЊ РљРѕРјРјРµРЅС‚Р°СЂРёРё');
  btnComments.disabled = true;
  body.appendChild(btnComments);

  const btnReposts = createEl('button', 'lip-btn', 'рџ”„ РЎРѕР±СЂР°С‚СЊ Р РµРїРѕСЃС‚С‹');
  btnReposts.disabled = true;
  body.appendChild(btnReposts);

  const btnPeople = createEl('button', 'lip-btn', 'рџ¤јвЂЌв™‚пёЏ РЎРѕР±СЂР°С‚СЊ Р‘РѕР№С†РѕРІ');
  btnPeople.disabled = true;
  body.appendChild(btnPeople);

  const btnConnections = createEl('button', 'lip-btn', 'рџ¤ќ РЎРѕР±СЂР°С‚СЊ РљРѕРЅРЅРµРєС‚С‹');
  btnConnections.disabled = true;
  body.appendChild(btnConnections);

  const btnJobs = createEl('button', 'lip-btn', 'рџ’ј РЎРѕР±СЂР°С‚СЊ Р’Р°РєР°РЅСЃРёРё');
  btnJobs.disabled = true;
  body.appendChild(btnJobs);

  const btnProfiles = createEl('button', 'lip-btn', 'рџ§  Р Р°СЃС€РёСЂРёС‚СЊ Р‘РѕР№С†РѕРІ (РїСЂРѕС„РёР»Рё)');
  btnProfiles.disabled = true;
  body.appendChild(btnProfiles);

  const contactBtn = createEl('a', 'lip-contact-btn', 'вњ€пёЏ РЎРІСЏР·Р°С‚СЊСЃСЏ (Telegram)');
  contactBtn.href = "https://t.me/EcommerceGr";
  contactBtn.target = "_blank";
  body.appendChild(contactBtn);

  // PROGRESS BAR
  const progressArea = createEl('div', 'lip-progress-area');
  const progressBarBg = createEl('div', 'lip-progress-bg');
  const progressFill = createEl('div', 'lip-progress-fill');
  const progressText = createEl('div', 'lip-progress-text', '');
  
  progressBarBg.appendChild(progressFill);
  progressArea.appendChild(progressBarBg);
  progressArea.appendChild(progressText);
  body.appendChild(progressArea);
  
  panel.appendChild(body);
  document.body.appendChild(panel);

  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
  const sleepRandom = (minMs, maxMs) => sleep(randomInt(minMs, maxMs));

  function normalizeProfileUrl(url) {
      if (!url) return '';
      try {
          const u = new URL(url, window.location.origin);
          if (!u.pathname.includes('/in/')) return '';
          return `${u.origin}${u.pathname}`.replace(/\/+$/, '');
      } catch (e) {
          return '';
      }
  }

  function loadFightersCache() {
      try {
          const raw = localStorage.getItem(FIGHTERS_CACHE_KEY);
          if (!raw) return [];
          const parsed = JSON.parse(raw);
          if (!Array.isArray(parsed)) return [];
          return parsed.filter(x => x && typeof x === 'object');
      } catch (e) {
          return [];
      }
  }

  function saveFightersCache(rows) {
      try {
          localStorage.setItem(FIGHTERS_CACHE_KEY, JSON.stringify(rows || []));
      } catch (e) {}
  }

  function refreshProfilesButtonState() {
      const cached = loadFightersCache();
      if (cached.length > 0 && !isScrapingProfiles) {
          btnProfiles.disabled = false;
          btnProfiles.classList.add('active');
          statusProfiles.classList.add('ready');
          statusProfiles.innerHTML = `✅ <b>Профили</b>: база бойцов готова (${cached.length})`;
          btnProfiles.innerText = '🧠 Расширить Бойцов (профили)';
      } else if (!isScrapingProfiles) {
          btnProfiles.disabled = true;
          btnProfiles.classList.remove('active');
          statusProfiles.className = 'lip-status';
          statusProfiles.innerHTML = 'Жду базу бойцов из блока 4...';
          btnProfiles.innerText = '🧠 Расширить Бойцов (профили)';
      }
  }

  // --- Р›РћР“РРљРђ РџР•Р Р•РўРђРЎРљРР’РђРќРРЇ ---
  let isDragging = false;
  let dragOffsetX = 0;
  let dragOffsetY = 0;

  header.onmousedown = function(e) {
      if (e.target.tagName === 'BUTTON') return;
      
      isDragging = true;
      const rect = panel.getBoundingClientRect();
      dragOffsetX = e.clientX - rect.left;
      dragOffsetY = e.clientY - rect.top;
      header.style.cursor = 'grabbing';
  };

  document.onmousemove = function(e) {
      if (!isDragging) return;
      e.preventDefault();
      
      const newX = e.clientX - dragOffsetX;
      const newY = e.clientY - dragOffsetY;

      panel.style.left = newX + 'px';
      panel.style.top = newY + 'px';
      panel.style.right = 'auto'; 
  };

  document.onmouseup = function() {
      isDragging = false;
      header.style.cursor = 'move';
  };

  // --- 2. Р›РћР“РРљРђ РџРђР РЎРРќР“Рђ ---

  function resetState() {
      state = { postUrn: null, socialDetailUrn: null, shareUrn: null };
      isScrapingPeople = false;
      isScrapingConnections = false;
      isScrapingJobs = false;
      
      statusLikes.innerHTML = 'Р–РґСѓ РєР»РёРєР° РїРѕ Р»Р°Р№РєР°Рј...';
      statusLikes.className = 'lip-status';
      btnLikes.disabled = true;
      btnLikes.classList.remove('active');
      btnLikes.innerText = 'рџ‘Ќ РЎРѕР±СЂР°С‚СЊ Р›Р°Р№РєРё';

      statusComments.innerHTML = 'Р–РґСѓ РєР»РёРєР° РїРѕ "Comments"...';
      statusComments.className = 'lip-status';
      btnComments.disabled = true;
      btnComments.classList.remove('active');
      btnComments.innerText = 'рџ’¬ РЎРѕР±СЂР°С‚СЊ РљРѕРјРјРµРЅС‚Р°СЂРёРё';

      statusReposts.innerHTML = 'Р–РґСѓ РєР»РёРєР° РїРѕ "Reposts"...';
      statusReposts.className = 'lip-status';
      btnReposts.disabled = true;
      btnReposts.classList.remove('active');
      btnReposts.innerText = 'рџ”„ РЎРѕР±СЂР°С‚СЊ Р РµРїРѕСЃС‚С‹';

      statusPeople.innerHTML = 'Р–РґСѓ СЃС‚СЂР°РЅРёС†Сѓ РїРѕРёСЃРєР° Р»СЋРґРµР№...';
      statusPeople.className = 'lip-status';
      btnPeople.disabled = false;
      btnPeople.classList.remove('active');
      btnPeople.innerText = 'рџ¤јвЂЌв™‚пёЏ РЎРѕР±СЂР°С‚СЊ Р‘РѕР№С†РѕРІ';

      statusConnections.innerHTML = 'Р–РґСѓ СЃС‚СЂР°РЅРёС†Сѓ РєРѕРЅРЅРµРєС‚РѕРІ...';
      statusConnections.className = 'lip-status';
      btnConnections.disabled = true;
      btnConnections.classList.remove('active');
      btnConnections.innerText = 'рџ¤ќ РЎРѕР±СЂР°С‚СЊ РљРѕРЅРЅРµРєС‚С‹';

      statusJobs.innerHTML = 'Р–РґСѓ СЃС‚СЂР°РЅРёС†Сѓ РІР°РєР°РЅСЃРёР№...';
      statusJobs.className = 'lip-status';
      btnJobs.disabled = true;
      btnJobs.classList.remove('active');
      btnJobs.innerText = 'рџ’ј РЎРѕР±СЂР°С‚СЊ Р’Р°РєР°РЅСЃРёРё';

      statusProfiles.innerHTML = 'Жду базу бойцов из блока 4...';
      statusProfiles.className = 'lip-status';
      btnProfiles.disabled = true;
      btnProfiles.classList.remove('active');
      btnProfiles.innerText = '🧠 Расширить Бойцов (профили)';

      progressArea.style.display = 'none';
      console.log("рџ”„ РЎРѕСЃС‚РѕСЏРЅРёРµ СЃР±СЂРѕС€РµРЅРѕ.");
      refreshProfilesButtonState();
  }

  function updateUi(type) {
      if (type === 'LIKES') {
          statusLikes.innerHTML = `вњ… <b>Р›Р°Р№РєРё</b>: Р“РѕС‚РѕРІ СЃРѕР±СЂР°С‚СЊ!`;
          statusLikes.classList.add('ready');
          btnLikes.disabled = false;
          btnLikes.classList.add('active');
          btnLikes.innerText = 'рџ‘Ќ РќР°Р¶РјРё, С‡С‚РѕР±С‹ СЃРєР°С‡Р°С‚СЊ';
      }
      if (type === 'COMMENTS') {
          statusComments.innerHTML = `вњ… <b>РљРѕРјРјРµРЅС‚С‹</b>: Р“РѕС‚РѕРІ СЃРѕР±СЂР°С‚СЊ!`;
          statusComments.classList.add('ready');
          btnComments.disabled = false;
          btnComments.classList.add('active');
          btnComments.innerText = 'рџ’¬ РќР°Р¶РјРё, С‡С‚РѕР±С‹ СЃРєР°С‡Р°С‚СЊ';
      }
      if (type === 'REPOSTS') {
          statusReposts.innerHTML = `вњ… <b>Р РµРїРѕСЃС‚С‹</b>: Р“РѕС‚РѕРІ СЃРѕР±СЂР°С‚СЊ!`;
          statusReposts.classList.add('ready');
          btnReposts.disabled = false;
          btnReposts.classList.add('active');
          btnReposts.innerText = 'рџ”„ РќР°Р¶РјРё, С‡С‚РѕР±С‹ СЃРєР°С‡Р°С‚СЊ';
      }
      if (type === 'PEOPLE') {
          statusPeople.innerHTML = `вњ… <b>Р‘РѕР№С†С‹</b>: Р’РёР¶Сѓ СЃС‚СЂР°РЅРёС†Сѓ РїРѕРёСЃРєР°!`;
          statusPeople.classList.add('ready');
          if (!isScrapingPeople) {
              btnPeople.disabled = false;
              btnPeople.classList.add('active');
              btnPeople.innerText = 'рџ¤јвЂЌв™‚пёЏ РЎРѕР±СЂР°С‚СЊ Р‘РѕР№С†РѕРІ';
          }
      }
      if (type === 'CONNECTIONS') {
          statusConnections.innerHTML = `вњ… <b>РљРѕРЅРЅРµРєС‚С‹</b>: Р’РёР¶Сѓ СЃРїРёСЃРѕРє!`;
          statusConnections.classList.add('ready');
          if (!isScrapingConnections) {
              btnConnections.disabled = false;
              btnConnections.classList.add('active');
              btnConnections.innerText = 'рџ¤ќ РЎРѕР±СЂР°С‚СЊ РљРѕРЅРЅРµРєС‚С‹';
          }
      }
      if (type === 'JOBS') {
          statusJobs.innerHTML = `вњ… <b>Р’Р°РєР°РЅСЃРёРё</b>: Р’РёР¶Сѓ СЃС‚СЂР°РЅРёС†Сѓ!`;
          statusJobs.classList.add('ready');
          if (!isScrapingJobs) {
              btnJobs.disabled = false;
              btnJobs.classList.add('active');
              btnJobs.innerText = 'рџ’ј РЎРѕР±СЂР°С‚СЊ Р’Р°РєР°РЅСЃРёРё';
          }
      }
      if (type === 'PROFILES') {
          refreshProfilesButtonState();
      }
  }

  function checkUrl(url) {
      try {
          const decoded = decodeURIComponent(url);
          
          if (decoded.match(/threadUrn:(urn:li:[a-zA-Z]+:\d+)/)) {
              state.postUrn = RegExp.$1;
              updateUi('LIKES');
          }
          
          if (decoded.match(/socialDetailUrn:(urn:li:fsd_socialDetail:\([^)]+\))/)) {
              state.socialDetailUrn = RegExp.$1;
              updateUi('COMMENTS');
          }
          
          if (decoded.match(/targetUrn:(urn:li:share:\d+)/)) {
              state.shareUrn = RegExp.$1;
              updateUi('REPOSTS');
          }
      } catch (e) {}
  }

  // --- РђРІС‚Рѕ-РґРµС‚РµРєС‚РѕСЂ СЃС‚СЂР°РЅРёС† ---
  setInterval(() => {
      // 1. РџРѕРёСЃРє Р›СЋРґРµР№
      const searchCards = document.querySelectorAll('div[data-view-name="people-search-result"]');
      if (searchCards.length > 0 && !isScrapingPeople) {
           if (btnPeople.disabled) updateUi('PEOPLE');
      } else if (searchCards.length === 0 && !btnPeople.disabled && !isScrapingPeople) {
          statusPeople.innerHTML = 'Р–РґСѓ СЃС‚СЂР°РЅРёС†Сѓ РїРѕРёСЃРєР° Р»СЋРґРµР№...';
          statusPeople.className = 'lip-status';
          btnPeople.disabled = true;
          btnPeople.classList.remove('active');
          btnPeople.innerText = 'рџ¤јвЂЌв™‚пёЏ РЎРѕР±СЂР°С‚СЊ Р‘РѕР№С†РѕРІ';
      }

      // 2. Р›РёС‡РЅС‹Рµ РљРѕРЅРЅРµРєС‚С‹
      const connectionsList = document.querySelector('div[data-view-name="connections-list"]');
      if (connectionsList && !isScrapingConnections) {
           if (btnConnections.disabled) updateUi('CONNECTIONS');
      } else if (!connectionsList && !btnConnections.disabled && !isScrapingConnections) {
          statusConnections.innerHTML = 'Р–РґСѓ СЃС‚СЂР°РЅРёС†Сѓ РєРѕРЅРЅРµРєС‚РѕРІ...';
          statusConnections.className = 'lip-status';
          btnConnections.disabled = true;
          btnConnections.classList.remove('active');
          btnConnections.innerText = 'рџ¤ќ РЎРѕР±СЂР°С‚СЊ РљРѕРЅРЅРµРєС‚С‹';
      }

      // 3. Р’Р°РєР°РЅСЃРёРё
      const jobsPage = window.location.href.includes('/jobs/search/');
      const jobCards = document.querySelectorAll('li[data-occludable-job-id]');
      if (jobsPage && jobCards.length > 0 && !isScrapingJobs) {
           if (btnJobs.disabled) updateUi('JOBS');
      } else if ((!jobsPage || jobCards.length === 0) && !btnJobs.disabled && !isScrapingJobs) {
          statusJobs.innerHTML = 'Р–РґСѓ СЃС‚СЂР°РЅРёС†Сѓ РІР°РєР°РЅСЃРёР№...';
          statusJobs.className = 'lip-status';
          btnJobs.disabled = true;
          btnJobs.classList.remove('active');
          btnJobs.innerText = 'рџ’ј РЎРѕР±СЂР°С‚СЊ Р’Р°РєР°РЅСЃРёРё';
      }

      refreshProfilesButtonState();

  }, 2000); 

  // РџРµСЂРµС…РІР°С‚С‡РёРєРё
  const originalFetch = window.fetch;
  window.fetch = async function(...args) {
      const url = typeof args[0] === 'string' ? args[0] : (args[0]?.url || '');
      if (url.includes('voyager/api/graphql')) checkUrl(url);
      return originalFetch.apply(this, args);
  };

  const originalOpen = XMLHttpRequest.prototype.open;
  XMLHttpRequest.prototype.open = function(method, url) {
      if (typeof url === 'string' && url.includes('voyager/api/graphql')) checkUrl(url);
      return originalOpen.apply(this, arguments);
  };

  // --- 3. РЎРљР РђРџР•Р Р« API ---
  async function scrapeLikes() {
      if(!state.postUrn) return;
      btnLikes.disabled = true;
      showProgress(0, 'Р—Р°РїСѓСЃРє...');
      let allData = [];
      const csrf = getCsrf();

      for (let i = 0; i < REACTION_TYPES.length; i++) {
          const r = REACTION_TYPES[i];
          showProgress((i / REACTION_TYPES.length) * 100, `Р›Р°Р№РєРё: ${r}`);
          for (let page = 0; page < MAX_PAGES; page++) {
              const start = page * PAGE_SIZE_REACTIONS;
              const encodedUrn = encodeURIComponent(state.postUrn).replace(/\(/g, '%28').replace(/\)/g, '%29');
              const url = `https://www.linkedin.com/voyager/api/graphql?variables=(count:${PAGE_SIZE_REACTIONS},start:${start},threadUrn:${encodedUrn},reactionType:${r})&queryId=voyagerSocialDashReactions.41ebf31a9f4c4a84e35a49d5abc9010b`;
              
              try {
                  const res = await originalFetch(url, { headers: { 'csrf-token': csrf, 'accept': 'application/vnd.linkedin.normalized+json+2.1' } });
                  if (!res.ok) break;
                  const data = await res.json();
                  (data.included || []).forEach(item => {
                      if (item.$type === 'com.linkedin.voyager.dash.social.Reaction' && item.reactorLockup) {
                          allData.push({
                              Type: 'LIKE', 
                              Reaction: r,
                              Name: item.reactorLockup.title?.text || '',
                              Headline: item.reactorLockup.subtitle?.text || '',
                              ProfileUrl: item.reactorLockup.navigationUrl || ''
                          });
                      }
                  });
                  if ((data.included || []).length === 0) break;
                  await sleep(200);
              } catch (e) { break; }
          }
      }
      finishAndExport(allData, 'Likes');
  }

  async function scrapeComments() {
      if(!state.socialDetailUrn) return;
      btnComments.disabled = true;
      showProgress(0, 'Р—Р°РїСЂРѕСЃ РґР°РЅРЅС‹С…...');
      let allData = [];
      const csrf = getCsrf();

      for (let page = 0; page < MAX_PAGES; page++) {
          const start = page * PAGE_SIZE_COMMENTS;
          showProgress(page * 5, `РЎР±РѕСЂ РєРѕРјРјРµРЅС‚РѕРІ: СЃС‚СЂ. ${page + 1}`);

          const encodedUrn = encodeURIComponent(state.socialDetailUrn).replace(/\(/g, '%28').replace(/\)/g, '%29');
          const url = `https://www.linkedin.com/voyager/api/graphql?includeWebMetadata=true&variables=(count:${PAGE_SIZE_COMMENTS},numReplies:1,socialDetailUrn:${encodedUrn},sortOrder:RELEVANCE,start:${start})&queryId=voyagerSocialDashComments.afec6d88d7810d45548797a8dac4fb87`;

          try {
              const res = await originalFetch(url, { headers: { 'csrf-token': csrf, 'accept': 'application/vnd.linkedin.normalized+json+2.1' } });
              if (!res.ok) break;
              const data = await res.json();
              const included = data.included || [];

              let count = 0;
              included.forEach(item => {
                  if (item.$type === 'com.linkedin.voyager.dash.social.Comment') {
                      count++;
                      const text = item.commentary?.text || '';
                      const commenter = item.commenter || {};
                      
                      let name = commenter.title?.text || "Unknown";
                      let headline = commenter.subtitle || '';
                      let link = commenter.navigationUrl || '';

                      if (!link && commenter.commenterProfileId) {
                          link = `https://www.linkedin.com/in/${commenter.commenterProfileId}`;
                      }

                      const ts = item.createdAt || item.createdTime;
                      const dateStr = ts ? new Date(ts).toLocaleString('ru-RU') : '';

                      allData.push({
                          AuthorName: name,
                          AuthorHeadline: headline,
                          ProfileLink: link,
                          Date: dateStr,
                          Text: text
                      });
                  }
              });

              if (count === 0) break;
              await sleep(500);
          } catch (e) { console.error(e); break; }
      }
      finishAndExport(allData, 'Comments');
  }

  async function scrapeReposts() {
      if(!state.shareUrn) {
          alert('вќЊ ShareUrn РЅРµ РЅР°Р№РґРµРЅ! РљР»РёРєРЅРёС‚Рµ РЅР° РєРЅРѕРїРєСѓ "Reposts" РІ РїРѕСЃС‚Рµ.');
          btnReposts.disabled = false;
          return;
      }
      
      btnReposts.disabled = true;
      showProgress(0, 'Р—Р°РїСѓСЃРє СЃР±РѕСЂР° СЂРµРїРѕСЃС‚РѕРІ...');
      let allData = [];
      const csrf = getCsrf();

      for (let page = 0; page < MAX_PAGES; page++) {
          const start = page * PAGE_SIZE_REPOSTS;
          showProgress((page / MAX_PAGES) * 100, `Р РµРїРѕСЃС‚С‹: СЃС‚СЂ. ${page + 1}`);

          const encodedUrn = encodeURIComponent(state.shareUrn).replace(/\(/g, '%28').replace(/\)/g, '%29');
          const url = `https://www.linkedin.com/voyager/api/graphql?variables=(targetUrn:${encodedUrn})&queryId=voyagerFeedDashReshareFeed.dc56f7e6b303133b71fdbb584ec2a2a5`;

          try {
              const res = await originalFetch(url, { 
                  headers: { 
                      'csrf-token': csrf, 
                      'accept': 'application/vnd.linkedin.normalized+json+2.1',
                      'x-restli-protocol-version': '2.0.0'
                  } 
              });
              
              if (!res.ok) break;
              
              const data = await res.json();
              const included = data.included || [];
              
              const updates = included.filter(item => item.$type === 'com.linkedin.voyager.dash.feed.Update');
              if (updates.length === 0) break;

              const profilesMap = {};
              included.filter(item => item.$type === 'com.linkedin.voyager.dash.identity.profile.Profile')
                  .forEach(profile => { profilesMap[profile.entityUrn] = profile; });

              updates.forEach(update => {
                  let name = '', headline = '', profileLink = '', timeAgo = '', repostText = '', actorType = 'Profile';

                  if (update.header && update.header.text) {
                      const headerText = update.header.text.text || '';
                      name = headerText.replace(/\s+РїРѕРґРµР»РёР»СЃСЏ\(Р»Р°СЃСЊ\).*$/i, '').replace(/\s+РїРѕРґРµР»РёР»СЃСЏ.*$/i, '').trim();
                      const attrs = update.header.text.attributesV2 || [];
                      for (const attr of attrs) {
                          if (attr.detailData?.profileFullName) {
                              const profileUrn = attr.detailData.profileFullName;
                              const profile = profilesMap[profileUrn];
                              if (profile) profileLink = `https://www.linkedin.com/in/${profile.publicIdentifier}`;
                              break;
                          }
                      }
                      if (!profileLink && update.header.imageNavigationContext) profileLink = update.header.imageNavigationContext.actionTarget || '';
                      if (update.actor && update.actor.description) headline = update.actor.description.text || '';
                      if (update.actor && update.actor.subDescription) timeAgo = update.actor.subDescription.text?.replace(/\s+вЂў.*$/, '').trim() || '';
                      if (update.commentary && update.commentary.text) repostText = update.commentary.text.text || '';
                      
                  } else if (update.actor) {
                      name = update.actor.name?.text || '';
                      headline = update.actor.description?.text || '';
                      profileLink = update.actor.navigationContext?.actionTarget || '';
                      timeAgo = update.actor.subDescription?.text?.replace(/\s+вЂў.*$/, '').trim() || '';
                      if (update.commentary && update.commentary.text) repostText = update.commentary.text.text || '';
                      if (update.actor.backendUrn?.includes('company')) actorType = 'Company';
                  }

                  if (name) {
                      allData.push({ Name: name, Headline: headline, ProfileLink: profileLink, TimeAgo: timeAgo, RepostText: repostText, ActorType: actorType });
                  }
              });

              const feedData = data.data?.data?.feedDashReshareFeedByReshareFeed;
              const total = feedData?.paging?.total || 0;
              if (total === 0 || updates.length < PAGE_SIZE_REPOSTS) break;
              await sleep(500);
          } catch (e) { console.error(e); break; }
      }
      finishAndExport(allData, 'Reposts');
  }

  // --- 4. РЎРљР РђРџР•Р : Р‘РћР™Р¦Р« (DOM PARSER + PAGINATION) ---
  function parseCurrentPageFighters() {
      const cards = document.querySelectorAll('div[data-view-name="people-search-result"]');
      const pageData = [];
      cards.forEach((card) => {
          try {
              const titleElement = card.querySelector('[data-view-name="search-result-lockup-title"]');
              let name = "РќРµ РЅР°Р№РґРµРЅРѕ", profileUrl = "";
              if (titleElement) {
                  name = titleElement.innerText.trim();
                  profileUrl = titleElement.href.split('?')[0]; 
              }
              const imgElement = card.querySelector('img');
              let photoUrl = "";
              if (imgElement) {
                  photoUrl = imgElement.src;
                  if (photoUrl.startsWith('data:')) photoUrl = "Base64 Image (Embedded)";
              }
              const pTags = card.querySelectorAll('p');
              let jobTitle = "", location = "", mutuals = "";
              const textLines = Array.from(pTags).map(p => p.innerText.trim()).filter(text => text !== name && !text.startsWith('вЂў'));
              if (textLines.length > 0) {
                  if (pTags[1]) jobTitle = pTags[1].innerText.trim();
                  if (pTags[2]) location = pTags[2].innerText.trim();
              }
              const insightElement = card.querySelector('.search-result-social-proof-insight, [data-view-name="search-result-social-proof-insight"]');
              if (insightElement) {
                   const parentP = insightElement.closest('p');
                   mutuals = parentP ? parentP.innerText.trim() : insightElement.innerText.trim();
              }
              pageData.push({ "РРјСЏ": name, "Р”РѕР»Р¶РЅРѕСЃС‚СЊ": jobTitle, "Р›РѕРєР°С†РёСЏ": location, "РџСЂРѕС„РёР»СЊ": profileUrl, "РћР±С‰РёРµ РєРѕРЅС‚Р°РєС‚С‹": mutuals, "Р¤РѕС‚Рѕ": photoUrl });
          } catch (e) {}
      });
      return pageData;
  }

  async function scrapePeople() {
      if (isScrapingPeople) {
          isScrapingPeople = false;
          btnPeople.innerText = 'рџ›‘ Р—Р°РІРµСЂС€Р°СЋ...';
          return;
      }
      const initialCards = document.querySelectorAll('div[data-view-name="people-search-result"]');
      if (initialCards.length === 0) {
          alert("вќЊ РќРёРєРѕРіРѕ РЅРµ РЅР°С€РµР». РўС‹ С‚РѕС‡РЅРѕ РЅР° СЃС‚СЂР°РЅРёС†Рµ РїРѕРёСЃРєР°?");
          return;
      }
      isScrapingPeople = true;
      btnPeople.innerText = 'в›” РћСЃС‚Р°РЅРѕРІРёС‚СЊ СЃР±РѕСЂ';
      btnPeople.classList.add('active'); 
      let allFighters = [];
      let pageNum = 1;

      while (isScrapingPeople && pageNum <= MAX_PEOPLE_PAGES) {
          showProgress((pageNum % 10) * 10, `РЎС‚СЂ. ${pageNum}: СЃР±РѕСЂ Р±РѕР№С†РѕРІ...`);
          const fightersOnPage = parseCurrentPageFighters();
          if (fightersOnPage.length > 0) {
              allFighters.push(...fightersOnPage);
              console.log(`вњ… РЎС‚СЂ. ${pageNum}: РЅР°Р№РґРµРЅРѕ ${fightersOnPage.length} (Р’СЃРµРіРѕ: ${allFighters.length})`);
          } else {
              await sleep(2000); 
              const retry = parseCurrentPageFighters();
              if (retry.length > 0) allFighters.push(...retry);
          }
          progressText.innerText = `РЎС‚СЂ. ${pageNum}: РЎРѕР±СЂР°РЅРѕ ${allFighters.length}`;
          if (!isScrapingPeople) break;
          const nextBtn = document.querySelector('button[data-testid="pagination-controls-next-button-visible"]');
          if (nextBtn && !nextBtn.disabled) {
              nextBtn.scrollIntoView({ behavior: 'smooth', block: 'center' });
              await sleep(500); 
              nextBtn.click();
              pageNum++;
              showProgress(0, `РџРµСЂРµС…РѕРґ РЅР° СЃС‚СЂ. ${pageNum}...`);
              const waitTime = 3000 + Math.random() * 2000;
              await sleep(waitTime);
          } else {
              break;
          }
      }
      isScrapingPeople = false;
      const dedupByProfile = new Map();
      allFighters.forEach(row => {
          const normalized = normalizeProfileUrl(row["РџСЂРѕС„РёР»СЊ"] || row["Профиль"] || '');
          if (!normalized) return;
          dedupByProfile.set(normalized, { ...row, "Профиль": normalized });
      });
      const normalizedFighters = Array.from(dedupByProfile.values());
      if (normalizedFighters.length > 0) {
          saveFightersCache(normalizedFighters);
          updateUi('PROFILES');
      }
      showProgress(100, `Р“РѕС‚РѕРІРѕ! Р’СЃРµРіРѕ Р±РѕР№С†РѕРІ: ${allFighters.length}`);
      await sleep(500);
      finishAndExport(allFighters, 'Fighters');
      btnPeople.innerText = 'рџ¤јвЂЌв™‚пёЏ РЎРѕР±СЂР°С‚СЊ Р‘РѕР№С†РѕРІ';
  }

  function findSectionByHeading(doc, headingMatchers) {
      const sections = Array.from(doc.querySelectorAll('section'));
      const normalizedMatchers = headingMatchers.map(x => x.toLowerCase());
      for (const section of sections) {
          const h = section.querySelector('h2, h3');
          if (!h) continue;
          const t = (h.textContent || '').trim().toLowerCase();
          if (!t) continue;
          if (normalizedMatchers.some(m => t.includes(m))) return section;
      }
      return null;
  }

  function sanitizeText(text) {
      return (text || '').replace(/\s+/g, ' ').trim();
  }

  function makeAbsolute(url, baseUrl) {
      if (!url) return '';
      try {
          return new URL(url, baseUrl || window.location.origin).toString();
      } catch (e) {
          return '';
      }
  }

  function sectionText(section) {
      if (!section) return '';
      return sanitizeText(section.textContent || '');
  }

  function sectionLinks(section, baseUrl) {
      if (!section) return [];
      const out = [];
      const seen = new Set();
      section.querySelectorAll('a[href]').forEach(a => {
          const href = makeAbsolute(a.getAttribute('href'), baseUrl);
          const text = sanitizeText(a.textContent || '');
          if (!href || seen.has(`${href}|${text}`)) return;
          seen.add(`${href}|${text}`);
          out.push({ text, href });
      });
      return out;
  }

  function parseProfileHtml(html, profileUrl) {
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      const row = { "Профиль": profileUrl };

      const nameEl = doc.querySelector('main h1') || doc.querySelector('main h2');
      row["Имя"] = sanitizeText(nameEl?.textContent || '');

      const topRoot = nameEl ? (nameEl.closest('section, div') || doc.body) : doc.body;
      const topText = sanitizeText(topRoot.textContent || '');
      row["ВерхКарточки_Текст"] = topText;

      const headlineEl = Array.from((topRoot || doc).querySelectorAll('p')).find(p => {
          const t = sanitizeText(p.textContent || '');
          return t.length > 10 && !/контакт|followers|connections|сообщение|message/i.test(t);
      });
      row["Заголовок"] = sanitizeText(headlineEl?.textContent || '');

      const locationEl = Array.from((topRoot || doc).querySelectorAll('p')).find(p => {
          const t = sanitizeText(p.textContent || '');
          return /,/.test(t) && /[A-Za-zА-Яа-я]/.test(t);
      });
      row["Локация"] = sanitizeText(locationEl?.textContent || '');

      const contactLink = Array.from(doc.querySelectorAll('a[href]')).find(a => {
          const t = sanitizeText(a.textContent || '');
          return /контакт|contact/i.test(t);
      });
      row["Контакты_ТекстКнопки"] = sanitizeText(contactLink?.textContent || '');
      row["Контакты_URL"] = makeAbsolute(contactLink?.getAttribute('href') || '', profileUrl);

      const sharedConnections = Array.from(doc.querySelectorAll('a[href]')).find(a => {
          const t = sanitizeText(a.textContent || '');
          return /общих контакт|shared connection/i.test(t);
      });
      row["ОбщиеКонтакты_Текст"] = sanitizeText(sharedConnections?.textContent || '');
      row["ОбщиеКонтакты_URL"] = makeAbsolute(sharedConnections?.getAttribute('href') || '', profileUrl);

      const expSection = findSectionByHeading(doc, ['опыт работы', 'experience']);
      const eduSection = findSectionByHeading(doc, ['образование', 'education']);
      const certSection = findSectionByHeading(doc, ['лицензии и сертификаты', 'licenses', 'certifications', 'certificates']);
      const skillsSection = findSectionByHeading(doc, ['навыки', 'skills']);

      row["ОпытРаботы_Текст"] = sectionText(expSection);
      row["Образование_Текст"] = sectionText(eduSection);
      row["Сертификаты_Текст"] = sectionText(certSection);
      row["Навыки_Текст"] = sectionText(skillsSection);

      row["ОпытРаботы_Links"] = JSON.stringify(sectionLinks(expSection, profileUrl));
      row["Образование_Links"] = JSON.stringify(sectionLinks(eduSection, profileUrl));
      row["Сертификаты_Links"] = JSON.stringify(sectionLinks(certSection, profileUrl));
      row["Навыки_Links"] = JSON.stringify(sectionLinks(skillsSection, profileUrl));
      row["ВсеСсылкиПрофиля"] = JSON.stringify(sectionLinks(doc.body, profileUrl));

      return row;
  }

  async function scrapeProfilesFromFighters() {
      if (isScrapingProfiles) {
          isScrapingProfiles = false;
          btnProfiles.innerText = '🛑 Завершаю...';
          return;
      }

      const cached = loadFightersCache();
      if (!cached.length) {
          alert('Сначала соберите бойцов через блок 4.');
          refreshProfilesButtonState();
          return;
      }

      const dedupUrls = Array.from(new Set(cached
          .map(x => normalizeProfileUrl(x["Профиль"] || x["РџСЂРѕС„РёР»СЊ"] || ''))
          .filter(Boolean)));

      if (!dedupUrls.length) {
          alert('В кеше бойцов нет валидных ссылок профилей.');
          refreshProfilesButtonState();
          return;
      }

      isScrapingProfiles = true;
      btnProfiles.disabled = false;
      btnProfiles.classList.add('active');
      btnProfiles.innerText = '⛔ Остановить сбор профилей';
      statusProfiles.classList.add('ready');
      statusProfiles.innerHTML = `✅ <b>Профили</b>: запуск (${dedupUrls.length})`;

      const rows = [];
      const failed = [];
      for (let i = 0; i < dedupUrls.length && isScrapingProfiles; i++) {
          const profileUrl = dedupUrls[i];
          showProgress(Math.floor((i / dedupUrls.length) * 100), `Профили: ${i + 1}/${dedupUrls.length}`);
          progressText.innerText = `Профили: ${i + 1}/${dedupUrls.length} — ${profileUrl}`;

          try {
              const res = await fetch(profileUrl, { credentials: 'include' });
              if (!res.ok) {
                  failed.push({ "Профиль": profileUrl, "Ошибка": `HTTP ${res.status}` });
                  continue;
              }
              const html = await res.text();
              const parsed = parseProfileHtml(html, profileUrl);
              rows.push(parsed);
          } catch (e) {
              failed.push({ "Профиль": profileUrl, "Ошибка": String(e && e.message ? e.message : e) });
          }

          if (i < dedupUrls.length - 1) {
              await sleepRandom(PROFILE_FETCH_DELAY_MIN, PROFILE_FETCH_DELAY_MAX);
          }
      }

      isScrapingProfiles = false;
      btnProfiles.innerText = '🧠 Расширить Бойцов (профили)';
      refreshProfilesButtonState();

      const payload = rows.map(r => {
          const source = cached.find(c => normalizeProfileUrl(c["Профиль"] || c["РџСЂРѕС„РёР»СЊ"] || '') === normalizeProfileUrl(r["Профиль"]));
          return source ? { ...source, ...r } : r;
      });

      showProgress(100, `Готово! Профилей: ${payload.length}, ошибок: ${failed.length}`);
      await sleep(400);
      finishAndExport(payload, 'Fighters_Profiles_Deep');

      if (failed.length) {
          exportCSV(failed, `Fighters_Profiles_Errors_${Date.now()}`);
      }
  }

  // --- 5. РЎРљР РђРџР•Р : РљРћРќРќР•РљРўР« (SCROLL & LOAD MORE) ---
  
  async function smoothScroll(duration = 1200) {
    const start = window.scrollY;
    const end = document.body.scrollHeight;
    const startTime = performance.now();

    return new Promise(resolve => {
        function step(t) {
            const p = Math.min((t - startTime) / duration, 1);
            const ease = p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;
            window.scrollTo(0, start + (end - start) * ease);
            if (p < 1 && isScrapingConnections) {
                requestAnimationFrame(step);
            } else {
                resolve();
            }
        }
        requestAnimationFrame(step);
    });
  }

  async function clickLoadMore() {
    const btn = [...document.querySelectorAll("button")].find(b => b.innerText?.trim() === "Р—Р°РіСЂСѓР·РёС‚СЊ РµС‰Рµ");
    if (!btn) return false;
    btn.scrollIntoView({ behavior: "smooth", block: "center" });
    await sleep(400);
    btn.click();
    return true;
  }

  async function scrapeConnections() {
      if (isScrapingConnections) {
          isScrapingConnections = false;
          btnConnections.innerText = 'рџ›‘ Р—Р°РІРµСЂС€Р°СЋ...';
          return;
      }

      console.log("рџ¤ќ РќР°С‡РёРЅР°РµРј СЃР±РѕСЂ РєРѕРЅРЅРµРєС‚РѕРІ...");
      isScrapingConnections = true;
      btnConnections.innerText = 'в›” РћСЃС‚Р°РЅРѕРІРёС‚СЊ';
      btnConnections.classList.add('active');
      showProgress(0, 'Р—Р°РїСѓСЃРє РїСЂРѕРєСЂСѓС‚РєРё...');

      // Р¦РРљР› РџР РћРљР РЈРўРљР
      while (isScrapingConnections) {
          const currentCards = document.querySelectorAll('div[data-view-name="connections-list"] > div').length;
          progressText.innerText = `РџСЂРѕРєСЂСѓС‚РєР°... Р—Р°РіСЂСѓР¶РµРЅРѕ: ${currentCards}`;
          
          await smoothScroll(1200);
          if (!isScrapingConnections) break;
          await sleep(700);

          const clicked = await clickLoadMore();
          if (!clicked) {
               const prevHeight = document.body.scrollHeight;
               await sleep(1500);
               if (document.body.scrollHeight <= prevHeight && !document.querySelector("button.scaffold-finite-scroll__load-button")) {
                   break;
               }
          }
          await sleep(800);
      }

      showProgress(90, 'РЎР±РѕСЂ РґР°РЅРЅС‹С… РёР· DOM...');
      
      // РЎР‘РћР  Р”РђРќРќР«РҐ
      const seen = new Set();
      const data = [];
      const cards = document.querySelectorAll('div[data-view-name="connections-list"] > div');

      cards.forEach(card => {
        const link = card.querySelector('a[data-view-name="connections-profile"]') || card.querySelector('a[href*="/in/"]');
        if (!link) return;

        const rawUrl = link.href;
        const profileUrl = decodeURI(rawUrl);
        if (seen.has(profileUrl)) return;
        seen.add(profileUrl);

        const slugRaw = rawUrl.split("/in/")[1]?.replace(/\/.*/, "") || "";
        const publicSlug = decodeURIComponent(slugRaw);
        
        const nameEl = card.querySelector('p a[href*="/in/"]') || card.querySelector('.mn-connection-card__name');
        const name = nameEl?.innerText.trim() || "";

        const titleEl = card.querySelector('p._9145fa36.d34de4a6') || card.querySelector('.mn-connection-card__occupation');
        const title = titleEl?.innerText.trim() || "";

        const connectedEl = card.querySelector('p._59799d04') || card.querySelector('time');
        const connectedAt = connectedEl?.innerText?.replace("РљРѕРЅС‚Р°РєС‚ СѓСЃС‚Р°РЅРѕРІР»РµРЅ", "").trim() || "";

        const img = card.querySelector("img");
        const photoUrl = img?.src || "";
        const hasPhoto = photoUrl && !photoUrl.includes("data:image") ? "true" : "false";

        data.push({
          "РРјСЏ": name,
          "РџСЂРѕС„РёР»СЊ": profileUrl,
          "ID (Slug)": publicSlug,
          "Р”РѕР»Р¶РЅРѕСЃС‚СЊ": title,
          "Р”Р°С‚Р° РєРѕРЅРЅРµРєС‚Р°": connectedAt,
          "Р¤РѕС‚Рѕ URL": photoUrl,
          "Р•СЃС‚СЊ С„РѕС‚Рѕ?": hasPhoto
        });
      });

      isScrapingConnections = false;
      showProgress(100, `Р“РѕС‚РѕРІРѕ! РЎРѕР±СЂР°РЅРѕ: ${data.length}`);
      await sleep(500);

      finishAndExport(data, 'Connections');
      btnConnections.innerText = 'рџ¤ќ РЎРѕР±СЂР°С‚СЊ РљРѕРЅРЅРµРєС‚С‹';
  }

  // --- 6. РРЎРџР РђР’Р›Р•РќРќР«Р™ РЎРљР РђРџР•Р : Р’РђРљРђРќРЎРР (PAGINATION + FULL DATA + CLEANER) ---

  const getText = (el, selector) => {
      try {
          const elem = selector ? el.querySelector(selector) : el;
          return elem?.textContent?.trim().replace(/\s+/g, ' ') || '';
      } catch (e) { return ''; }
  };

  const getAttr = (el, selector, attr) => {
      try {
          return el.querySelector(selector)?.getAttribute(attr) || '';
      } catch (e) { return ''; }
  };

  // 1) РћС‡РёСЃС‚РєР° РѕС‚ HTML-РјСѓСЃРѕСЂР° (РІРѕР·РІСЂР°С‰Р°РµС‚ С‡РёСЃС‚С‹Р№ С‡РёС‚Р°РµРјС‹Р№ С‚РµРєСЃС‚)
  const cleanJobDescription = (html) => {
      if (!html) return '';
      let text = html
          .replace(/<br\s*\/?>/gi, '\n')       // <br> -> РЅРѕРІР°СЏ СЃС‚СЂРѕРєР°
          .replace(/<\/p>/gi, '\n\n')          // </p> -> РґРІРµ РЅРѕРІС‹Рµ СЃС‚СЂРѕРєРё
          .replace(/<\/li>/gi, '\n')           // </li> -> РЅРѕРІР°СЏ СЃС‚СЂРѕРєР°
          .replace(/<li>/gi, 'вЂў ')             // <li> -> РєСЂР°СЃРёРІС‹Р№ Р±СѓР»Р»РёС‚
          .replace(/<[^>]+>/g, '')             // РЈРґР°Р»СЏРµРј Р’РЎР• РѕСЃС‚Р°Р»СЊРЅС‹Рµ С‚РµРіРё (h2, span, strong Рё С‚.Рґ.)
          .replace(/&nbsp;/g, ' ')             // РќРµСЂР°Р·СЂС‹РІРЅС‹Рµ РїСЂРѕР±РµР»С‹
          .replace(/&amp;/g, '&')
          .replace(/&quot;/g, '"')
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>')
          .replace(/\t/g, ' ')                 // РўР°Р±С‹
          .replace(/ +/g, ' ');                // Р›РёС€РЅРёРµ РґРІРѕР№РЅС‹Рµ РїСЂРѕР±РµР»С‹
      
      // РЈРґР°Р»СЏРµРј РїСѓСЃС‚С‹Рµ СЃС‚СЂРѕРєРё РїРѕРґСЂСЏРґ Рё С‚СЂРёРјРёРј
      return text.split('\n').map(line => line.trim()).filter(line => line).join('\n');
  };

  // РћР¶РёРґР°РЅРёРµ Р·Р°РіСЂСѓР·РєРё РїСЂР°РІРѕР№ РїР°РЅРµР»Рё
  const waitForDetailsToLoad = async (expectedTitle) => {
      let attempts = 0;
      const cleanExpected = expectedTitle.trim().substring(0, 15).toLowerCase();
      
      while (attempts < 20) { 
          const rightPaneHeader = document.querySelector('.job-details-jobs-unified-top-card__job-title h1');
          if (rightPaneHeader) {
              const currentTitle = rightPaneHeader.textContent.trim().substring(0, 15).toLowerCase();
              if (currentTitle.includes(cleanExpected) || cleanExpected.includes(currentTitle)) {
                  return true;
              }
          }
          await sleep(250);
          attempts++;
      }
      return false;
  };

  // РџР°СЂСЃРёРЅРі РїРѕР»РЅС‹С… РґР°РЅРЅС‹С… РІР°РєР°РЅСЃРёРё
  function parseFullJobDetails(jobId, cardElement) {
      // 1. РЎР‘РћР  Р”РђРќРќР«РҐ РР— РљРђР РўРћР§РљР (РџР РђР’Р«Р™ Р‘Р›РћРљ)
      
      // 2) РСЃРїСЂР°РІР»СЏРµРј SalaryCard: РёС‰РµРј РїРѕ РІСЃРµРј СЌР»РµРјРµРЅС‚Р°Рј СЃРїРёСЃРєР°, Р° РЅРµ С‚РѕР»СЊРєРѕ РІС‚РѕСЂРѕР№
      const metaItems = Array.from(cardElement.querySelectorAll('.job-card-container__metadata-wrapper li'));
      let location = '';
      let salaryCard = '';
      
      metaItems.forEach(item => {
          const txt = item.textContent.trim().replace(/\s+/g, ' ');
          // Р•СЃР»Рё РµСЃС‚СЊ РІР°Р»СЋС‚Р° РёР»Рё СЃР»РѕРІР° "РіРѕРґ/РјРµСЃ/yr/mo" Рё С†РёС„СЂС‹ - СЌС‚Рѕ Р·Р°СЂРїР»Р°С‚Р°
          if (/[в‚Ѕ$в‚¬ВЈ]/.test(txt) || (/\d/.test(txt) && /yr|mo|hr|РіРѕРґ|РјРµСЃ/.test(txt.toLowerCase()))) {
              salaryCard = txt;
          } else if (!location) {
              location = txt; // Р•СЃР»Рё СЌС‚Рѕ РЅРµ Р·Р°СЂРїР»Р°С‚Р° Рё Р»РѕРєР°С†РёСЏ РїСѓСЃС‚Р° - Р±РµСЂРµРј РєР°Рє Р»РѕРєР°С†РёСЋ
          }
      });

      // 3) РСЃРїСЂР°РІР»СЏРµРј СЃСЃС‹Р»РєСѓ (РґРѕР±Р°РІР»СЏРµРј РґРѕРјРµРЅ)
      let rawLink = getAttr(cardElement, 'a.job-card-container__link', 'href').split('?')[0];
      if (rawLink && !rawLink.startsWith('http')) {
          rawLink = 'https://www.linkedin.com' + rawLink;
      }

      const cardData = {
          ID: jobId,
          Title: getText(cardElement, '.job-card-list__title'),
          Company: getText(cardElement, '.artdeco-entity-lockup__subtitle'),
          Location: location,      // РСЃРїСЂР°РІР»РµРЅРѕ
          SalaryCard: salaryCard,  // РСЃРїСЂР°РІР»РµРЅРѕ
          Insight: getText(cardElement, '.job-card-list__insight'),
          FooterState: getText(cardElement, '.job-card-container__footer-item'),
          JobLink: rawLink,        // РСЃРїСЂР°РІР»РµРЅРѕ
          LogoUrl: getAttr(cardElement, '.job-card-list__logo img', 'src')
      };

      // 2. РЎР‘РћР  Р”РђРќРќР«РҐ РР— Р”Р•РўРђР›Р•Р™ (Р›Р•Р’Р«Р™ Р‘Р›РћРљ)
      const container = document.querySelector('.job-view-layout.jobs-details') || 
                        document.querySelector('.jobs-details__main-content') ||
                        document.querySelector('.job-details-jobs-unified-top-card__container--two-pane')?.closest('.job-view-layout');
                        
      if (!container) return cardData; 

      const details = { ...cardData };

      const fullTitle = getText(container, '.job-details-jobs-unified-top-card__job-title h1');
      if (fullTitle) details.Title = fullTitle;

      const companyLink = getAttr(container, '.job-details-jobs-unified-top-card__company-name a', 'href');
      if (companyLink) details.CompanyLink = companyLink;

      const bigLogo = getAttr(container, '.ivm-view-attr__img-wrapper img', 'src');
      if (bigLogo) details.LogoUrl = bigLogo;

      const primaryDesc = container.querySelector('.job-details-jobs-unified-top-card__primary-description-container');
      if (primaryDesc) {
          const text = primaryDesc.innerText.replace(/\n/g, ' ');
          const parts = text.split('В·').map(s => s.trim());
          if (parts[0]) details.LocationFull = parts[0];
          if (parts[1]) details.PostedTime = parts[1];
          if (parts.length > 2) details.Applicants = parts.slice(2).join(', ');
      }

      const preferences = container.querySelectorAll('.job-details-fit-level-preferences button');
      const prefTexts = Array.from(preferences).map(b => getText(b)).filter(t => t);
      details.Tags = prefTexts.join(' | ');

      const salaryTag = prefTexts.find(t => t.includes('$') || t.includes('в‚¬') || t.includes('в‚Ѕ'));
      if (salaryTag) details.SalaryDetails = salaryTag;

      const descBox = container.querySelector('#job-details') || container.querySelector('.jobs-description__content');
      if (descBox) {
          // 4) Р§РёСЃС‚РёРј РјСѓСЃРѕСЂ РїРѕР»РЅРѕСЃС‚СЊСЋ
          details.Description = cleanJobDescription(descBox.innerHTML); 
      }

      const companyBox = container.querySelector('.jobs-company__box');
      if (companyBox) {
          details.CompanyDescription = getText(companyBox, '.jobs-company__company-description');
          details.CompanySize = getText(companyBox, '.jobs-company__inline-information'); 
      }

      const applyBtn = container.querySelector('.jobs-apply-button');
      if (applyBtn) {
          const isEasy = !!applyBtn.querySelector('[data-test-icon="linkedin-bug-xxsmall"]') || 
                         getText(applyBtn).toLowerCase().includes('РїСЂРѕСЃС‚Р°СЏ');
          details.ApplyType = isEasy ? 'Easy Apply' : 'External';
      }

      return details;
  }

  async function scrapeJobs() {
      if (isScrapingJobs) {
          isScrapingJobs = false;
          btnJobs.innerText = 'рџ›‘ Р—Р°РІРµСЂС€Р°СЋ...';
          return;
      }

      // РџРѕРёСЃРє РєРѕРЅС‚РµР№РЅРµСЂР° СЃРєСЂРѕР»Р»Р°
      let scrollContainer = document.querySelector('.jobs-search-results-list') || 
                            document.querySelector('.scaffold-layout__list-container') || 
                            document.querySelector('.scaffold-layout__list');

      if (!scrollContainer) {
          const firstCard = document.querySelector('li[data-occludable-job-id]');
          if (firstCard) scrollContainer = firstCard.parentElement; 
      }

      if (!scrollContainer) {
          alert("вќЊ РќРµ РјРѕРіСѓ РЅР°Р№С‚Рё СЃРїРёСЃРѕРє РІР°РєР°РЅСЃРёР№. РћР±РЅРѕРІРёС‚Рµ СЃС‚СЂР°РЅРёС†Сѓ.");
          return;
      }

      console.log("рџ’ј РќР°С‡РёРЅР°РµРј РїР°СЂСЃРёРЅРі РІР°РєР°РЅСЃРёР№ (Max 100 Pages)...");
      
      isScrapingJobs = true;
      btnJobs.innerText = 'в›” РћСЃС‚Р°РЅРѕРІРёС‚СЊ';
      btnJobs.classList.add('active');

      let allJobs = [];
      let processedGlobalIds = new Set();
      let pageNum = 1;
      const MAX_PAGES_LIMIT = 100;

      // --- Р’РќР•РЁРќРР™ Р¦РРљР› РџРћ РЎРўР РђРќРР¦РђРњ ---
      while (isScrapingJobs && pageNum <= MAX_PAGES_LIMIT) {
          showProgress(0, `РЎС‚СЂР°РЅРёС†Р° ${pageNum}: РћР±СЂР°Р±РѕС‚РєР° СЃРїРёСЃРєР°...`);
          
          let processedOnPage = 0;
          let noNewCount = 0;
          
          // --- Р’РќРЈРўР Р•РќРќРР™ Р¦РРљР›: РџР РћРљР РЈРўРљРђ РўР•РљРЈР©Р•Р“Рћ РЎРџРРЎРљРђ ---
          while (isScrapingJobs) {
              const cards = Array.from(document.querySelectorAll('li[data-occludable-job-id]'));
              let foundNewOnScroll = false;

              for (const card of cards) {
                  if (!isScrapingJobs) break;

                  const jobId = card.getAttribute('data-occludable-job-id');
                  if (processedGlobalIds.has(jobId)) continue; 

                  foundNewOnScroll = true;

                  try {
                      // 1. РЎРєСЂРѕР»Р» Рє РєР°СЂС‚РѕС‡РєРµ
                      card.scrollIntoView({ behavior: 'auto', block: 'center' });
                      
                      const cardTitle = getText(card, '.job-card-list__title');
                      progressText.innerText = `РЎС‚СЂ.${pageNum} [${allJobs.length}]: ${cardTitle.substring(0, 20)}...`;

                      // 2. РљР»РёРє
                      const clickTarget = card.querySelector('.job-card-list__title') || card.querySelector('.job-card-container');
                      if (clickTarget) clickTarget.click();
                      else card.click();

                      // 3. Р–РґРµРј Р·Р°РіСЂСѓР·РєРё РґРµС‚Р°Р»РµР№
                      const loaded = await waitForDetailsToLoad(cardTitle);
                      if (!loaded) {
                          card.click(); // РџРѕРІС‚РѕСЂ РєР»РёРєР°
                          await sleep(1500);
                      } else {
                          await sleep(600); 
                      }

                      // 4. РџР°СЂСЃРёРЅРі
                      const jobData = parseFullJobDetails(jobId, card);
                      
                      allJobs.push(jobData);
                      processedGlobalIds.add(jobId);
                      processedOnPage++;
                      
                      console.log(`вњ… ${jobData.Title} | ${jobData.Company}`);
                      
                      await sleep(300 + Math.random() * 400);

                  } catch (e) {
                      console.error("Error parsing job:", e);
                  }
              }

              if (!isScrapingJobs) break;

              // РЎРєСЂРѕР»Р» РєРѕРЅС‚РµР№РЅРµСЂР° РІРЅРёР·
              const beforeScroll = scrollContainer.scrollTop;
              scrollContainer.scrollBy({ top: scrollContainer.clientHeight, behavior: 'smooth' });
              
              await sleep(2000); // Р–РґРµРј РїРѕРґРіСЂСѓР·РєСѓ

              // РџСЂРѕРІРµСЂРєР° РєРѕРЅС†Р° СЃРїРёСЃРєР°
              const isAtBottom = (scrollContainer.scrollTop + scrollContainer.clientHeight >= scrollContainer.scrollHeight - 50);
              const isStuck = (Math.ceil(scrollContainer.scrollTop) === Math.ceil(beforeScroll));

              if (isAtBottom || (isStuck && !foundNewOnScroll)) {
                  noNewCount++;
              } else {
                  noNewCount = 0;
              }

              if (noNewCount >= 3) break; // РЎРїРёСЃРѕРє РєРѕРЅС‡РёР»СЃСЏ
          }

          console.log(`рџЏЃ РЎС‚СЂР°РЅРёС†Р° ${pageNum} Р·Р°РІРµСЂС€РµРЅР°. РЎРѕР±СЂР°РЅРѕ РЅР° СЃС‚СЂР°РЅРёС†Рµ: ${processedOnPage}`);

          if (!isScrapingJobs) break;

          // --- РџР•Р Р•РҐРћР” РќРђ РЎР›Р•Р”РЈР®Р©РЈР® РЎРўР РђРќРР¦РЈ ---
          const nextBtn = document.querySelector('button.jobs-search-pagination__button--next') || 
                          document.querySelector('button[aria-label="РЎРј. СЃР»РµРґСѓСЋС‰СѓСЋ СЃС‚СЂР°РЅРёС†Сѓ"]');

          if (nextBtn && !nextBtn.disabled) {
              progressText.innerText = `РџРµСЂРµС…РѕРґ РЅР° СЃС‚СЂР°РЅРёС†Сѓ ${pageNum + 1}...`;
              nextBtn.scrollIntoView({ behavior: 'smooth', block: 'center' });
              await sleep(1000);
              nextBtn.click();
              
              pageNum++;
              // Р–РґРµРј Р·Р°РіСЂСѓР·РєРё РЅРѕРІРѕРіРѕ СЃРїРёСЃРєР°
              await sleep(4000); 
              
              // РћР±РЅРѕРІР»СЏРµРј РєРѕРЅС‚РµР№РЅРµСЂ
              scrollContainer = document.querySelector('.jobs-search-results-list') || 
                                document.querySelector('.scaffold-layout__list-container') ||
                                document.querySelector('.scaffold-layout__list');
              
              if(scrollContainer) scrollContainer.scrollTop = 0;

          } else {
              console.log("РџР°РіРёРЅР°С†РёСЏ Р·Р°РІРµСЂС€РµРЅР° (РєРЅРѕРїРєР° Next РЅРµ РЅР°Р№РґРµРЅР° РёР»Рё РЅРµР°РєС‚РёРІРЅР°).");
              break;
          }
      }

      isScrapingJobs = false;
      showProgress(100, `Р“РѕС‚РѕРІРѕ! Р’СЃРµРіРѕ РІР°РєР°РЅСЃРёР№: ${allJobs.length}`);
      
      finishAndExport(allJobs, 'Jobs_Clean');
      btnJobs.innerText = 'рџ’ј РЎРѕР±СЂР°С‚СЊ Р’Р°РєР°РЅСЃРёРё';
  }

  // --- UTILS ---
  function getCsrf() { 
      return document.cookie.match(/JSESSIONID="?([^";]+)/)?.[1] || ''; 
  }
  
  function showProgress(pct, text) { 
      progressArea.style.display = 'block'; 
      progressFill.style.width = `${pct}%`; 
      progressText.innerText = text; 
  }
  
  function finishAndExport(data, type) {
      progressFill.style.width = '100%';
      if(data.length) { 
          progressText.innerText = `РЎРѕС…СЂР°РЅСЏСЋ ${data.length} СЃС‚СЂРѕРє...`; 
          exportCSV(data, type); 
      } else { 
          progressText.innerText = 'РќРёС‡РµРіРѕ РЅРµ РЅР°Р№РґРµРЅРѕ.'; 
      }
      
      setTimeout(() => { 
          progressArea.style.display = 'none'; 
          if(state.postUrn) btnLikes.disabled = false;
          if(state.socialDetailUrn) btnComments.disabled = false;
          if(state.shareUrn) btnReposts.disabled = false;
          
          const searchCards = document.querySelectorAll('div[data-view-name="people-search-result"]');
          if (searchCards.length > 0) btnPeople.disabled = false;
          
          const connectionsList = document.querySelector('div[data-view-name="connections-list"]');
          if (connectionsList) btnConnections.disabled = false;
          
          if (window.location.href.includes('/jobs/')) btnJobs.disabled = false;
          refreshProfilesButtonState();

      }, 3000);
  }
  
  function exportCSV(data, type) {
      if(!data.length) return;
      
      const allKeys = new Set();
      data.forEach(row => Object.keys(row).forEach(k => allKeys.add(k)));
      
      const headers = Array.from(allKeys);
      const bom = "\uFEFF";
      const headerRow = headers.join(',');
      
      const rows = data.map(row => {
          return headers.map(header => {
              let val = row[header] || '';
              val = String(val).replace(/"/g, '""').replace(/[\r\n]+/g, ' '); 
              return `"${val}"`;
          }).join(',');
      });
      
      const csvContent = [headerRow, ...rows].join('\n');
      const blob = new Blob([bom + csvContent], { type: 'text/csv;charset=utf-8;' });
      
      const a = document.createElement('a'); 
      a.href = URL.createObjectURL(blob); 
      a.download = `LI_${type}_${Date.now()}.csv`; 
      a.click();
  }

  // --- EVENT LISTENERS ---
  btnLikes.onclick = scrapeLikes;
  btnComments.onclick = scrapeComments;
  btnReposts.onclick = scrapeReposts;
  btnPeople.onclick = scrapePeople; 
  btnConnections.onclick = scrapeConnections;
  btnJobs.onclick = scrapeJobs;
  btnProfiles.onclick = scrapeProfilesFromFighters;
  refreshProfilesButtonState();
  
  console.log("рџљЂ Loaded: LinkedIn Parser v6.3 (Clean & Fixed)");
})();
