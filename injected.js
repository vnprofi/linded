<<<<<<< HEAD
(function() {
  // --- КОНФИГУРАЦИЯ ---
  const PAGE_SIZE_REACTIONS = 100;
  const PAGE_SIZE_COMMENTS = 50;
  const PAGE_SIZE_REPOSTS = 10;
  const MAX_PAGES = 50;
  const MAX_PEOPLE_PAGES = 100;
  const MAX_JOB_PAGES = 40; // Максимум страниц вакансий
  const REACTION_TYPES = ['LIKE', 'PRAISE', 'EMPATHY', 'INTEREST', 'ENTERTAINMENT', 'MAYBE'];

  let state = { postUrn: null, socialDetailUrn: null, shareUrn: null };
  let isScrapingPeople = false;
  let isScrapingConnections = false;
  let isScrapingJobs = false; // Флаг для парсинга вакансий

  // --- 1. UI (ИНТЕРФЕЙС) ---
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
  const titleArea = createEl('div', '', '🔥 LinkedIn Parser'); 
  
  const resetBtn = createEl('button', 'lip-reset-btn', '🔄 Сброс');
  resetBtn.title = "Очистить текущие ID постов";
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

  const statusLikes = createEl('div', 'lip-status', 'Жду клика по лайкам...');
  body.appendChild(statusLikes);

  const statusComments = createEl('div', 'lip-status', 'Жду клика по "Comments"...');
  body.appendChild(statusComments);

  const statusReposts = createEl('div', 'lip-status', 'Жду клика по "Reposts"...');
  body.appendChild(statusReposts);

  const statusPeople = createEl('div', 'lip-status', 'Жду страницу поиска людей...');
  body.appendChild(statusPeople);

  const statusConnections = createEl('div', 'lip-status', 'Жду страницу коннектов...');
  body.appendChild(statusConnections);

  const statusJobs = createEl('div', 'lip-status', 'Жду страницу вакансий...');
  body.appendChild(statusJobs);

  // BUTTONS
  const btnLikes = createEl('button', 'lip-btn', '👍 Собрать Лайки');
  btnLikes.disabled = true;
  body.appendChild(btnLikes);

  const btnComments = createEl('button', 'lip-btn', '💬 Собрать Комментарии');
  btnComments.disabled = true;
  body.appendChild(btnComments);

  const btnReposts = createEl('button', 'lip-btn', '🔄 Собрать Репосты');
  btnReposts.disabled = true;
  body.appendChild(btnReposts);

  const btnPeople = createEl('button', 'lip-btn', '🤼‍♂️ Собрать Бойцов');
  btnPeople.disabled = true;
  body.appendChild(btnPeople);

  const btnConnections = createEl('button', 'lip-btn', '🤝 Собрать Коннекты');
  btnConnections.disabled = true;
  body.appendChild(btnConnections);

  const btnJobs = createEl('button', 'lip-btn', '💼 Собрать Вакансии');
  btnJobs.disabled = true;
  body.appendChild(btnJobs);

  const contactBtn = createEl('a', 'lip-contact-btn', '✈️ Связаться (Telegram)');
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

  // --- ЛОГИКА ПЕРЕТАСКИВАНИЯ ---
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

  // --- 2. ЛОГИКА ПАРСИНГА ---

  function resetState() {
      state = { postUrn: null, socialDetailUrn: null, shareUrn: null };
      isScrapingPeople = false;
      isScrapingConnections = false;
      isScrapingJobs = false;
      
      statusLikes.innerHTML = 'Жду клика по лайкам...';
      statusLikes.className = 'lip-status';
      btnLikes.disabled = true;
      btnLikes.classList.remove('active');
      btnLikes.innerText = '👍 Собрать Лайки';

      statusComments.innerHTML = 'Жду клика по "Comments"...';
      statusComments.className = 'lip-status';
      btnComments.disabled = true;
      btnComments.classList.remove('active');
      btnComments.innerText = '💬 Собрать Комментарии';

      statusReposts.innerHTML = 'Жду клика по "Reposts"...';
      statusReposts.className = 'lip-status';
      btnReposts.disabled = true;
      btnReposts.classList.remove('active');
      btnReposts.innerText = '🔄 Собрать Репосты';

      statusPeople.innerHTML = 'Жду страницу поиска людей...';
      statusPeople.className = 'lip-status';
      btnPeople.disabled = false;
      btnPeople.classList.remove('active');
      btnPeople.innerText = '🤼‍♂️ Собрать Бойцов';

      statusConnections.innerHTML = 'Жду страницу коннектов...';
      statusConnections.className = 'lip-status';
      btnConnections.disabled = true;
      btnConnections.classList.remove('active');
      btnConnections.innerText = '🤝 Собрать Коннекты';

      statusJobs.innerHTML = 'Жду страницу вакансий...';
      statusJobs.className = 'lip-status';
      btnJobs.disabled = true;
      btnJobs.classList.remove('active');
      btnJobs.innerText = '💼 Собрать Вакансии';

      progressArea.style.display = 'none';
      console.log("🔄 Состояние сброшено.");
  }

  function updateUi(type) {
      if (type === 'LIKES') {
          statusLikes.innerHTML = `✅ <b>Лайки</b>: Готов собрать!`;
          statusLikes.classList.add('ready');
          btnLikes.disabled = false;
          btnLikes.classList.add('active');
          btnLikes.innerText = '👍 Нажми, чтобы скачать';
      }
      if (type === 'COMMENTS') {
          statusComments.innerHTML = `✅ <b>Комменты</b>: Готов собрать!`;
          statusComments.classList.add('ready');
          btnComments.disabled = false;
          btnComments.classList.add('active');
          btnComments.innerText = '💬 Нажми, чтобы скачать';
      }
      if (type === 'REPOSTS') {
          statusReposts.innerHTML = `✅ <b>Репосты</b>: Готов собрать!`;
          statusReposts.classList.add('ready');
          btnReposts.disabled = false;
          btnReposts.classList.add('active');
          btnReposts.innerText = '🔄 Нажми, чтобы скачать';
      }
      if (type === 'PEOPLE') {
          statusPeople.innerHTML = `✅ <b>Бойцы</b>: Вижу страницу поиска!`;
          statusPeople.classList.add('ready');
          if (!isScrapingPeople) {
              btnPeople.disabled = false;
              btnPeople.classList.add('active');
              btnPeople.innerText = '🤼‍♂️ Собрать Бойцов';
          }
      }
      if (type === 'CONNECTIONS') {
          statusConnections.innerHTML = `✅ <b>Коннекты</b>: Вижу список!`;
          statusConnections.classList.add('ready');
          if (!isScrapingConnections) {
              btnConnections.disabled = false;
              btnConnections.classList.add('active');
              btnConnections.innerText = '🤝 Собрать Коннекты';
          }
      }
      if (type === 'JOBS') {
          statusJobs.innerHTML = `✅ <b>Вакансии</b>: Вижу страницу!`;
          statusJobs.classList.add('ready');
          if (!isScrapingJobs) {
              btnJobs.disabled = false;
              btnJobs.classList.add('active');
              btnJobs.innerText = '💼 Собрать Вакансии';
          }
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

  // --- Авто-детектор страниц ---
  setInterval(() => {
      // 1. Поиск Людей
      const searchCards = document.querySelectorAll('div[data-view-name="people-search-result"]');
      if (searchCards.length > 0 && !isScrapingPeople) {
           if (btnPeople.disabled) updateUi('PEOPLE');
      } else if (searchCards.length === 0 && !btnPeople.disabled && !isScrapingPeople) {
          statusPeople.innerHTML = 'Жду страницу поиска людей...';
          statusPeople.className = 'lip-status';
          btnPeople.disabled = true;
          btnPeople.classList.remove('active');
          btnPeople.innerText = '🤼‍♂️ Собрать Бойцов';
      }

      // 2. Личные Коннекты
      const connectionsList = document.querySelector('div[data-view-name="connections-list"]');
      if (connectionsList && !isScrapingConnections) {
           if (btnConnections.disabled) updateUi('CONNECTIONS');
      } else if (!connectionsList && !btnConnections.disabled && !isScrapingConnections) {
          statusConnections.innerHTML = 'Жду страницу коннектов...';
          statusConnections.className = 'lip-status';
          btnConnections.disabled = true;
          btnConnections.classList.remove('active');
          btnConnections.innerText = '🤝 Собрать Коннекты';
      }

      // 3. Вакансии
      const jobsPage = window.location.href.includes('/jobs/search/');
      const jobCards = document.querySelectorAll('li[data-occludable-job-id]');
      if (jobsPage && jobCards.length > 0 && !isScrapingJobs) {
           if (btnJobs.disabled) updateUi('JOBS');
      } else if ((!jobsPage || jobCards.length === 0) && !btnJobs.disabled && !isScrapingJobs) {
          statusJobs.innerHTML = 'Жду страницу вакансий...';
          statusJobs.className = 'lip-status';
          btnJobs.disabled = true;
          btnJobs.classList.remove('active');
          btnJobs.innerText = '💼 Собрать Вакансии';
      }

  }, 2000); 

  // Перехватчики
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

  // --- 3. СКРАПЕРЫ API ---
  async function scrapeLikes() {
      if(!state.postUrn) return;
      btnLikes.disabled = true;
      showProgress(0, 'Запуск...');
      let allData = [];
      const csrf = getCsrf();

      for (let i = 0; i < REACTION_TYPES.length; i++) {
          const r = REACTION_TYPES[i];
          showProgress((i / REACTION_TYPES.length) * 100, `Лайки: ${r}`);
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
      showProgress(0, 'Запрос данных...');
      let allData = [];
      const csrf = getCsrf();

      for (let page = 0; page < MAX_PAGES; page++) {
          const start = page * PAGE_SIZE_COMMENTS;
          showProgress(page * 5, `Сбор комментов: стр. ${page + 1}`);

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
          alert('❌ ShareUrn не найден! Кликните на кнопку "Reposts" в посте.');
          btnReposts.disabled = false;
          return;
      }
      
      btnReposts.disabled = true;
      showProgress(0, 'Запуск сбора репостов...');
      let allData = [];
      const csrf = getCsrf();

      for (let page = 0; page < MAX_PAGES; page++) {
          const start = page * PAGE_SIZE_REPOSTS;
          showProgress((page / MAX_PAGES) * 100, `Репосты: стр. ${page + 1}`);

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
                      name = headerText.replace(/\s+поделился\(лась\).*$/i, '').replace(/\s+поделился.*$/i, '').trim();
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
                      if (update.actor && update.actor.subDescription) timeAgo = update.actor.subDescription.text?.replace(/\s+•.*$/, '').trim() || '';
                      if (update.commentary && update.commentary.text) repostText = update.commentary.text.text || '';
                      
                  } else if (update.actor) {
                      name = update.actor.name?.text || '';
                      headline = update.actor.description?.text || '';
                      profileLink = update.actor.navigationContext?.actionTarget || '';
                      timeAgo = update.actor.subDescription?.text?.replace(/\s+•.*$/, '').trim() || '';
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

  // --- 4. СКРАПЕР: БОЙЦЫ (DOM PARSER + PAGINATION) ---
  function parseCurrentPageFighters() {
      const cards = document.querySelectorAll('div[data-view-name="people-search-result"]');
      const pageData = [];
      cards.forEach((card) => {
          try {
              const titleElement = card.querySelector('[data-view-name="search-result-lockup-title"]');
              let name = "Не найдено", profileUrl = "";
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
              const textLines = Array.from(pTags).map(p => p.innerText.trim()).filter(text => text !== name && !text.startsWith('•'));
              if (textLines.length > 0) {
                  if (pTags[1]) jobTitle = pTags[1].innerText.trim();
                  if (pTags[2]) location = pTags[2].innerText.trim();
              }
              const insightElement = card.querySelector('.search-result-social-proof-insight, [data-view-name="search-result-social-proof-insight"]');
              if (insightElement) {
                   const parentP = insightElement.closest('p');
                   mutuals = parentP ? parentP.innerText.trim() : insightElement.innerText.trim();
              }
              pageData.push({ "Имя": name, "Должность": jobTitle, "Локация": location, "Профиль": profileUrl, "Общие контакты": mutuals, "Фото": photoUrl });
          } catch (e) {}
      });
      return pageData;
  }

  async function scrapePeople() {
      if (isScrapingPeople) {
          isScrapingPeople = false;
          btnPeople.innerText = '🛑 Завершаю...';
          return;
      }
      const initialCards = document.querySelectorAll('div[data-view-name="people-search-result"]');
      if (initialCards.length === 0) {
          alert("❌ Никого не нашел. Ты точно на странице поиска?");
          return;
      }
      isScrapingPeople = true;
      btnPeople.innerText = '⛔ Остановить сбор';
      btnPeople.classList.add('active'); 
      let allFighters = [];
      let pageNum = 1;

      while (isScrapingPeople && pageNum <= MAX_PEOPLE_PAGES) {
          showProgress((pageNum % 10) * 10, `Стр. ${pageNum}: сбор бойцов...`);
          const fightersOnPage = parseCurrentPageFighters();
          if (fightersOnPage.length > 0) {
              allFighters.push(...fightersOnPage);
              console.log(`✅ Стр. ${pageNum}: найдено ${fightersOnPage.length} (Всего: ${allFighters.length})`);
          } else {
              await sleep(2000); 
              const retry = parseCurrentPageFighters();
              if (retry.length > 0) allFighters.push(...retry);
          }
          progressText.innerText = `Стр. ${pageNum}: Собрано ${allFighters.length}`;
          if (!isScrapingPeople) break;
          const nextBtn = document.querySelector('button[data-testid="pagination-controls-next-button-visible"]');
          if (nextBtn && !nextBtn.disabled) {
              nextBtn.scrollIntoView({ behavior: 'smooth', block: 'center' });
              await sleep(500); 
              nextBtn.click();
              pageNum++;
              showProgress(0, `Переход на стр. ${pageNum}...`);
              const waitTime = 3000 + Math.random() * 2000;
              await sleep(waitTime);
          } else {
              break;
          }
      }
      isScrapingPeople = false;
      showProgress(100, `Готово! Всего бойцов: ${allFighters.length}`);
      await sleep(500);
      finishAndExport(allFighters, 'Fighters');
      btnPeople.innerText = '🤼‍♂️ Собрать Бойцов';
  }

  // --- 5. СКРАПЕР: КОННЕКТЫ (SCROLL & LOAD MORE) ---
  
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
    const btn = [...document.querySelectorAll("button")].find(b => b.innerText?.trim() === "Загрузить еще");
    if (!btn) return false;
    btn.scrollIntoView({ behavior: "smooth", block: "center" });
    await sleep(400);
    btn.click();
    return true;
  }

  async function scrapeConnections() {
      if (isScrapingConnections) {
          isScrapingConnections = false;
          btnConnections.innerText = '🛑 Завершаю...';
          return;
      }

      console.log("🤝 Начинаем сбор коннектов...");
      isScrapingConnections = true;
      btnConnections.innerText = '⛔ Остановить';
      btnConnections.classList.add('active');
      showProgress(0, 'Запуск прокрутки...');

      // ЦИКЛ ПРОКРУТКИ
      while (isScrapingConnections) {
          const currentCards = document.querySelectorAll('div[data-view-name="connections-list"] > div').length;
          progressText.innerText = `Прокрутка... Загружено: ${currentCards}`;
          
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

      showProgress(90, 'Сбор данных из DOM...');
      
      // СБОР ДАННЫХ
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
        const connectedAt = connectedEl?.innerText?.replace("Контакт установлен", "").trim() || "";

        const img = card.querySelector("img");
        const photoUrl = img?.src || "";
        const hasPhoto = photoUrl && !photoUrl.includes("data:image") ? "true" : "false";

        data.push({
          "Имя": name,
          "Профиль": profileUrl,
          "ID (Slug)": publicSlug,
          "Должность": title,
          "Дата коннекта": connectedAt,
          "Фото URL": photoUrl,
          "Есть фото?": hasPhoto
        });
      });

      isScrapingConnections = false;
      showProgress(100, `Готово! Собрано: ${data.length}`);
      await sleep(500);

      finishAndExport(data, 'Connections');
      btnConnections.innerText = '🤝 Собрать Коннекты';
  }

  // --- 6. ИСПРАВЛЕННЫЙ СКРАПЕР: ВАКАНСИИ (PAGINATION + FULL DATA + CLEANER) ---

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

  const sleep = ms => new Promise(r => setTimeout(r, ms));

  // 1) Очистка от HTML-мусора (возвращает чистый читаемый текст)
  const cleanJobDescription = (html) => {
      if (!html) return '';
      let text = html
          .replace(/<br\s*\/?>/gi, '\n')       // <br> -> новая строка
          .replace(/<\/p>/gi, '\n\n')          // </p> -> две новые строки
          .replace(/<\/li>/gi, '\n')           // </li> -> новая строка
          .replace(/<li>/gi, '• ')             // <li> -> красивый буллит
          .replace(/<[^>]+>/g, '')             // Удаляем ВСЕ остальные теги (h2, span, strong и т.д.)
          .replace(/&nbsp;/g, ' ')             // Неразрывные пробелы
          .replace(/&amp;/g, '&')
          .replace(/&quot;/g, '"')
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>')
          .replace(/\t/g, ' ')                 // Табы
          .replace(/ +/g, ' ');                // Лишние двойные пробелы
      
      // Удаляем пустые строки подряд и тримим
      return text.split('\n').map(line => line.trim()).filter(line => line).join('\n');
  };

  // Ожидание загрузки правой панели
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

  // Парсинг полных данных вакансии
  function parseFullJobDetails(jobId, cardElement) {
      // 1. СБОР ДАННЫХ ИЗ КАРТОЧКИ (ПРАВЫЙ БЛОК)
      
      // 2) Исправляем SalaryCard: ищем по всем элементам списка, а не только второй
      const metaItems = Array.from(cardElement.querySelectorAll('.job-card-container__metadata-wrapper li'));
      let location = '';
      let salaryCard = '';
      
      metaItems.forEach(item => {
          const txt = item.textContent.trim().replace(/\s+/g, ' ');
          // Если есть валюта или слова "год/мес/yr/mo" и цифры - это зарплата
          if (/[₽$€£]/.test(txt) || (/\d/.test(txt) && /yr|mo|hr|год|мес/.test(txt.toLowerCase()))) {
              salaryCard = txt;
          } else if (!location) {
              location = txt; // Если это не зарплата и локация пуста - берем как локацию
          }
      });

      // 3) Исправляем ссылку (добавляем домен)
      let rawLink = getAttr(cardElement, 'a.job-card-container__link', 'href').split('?')[0];
      if (rawLink && !rawLink.startsWith('http')) {
          rawLink = 'https://www.linkedin.com' + rawLink;
      }

      const cardData = {
          ID: jobId,
          Title: getText(cardElement, '.job-card-list__title'),
          Company: getText(cardElement, '.artdeco-entity-lockup__subtitle'),
          Location: location,      // Исправлено
          SalaryCard: salaryCard,  // Исправлено
          Insight: getText(cardElement, '.job-card-list__insight'),
          FooterState: getText(cardElement, '.job-card-container__footer-item'),
          JobLink: rawLink,        // Исправлено
          LogoUrl: getAttr(cardElement, '.job-card-list__logo img', 'src')
      };

      // 2. СБОР ДАННЫХ ИЗ ДЕТАЛЕЙ (ЛЕВЫЙ БЛОК)
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
          const parts = text.split('·').map(s => s.trim());
          if (parts[0]) details.LocationFull = parts[0];
          if (parts[1]) details.PostedTime = parts[1];
          if (parts.length > 2) details.Applicants = parts.slice(2).join(', ');
      }

      const preferences = container.querySelectorAll('.job-details-fit-level-preferences button');
      const prefTexts = Array.from(preferences).map(b => getText(b)).filter(t => t);
      details.Tags = prefTexts.join(' | ');

      const salaryTag = prefTexts.find(t => t.includes('$') || t.includes('€') || t.includes('₽'));
      if (salaryTag) details.SalaryDetails = salaryTag;

      const descBox = container.querySelector('#job-details') || container.querySelector('.jobs-description__content');
      if (descBox) {
          // 4) Чистим мусор полностью
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
                         getText(applyBtn).toLowerCase().includes('простая');
          details.ApplyType = isEasy ? 'Easy Apply' : 'External';
      }

      return details;
  }

  async function scrapeJobs() {
      if (isScrapingJobs) {
          isScrapingJobs = false;
          btnJobs.innerText = '🛑 Завершаю...';
          return;
      }

      // Поиск контейнера скролла
      let scrollContainer = document.querySelector('.jobs-search-results-list') || 
                            document.querySelector('.scaffold-layout__list-container') || 
                            document.querySelector('.scaffold-layout__list');

      if (!scrollContainer) {
          const firstCard = document.querySelector('li[data-occludable-job-id]');
          if (firstCard) scrollContainer = firstCard.parentElement; 
      }

      if (!scrollContainer) {
          alert("❌ Не могу найти список вакансий. Обновите страницу.");
          return;
      }

      console.log("💼 Начинаем парсинг вакансий (Max 100 Pages)...");
      
      isScrapingJobs = true;
      btnJobs.innerText = '⛔ Остановить';
      btnJobs.classList.add('active');

      let allJobs = [];
      let processedGlobalIds = new Set();
      let pageNum = 1;
      const MAX_PAGES_LIMIT = 100;

      // --- ВНЕШНИЙ ЦИКЛ ПО СТРАНИЦАМ ---
      while (isScrapingJobs && pageNum <= MAX_PAGES_LIMIT) {
          showProgress(0, `Страница ${pageNum}: Обработка списка...`);
          
          let processedOnPage = 0;
          let noNewCount = 0;
          
          // --- ВНУТРЕННИЙ ЦИКЛ: ПРОКРУТКА ТЕКУЩЕГО СПИСКА ---
          while (isScrapingJobs) {
              const cards = Array.from(document.querySelectorAll('li[data-occludable-job-id]'));
              let foundNewOnScroll = false;

              for (const card of cards) {
                  if (!isScrapingJobs) break;

                  const jobId = card.getAttribute('data-occludable-job-id');
                  if (processedGlobalIds.has(jobId)) continue; 

                  foundNewOnScroll = true;

                  try {
                      // 1. Скролл к карточке
                      card.scrollIntoView({ behavior: 'auto', block: 'center' });
                      
                      const cardTitle = getText(card, '.job-card-list__title');
                      progressText.innerText = `Стр.${pageNum} [${allJobs.length}]: ${cardTitle.substring(0, 20)}...`;

                      // 2. Клик
                      const clickTarget = card.querySelector('.job-card-list__title') || card.querySelector('.job-card-container');
                      if (clickTarget) clickTarget.click();
                      else card.click();

                      // 3. Ждем загрузки деталей
                      const loaded = await waitForDetailsToLoad(cardTitle);
                      if (!loaded) {
                          card.click(); // Повтор клика
                          await sleep(1500);
                      } else {
                          await sleep(600); 
                      }

                      // 4. Парсинг
                      const jobData = parseFullJobDetails(jobId, card);
                      
                      allJobs.push(jobData);
                      processedGlobalIds.add(jobId);
                      processedOnPage++;
                      
                      console.log(`✅ ${jobData.Title} | ${jobData.Company}`);
                      
                      await sleep(300 + Math.random() * 400);

                  } catch (e) {
                      console.error("Error parsing job:", e);
                  }
              }

              if (!isScrapingJobs) break;

              // Скролл контейнера вниз
              const beforeScroll = scrollContainer.scrollTop;
              scrollContainer.scrollBy({ top: scrollContainer.clientHeight, behavior: 'smooth' });
              
              await sleep(2000); // Ждем подгрузку

              // Проверка конца списка
              const isAtBottom = (scrollContainer.scrollTop + scrollContainer.clientHeight >= scrollContainer.scrollHeight - 50);
              const isStuck = (Math.ceil(scrollContainer.scrollTop) === Math.ceil(beforeScroll));

              if (isAtBottom || (isStuck && !foundNewOnScroll)) {
                  noNewCount++;
              } else {
                  noNewCount = 0;
              }

              if (noNewCount >= 3) break; // Список кончился
          }

          console.log(`🏁 Страница ${pageNum} завершена. Собрано на странице: ${processedOnPage}`);

          if (!isScrapingJobs) break;

          // --- ПЕРЕХОД НА СЛЕДУЮЩУЮ СТРАНИЦУ ---
          const nextBtn = document.querySelector('button.jobs-search-pagination__button--next') || 
                          document.querySelector('button[aria-label="См. следующую страницу"]');

          if (nextBtn && !nextBtn.disabled) {
              progressText.innerText = `Переход на страницу ${pageNum + 1}...`;
              nextBtn.scrollIntoView({ behavior: 'smooth', block: 'center' });
              await sleep(1000);
              nextBtn.click();
              
              pageNum++;
              // Ждем загрузки нового списка
              await sleep(4000); 
              
              // Обновляем контейнер
              scrollContainer = document.querySelector('.jobs-search-results-list') || 
                                document.querySelector('.scaffold-layout__list-container') ||
                                document.querySelector('.scaffold-layout__list');
              
              if(scrollContainer) scrollContainer.scrollTop = 0;

          } else {
              console.log("Пагинация завершена (кнопка Next не найдена или неактивна).");
              break;
          }
      }

      isScrapingJobs = false;
      showProgress(100, `Готово! Всего вакансий: ${allJobs.length}`);
      
      finishAndExport(allJobs, 'Jobs_Clean');
      btnJobs.innerText = '💼 Собрать Вакансии';
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
          progressText.innerText = `Сохраняю ${data.length} строк...`; 
          exportCSV(data, type); 
      } else { 
          progressText.innerText = 'Ничего не найдено.'; 
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
  
  console.log("🚀 Loaded: LinkedIn Parser v6.3 (Clean & Fixed)");
=======
(function() {
  // --- КОНФИГУРАЦИЯ ---
  const PAGE_SIZE_REACTIONS = 100;
  const PAGE_SIZE_COMMENTS = 50;
  const PAGE_SIZE_REPOSTS = 10;
  const MAX_PAGES = 50;
  const MAX_PEOPLE_PAGES = 100;
  const MAX_JOB_PAGES = 40; // Максимум страниц вакансий
  const REACTION_TYPES = ['LIKE', 'PRAISE', 'EMPATHY', 'INTEREST', 'ENTERTAINMENT', 'MAYBE'];

  let state = { postUrn: null, socialDetailUrn: null, shareUrn: null };
  let isScrapingPeople = false;
  let isScrapingConnections = false;
  let isScrapingJobs = false; // Флаг для парсинга вакансий

  // --- 1. UI (ИНТЕРФЕЙС) ---
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
  const titleArea = createEl('div', '', '🔥 LinkedIn Parser'); 
  
  const resetBtn = createEl('button', 'lip-reset-btn', '🔄 Сброс');
  resetBtn.title = "Очистить текущие ID постов";
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

  const statusLikes = createEl('div', 'lip-status', 'Жду клика по лайкам...');
  body.appendChild(statusLikes);

  const statusComments = createEl('div', 'lip-status', 'Жду клика по "Comments"...');
  body.appendChild(statusComments);

  const statusReposts = createEl('div', 'lip-status', 'Жду клика по "Reposts"...');
  body.appendChild(statusReposts);

  const statusPeople = createEl('div', 'lip-status', 'Жду страницу поиска людей...');
  body.appendChild(statusPeople);

  const statusConnections = createEl('div', 'lip-status', 'Жду страницу коннектов...');
  body.appendChild(statusConnections);

  const statusJobs = createEl('div', 'lip-status', 'Жду страницу вакансий...');
  body.appendChild(statusJobs);

  // BUTTONS
  const btnLikes = createEl('button', 'lip-btn', '👍 Собрать Лайки');
  btnLikes.disabled = true;
  body.appendChild(btnLikes);

  const btnComments = createEl('button', 'lip-btn', '💬 Собрать Комментарии');
  btnComments.disabled = true;
  body.appendChild(btnComments);

  const btnReposts = createEl('button', 'lip-btn', '🔄 Собрать Репосты');
  btnReposts.disabled = true;
  body.appendChild(btnReposts);

  const btnPeople = createEl('button', 'lip-btn', '🤼‍♂️ Собрать Бойцов');
  btnPeople.disabled = true;
  body.appendChild(btnPeople);

  const btnConnections = createEl('button', 'lip-btn', '🤝 Собрать Коннекты');
  btnConnections.disabled = true;
  body.appendChild(btnConnections);

  const btnJobs = createEl('button', 'lip-btn', '💼 Собрать Вакансии');
  btnJobs.disabled = true;
  body.appendChild(btnJobs);

  const contactBtn = createEl('a', 'lip-contact-btn', '✈️ Связаться (Telegram)');
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

  // --- ЛОГИКА ПЕРЕТАСКИВАНИЯ ---
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

  // --- 2. ЛОГИКА ПАРСИНГА ---

  function resetState() {
      state = { postUrn: null, socialDetailUrn: null, shareUrn: null };
      isScrapingPeople = false;
      isScrapingConnections = false;
      isScrapingJobs = false;
      
      statusLikes.innerHTML = 'Жду клика по лайкам...';
      statusLikes.className = 'lip-status';
      btnLikes.disabled = true;
      btnLikes.classList.remove('active');
      btnLikes.innerText = '👍 Собрать Лайки';

      statusComments.innerHTML = 'Жду клика по "Comments"...';
      statusComments.className = 'lip-status';
      btnComments.disabled = true;
      btnComments.classList.remove('active');
      btnComments.innerText = '💬 Собрать Комментарии';

      statusReposts.innerHTML = 'Жду клика по "Reposts"...';
      statusReposts.className = 'lip-status';
      btnReposts.disabled = true;
      btnReposts.classList.remove('active');
      btnReposts.innerText = '🔄 Собрать Репосты';

      statusPeople.innerHTML = 'Жду страницу поиска людей...';
      statusPeople.className = 'lip-status';
      btnPeople.disabled = false;
      btnPeople.classList.remove('active');
      btnPeople.innerText = '🤼‍♂️ Собрать Бойцов';

      statusConnections.innerHTML = 'Жду страницу коннектов...';
      statusConnections.className = 'lip-status';
      btnConnections.disabled = true;
      btnConnections.classList.remove('active');
      btnConnections.innerText = '🤝 Собрать Коннекты';

      statusJobs.innerHTML = 'Жду страницу вакансий...';
      statusJobs.className = 'lip-status';
      btnJobs.disabled = true;
      btnJobs.classList.remove('active');
      btnJobs.innerText = '💼 Собрать Вакансии';

      progressArea.style.display = 'none';
      console.log("🔄 Состояние сброшено.");
  }

  function updateUi(type) {
      if (type === 'LIKES') {
          statusLikes.innerHTML = `✅ <b>Лайки</b>: Готов собрать!`;
          statusLikes.classList.add('ready');
          btnLikes.disabled = false;
          btnLikes.classList.add('active');
          btnLikes.innerText = '👍 Нажми, чтобы скачать';
      }
      if (type === 'COMMENTS') {
          statusComments.innerHTML = `✅ <b>Комменты</b>: Готов собрать!`;
          statusComments.classList.add('ready');
          btnComments.disabled = false;
          btnComments.classList.add('active');
          btnComments.innerText = '💬 Нажми, чтобы скачать';
      }
      if (type === 'REPOSTS') {
          statusReposts.innerHTML = `✅ <b>Репосты</b>: Готов собрать!`;
          statusReposts.classList.add('ready');
          btnReposts.disabled = false;
          btnReposts.classList.add('active');
          btnReposts.innerText = '🔄 Нажми, чтобы скачать';
      }
      if (type === 'PEOPLE') {
          statusPeople.innerHTML = `✅ <b>Бойцы</b>: Вижу страницу поиска!`;
          statusPeople.classList.add('ready');
          if (!isScrapingPeople) {
              btnPeople.disabled = false;
              btnPeople.classList.add('active');
              btnPeople.innerText = '🤼‍♂️ Собрать Бойцов';
          }
      }
      if (type === 'CONNECTIONS') {
          statusConnections.innerHTML = `✅ <b>Коннекты</b>: Вижу список!`;
          statusConnections.classList.add('ready');
          if (!isScrapingConnections) {
              btnConnections.disabled = false;
              btnConnections.classList.add('active');
              btnConnections.innerText = '🤝 Собрать Коннекты';
          }
      }
      if (type === 'JOBS') {
          statusJobs.innerHTML = `✅ <b>Вакансии</b>: Вижу страницу!`;
          statusJobs.classList.add('ready');
          if (!isScrapingJobs) {
              btnJobs.disabled = false;
              btnJobs.classList.add('active');
              btnJobs.innerText = '💼 Собрать Вакансии';
          }
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

  // --- Авто-детектор страниц ---
  setInterval(() => {
      // 1. Поиск Людей
      const searchCards = document.querySelectorAll('div[data-view-name="people-search-result"]');
      if (searchCards.length > 0 && !isScrapingPeople) {
           if (btnPeople.disabled) updateUi('PEOPLE');
      } else if (searchCards.length === 0 && !btnPeople.disabled && !isScrapingPeople) {
          statusPeople.innerHTML = 'Жду страницу поиска людей...';
          statusPeople.className = 'lip-status';
          btnPeople.disabled = true;
          btnPeople.classList.remove('active');
          btnPeople.innerText = '🤼‍♂️ Собрать Бойцов';
      }

      // 2. Личные Коннекты
      const connectionsList = document.querySelector('div[data-view-name="connections-list"]');
      if (connectionsList && !isScrapingConnections) {
           if (btnConnections.disabled) updateUi('CONNECTIONS');
      } else if (!connectionsList && !btnConnections.disabled && !isScrapingConnections) {
          statusConnections.innerHTML = 'Жду страницу коннектов...';
          statusConnections.className = 'lip-status';
          btnConnections.disabled = true;
          btnConnections.classList.remove('active');
          btnConnections.innerText = '🤝 Собрать Коннекты';
      }

      // 3. Вакансии
      const jobsPage = window.location.href.includes('/jobs/search/');
      const jobCards = document.querySelectorAll('li[data-occludable-job-id]');
      if (jobsPage && jobCards.length > 0 && !isScrapingJobs) {
           if (btnJobs.disabled) updateUi('JOBS');
      } else if ((!jobsPage || jobCards.length === 0) && !btnJobs.disabled && !isScrapingJobs) {
          statusJobs.innerHTML = 'Жду страницу вакансий...';
          statusJobs.className = 'lip-status';
          btnJobs.disabled = true;
          btnJobs.classList.remove('active');
          btnJobs.innerText = '💼 Собрать Вакансии';
      }

  }, 2000); 

  // Перехватчики
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

  // --- 3. СКРАПЕРЫ API ---
  async function scrapeLikes() {
      if(!state.postUrn) return;
      btnLikes.disabled = true;
      showProgress(0, 'Запуск...');
      let allData = [];
      const csrf = getCsrf();

      for (let i = 0; i < REACTION_TYPES.length; i++) {
          const r = REACTION_TYPES[i];
          showProgress((i / REACTION_TYPES.length) * 100, `Лайки: ${r}`);
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
      showProgress(0, 'Запрос данных...');
      let allData = [];
      const csrf = getCsrf();

      for (let page = 0; page < MAX_PAGES; page++) {
          const start = page * PAGE_SIZE_COMMENTS;
          showProgress(page * 5, `Сбор комментов: стр. ${page + 1}`);

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
          alert('❌ ShareUrn не найден! Кликните на кнопку "Reposts" в посте.');
          btnReposts.disabled = false;
          return;
      }
      
      btnReposts.disabled = true;
      showProgress(0, 'Запуск сбора репостов...');
      let allData = [];
      const csrf = getCsrf();

      for (let page = 0; page < MAX_PAGES; page++) {
          const start = page * PAGE_SIZE_REPOSTS;
          showProgress((page / MAX_PAGES) * 100, `Репосты: стр. ${page + 1}`);

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
                      name = headerText.replace(/\s+поделился\(лась\).*$/i, '').replace(/\s+поделился.*$/i, '').trim();
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
                      if (update.actor && update.actor.subDescription) timeAgo = update.actor.subDescription.text?.replace(/\s+•.*$/, '').trim() || '';
                      if (update.commentary && update.commentary.text) repostText = update.commentary.text.text || '';
                      
                  } else if (update.actor) {
                      name = update.actor.name?.text || '';
                      headline = update.actor.description?.text || '';
                      profileLink = update.actor.navigationContext?.actionTarget || '';
                      timeAgo = update.actor.subDescription?.text?.replace(/\s+•.*$/, '').trim() || '';
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

  // --- 4. СКРАПЕР: БОЙЦЫ (DOM PARSER + PAGINATION) ---
  function parseCurrentPageFighters() {
      const cards = document.querySelectorAll('div[data-view-name="people-search-result"]');
      const pageData = [];
      cards.forEach((card) => {
          try {
              const titleElement = card.querySelector('[data-view-name="search-result-lockup-title"]');
              let name = "Не найдено", profileUrl = "";
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
              const textLines = Array.from(pTags).map(p => p.innerText.trim()).filter(text => text !== name && !text.startsWith('•'));
              if (textLines.length > 0) {
                  if (pTags[1]) jobTitle = pTags[1].innerText.trim();
                  if (pTags[2]) location = pTags[2].innerText.trim();
              }
              const insightElement = card.querySelector('.search-result-social-proof-insight, [data-view-name="search-result-social-proof-insight"]');
              if (insightElement) {
                   const parentP = insightElement.closest('p');
                   mutuals = parentP ? parentP.innerText.trim() : insightElement.innerText.trim();
              }
              pageData.push({ "Имя": name, "Должность": jobTitle, "Локация": location, "Профиль": profileUrl, "Общие контакты": mutuals, "Фото": photoUrl });
          } catch (e) {}
      });
      return pageData;
  }

  async function scrapePeople() {
      if (isScrapingPeople) {
          isScrapingPeople = false;
          btnPeople.innerText = '🛑 Завершаю...';
          return;
      }
      const initialCards = document.querySelectorAll('div[data-view-name="people-search-result"]');
      if (initialCards.length === 0) {
          alert("❌ Никого не нашел. Ты точно на странице поиска?");
          return;
      }
      isScrapingPeople = true;
      btnPeople.innerText = '⛔ Остановить сбор';
      btnPeople.classList.add('active'); 
      let allFighters = [];
      let pageNum = 1;

      while (isScrapingPeople && pageNum <= MAX_PEOPLE_PAGES) {
          showProgress((pageNum % 10) * 10, `Стр. ${pageNum}: сбор бойцов...`);
          const fightersOnPage = parseCurrentPageFighters();
          if (fightersOnPage.length > 0) {
              allFighters.push(...fightersOnPage);
              console.log(`✅ Стр. ${pageNum}: найдено ${fightersOnPage.length} (Всего: ${allFighters.length})`);
          } else {
              await sleep(2000); 
              const retry = parseCurrentPageFighters();
              if (retry.length > 0) allFighters.push(...retry);
          }
          progressText.innerText = `Стр. ${pageNum}: Собрано ${allFighters.length}`;
          if (!isScrapingPeople) break;
          const nextBtn = document.querySelector('button[data-testid="pagination-controls-next-button-visible"]');
          if (nextBtn && !nextBtn.disabled) {
              nextBtn.scrollIntoView({ behavior: 'smooth', block: 'center' });
              await sleep(500); 
              nextBtn.click();
              pageNum++;
              showProgress(0, `Переход на стр. ${pageNum}...`);
              const waitTime = 3000 + Math.random() * 2000;
              await sleep(waitTime);
          } else {
              break;
          }
      }
      isScrapingPeople = false;
      showProgress(100, `Готово! Всего бойцов: ${allFighters.length}`);
      await sleep(500);
      finishAndExport(allFighters, 'Fighters');
      btnPeople.innerText = '🤼‍♂️ Собрать Бойцов';
  }

  // --- 5. СКРАПЕР: КОННЕКТЫ (SCROLL & LOAD MORE) ---
  
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
    const btn = [...document.querySelectorAll("button")].find(b => b.innerText?.trim() === "Загрузить еще");
    if (!btn) return false;
    btn.scrollIntoView({ behavior: "smooth", block: "center" });
    await sleep(400);
    btn.click();
    return true;
  }

  async function scrapeConnections() {
      if (isScrapingConnections) {
          isScrapingConnections = false;
          btnConnections.innerText = '🛑 Завершаю...';
          return;
      }

      console.log("🤝 Начинаем сбор коннектов...");
      isScrapingConnections = true;
      btnConnections.innerText = '⛔ Остановить';
      btnConnections.classList.add('active');
      showProgress(0, 'Запуск прокрутки...');

      // ЦИКЛ ПРОКРУТКИ
      while (isScrapingConnections) {
          const currentCards = document.querySelectorAll('div[data-view-name="connections-list"] > div').length;
          progressText.innerText = `Прокрутка... Загружено: ${currentCards}`;
          
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

      showProgress(90, 'Сбор данных из DOM...');
      
      // СБОР ДАННЫХ
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
        const connectedAt = connectedEl?.innerText?.replace("Контакт установлен", "").trim() || "";

        const img = card.querySelector("img");
        const photoUrl = img?.src || "";
        const hasPhoto = photoUrl && !photoUrl.includes("data:image") ? "true" : "false";

        data.push({
          "Имя": name,
          "Профиль": profileUrl,
          "ID (Slug)": publicSlug,
          "Должность": title,
          "Дата коннекта": connectedAt,
          "Фото URL": photoUrl,
          "Есть фото?": hasPhoto
        });
      });

      isScrapingConnections = false;
      showProgress(100, `Готово! Собрано: ${data.length}`);
      await sleep(500);

      finishAndExport(data, 'Connections');
      btnConnections.innerText = '🤝 Собрать Коннекты';
  }

  // --- 6. ИСПРАВЛЕННЫЙ СКРАПЕР: ВАКАНСИИ (PAGINATION + FULL DATA + CLEANER) ---

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

  const sleep = ms => new Promise(r => setTimeout(r, ms));

  // 1) Очистка от HTML-мусора (возвращает чистый читаемый текст)
  const cleanJobDescription = (html) => {
      if (!html) return '';
      let text = html
          .replace(/<br\s*\/?>/gi, '\n')       // <br> -> новая строка
          .replace(/<\/p>/gi, '\n\n')          // </p> -> две новые строки
          .replace(/<\/li>/gi, '\n')           // </li> -> новая строка
          .replace(/<li>/gi, '• ')             // <li> -> красивый буллит
          .replace(/<[^>]+>/g, '')             // Удаляем ВСЕ остальные теги (h2, span, strong и т.д.)
          .replace(/&nbsp;/g, ' ')             // Неразрывные пробелы
          .replace(/&amp;/g, '&')
          .replace(/&quot;/g, '"')
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>')
          .replace(/\t/g, ' ')                 // Табы
          .replace(/ +/g, ' ');                // Лишние двойные пробелы
      
      // Удаляем пустые строки подряд и тримим
      return text.split('\n').map(line => line.trim()).filter(line => line).join('\n');
  };

  // Ожидание загрузки правой панели
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

  // Парсинг полных данных вакансии
  function parseFullJobDetails(jobId, cardElement) {
      // 1. СБОР ДАННЫХ ИЗ КАРТОЧКИ (ПРАВЫЙ БЛОК)
      
      // 2) Исправляем SalaryCard: ищем по всем элементам списка, а не только второй
      const metaItems = Array.from(cardElement.querySelectorAll('.job-card-container__metadata-wrapper li'));
      let location = '';
      let salaryCard = '';
      
      metaItems.forEach(item => {
          const txt = item.textContent.trim().replace(/\s+/g, ' ');
          // Если есть валюта или слова "год/мес/yr/mo" и цифры - это зарплата
          if (/[₽$€£]/.test(txt) || (/\d/.test(txt) && /yr|mo|hr|год|мес/.test(txt.toLowerCase()))) {
              salaryCard = txt;
          } else if (!location) {
              location = txt; // Если это не зарплата и локация пуста - берем как локацию
          }
      });

      // 3) Исправляем ссылку (добавляем домен)
      let rawLink = getAttr(cardElement, 'a.job-card-container__link', 'href').split('?')[0];
      if (rawLink && !rawLink.startsWith('http')) {
          rawLink = 'https://www.linkedin.com' + rawLink;
      }

      const cardData = {
          ID: jobId,
          Title: getText(cardElement, '.job-card-list__title'),
          Company: getText(cardElement, '.artdeco-entity-lockup__subtitle'),
          Location: location,      // Исправлено
          SalaryCard: salaryCard,  // Исправлено
          Insight: getText(cardElement, '.job-card-list__insight'),
          FooterState: getText(cardElement, '.job-card-container__footer-item'),
          JobLink: rawLink,        // Исправлено
          LogoUrl: getAttr(cardElement, '.job-card-list__logo img', 'src')
      };

      // 2. СБОР ДАННЫХ ИЗ ДЕТАЛЕЙ (ЛЕВЫЙ БЛОК)
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
          const parts = text.split('·').map(s => s.trim());
          if (parts[0]) details.LocationFull = parts[0];
          if (parts[1]) details.PostedTime = parts[1];
          if (parts.length > 2) details.Applicants = parts.slice(2).join(', ');
      }

      const preferences = container.querySelectorAll('.job-details-fit-level-preferences button');
      const prefTexts = Array.from(preferences).map(b => getText(b)).filter(t => t);
      details.Tags = prefTexts.join(' | ');

      const salaryTag = prefTexts.find(t => t.includes('$') || t.includes('€') || t.includes('₽'));
      if (salaryTag) details.SalaryDetails = salaryTag;

      const descBox = container.querySelector('#job-details') || container.querySelector('.jobs-description__content');
      if (descBox) {
          // 4) Чистим мусор полностью
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
                         getText(applyBtn).toLowerCase().includes('простая');
          details.ApplyType = isEasy ? 'Easy Apply' : 'External';
      }

      return details;
  }

  async function scrapeJobs() {
      if (isScrapingJobs) {
          isScrapingJobs = false;
          btnJobs.innerText = '🛑 Завершаю...';
          return;
      }

      // Поиск контейнера скролла
      let scrollContainer = document.querySelector('.jobs-search-results-list') || 
                            document.querySelector('.scaffold-layout__list-container') || 
                            document.querySelector('.scaffold-layout__list');

      if (!scrollContainer) {
          const firstCard = document.querySelector('li[data-occludable-job-id]');
          if (firstCard) scrollContainer = firstCard.parentElement; 
      }

      if (!scrollContainer) {
          alert("❌ Не могу найти список вакансий. Обновите страницу.");
          return;
      }

      console.log("💼 Начинаем парсинг вакансий (Max 100 Pages)...");
      
      isScrapingJobs = true;
      btnJobs.innerText = '⛔ Остановить';
      btnJobs.classList.add('active');

      let allJobs = [];
      let processedGlobalIds = new Set();
      let pageNum = 1;
      const MAX_PAGES_LIMIT = 100;

      // --- ВНЕШНИЙ ЦИКЛ ПО СТРАНИЦАМ ---
      while (isScrapingJobs && pageNum <= MAX_PAGES_LIMIT) {
          showProgress(0, `Страница ${pageNum}: Обработка списка...`);
          
          let processedOnPage = 0;
          let noNewCount = 0;
          
          // --- ВНУТРЕННИЙ ЦИКЛ: ПРОКРУТКА ТЕКУЩЕГО СПИСКА ---
          while (isScrapingJobs) {
              const cards = Array.from(document.querySelectorAll('li[data-occludable-job-id]'));
              let foundNewOnScroll = false;

              for (const card of cards) {
                  if (!isScrapingJobs) break;

                  const jobId = card.getAttribute('data-occludable-job-id');
                  if (processedGlobalIds.has(jobId)) continue; 

                  foundNewOnScroll = true;

                  try {
                      // 1. Скролл к карточке
                      card.scrollIntoView({ behavior: 'auto', block: 'center' });
                      
                      const cardTitle = getText(card, '.job-card-list__title');
                      progressText.innerText = `Стр.${pageNum} [${allJobs.length}]: ${cardTitle.substring(0, 20)}...`;

                      // 2. Клик
                      const clickTarget = card.querySelector('.job-card-list__title') || card.querySelector('.job-card-container');
                      if (clickTarget) clickTarget.click();
                      else card.click();

                      // 3. Ждем загрузки деталей
                      const loaded = await waitForDetailsToLoad(cardTitle);
                      if (!loaded) {
                          card.click(); // Повтор клика
                          await sleep(1500);
                      } else {
                          await sleep(600); 
                      }

                      // 4. Парсинг
                      const jobData = parseFullJobDetails(jobId, card);
                      
                      allJobs.push(jobData);
                      processedGlobalIds.add(jobId);
                      processedOnPage++;
                      
                      console.log(`✅ ${jobData.Title} | ${jobData.Company}`);
                      
                      await sleep(300 + Math.random() * 400);

                  } catch (e) {
                      console.error("Error parsing job:", e);
                  }
              }

              if (!isScrapingJobs) break;

              // Скролл контейнера вниз
              const beforeScroll = scrollContainer.scrollTop;
              scrollContainer.scrollBy({ top: scrollContainer.clientHeight, behavior: 'smooth' });
              
              await sleep(2000); // Ждем подгрузку

              // Проверка конца списка
              const isAtBottom = (scrollContainer.scrollTop + scrollContainer.clientHeight >= scrollContainer.scrollHeight - 50);
              const isStuck = (Math.ceil(scrollContainer.scrollTop) === Math.ceil(beforeScroll));

              if (isAtBottom || (isStuck && !foundNewOnScroll)) {
                  noNewCount++;
              } else {
                  noNewCount = 0;
              }

              if (noNewCount >= 3) break; // Список кончился
          }

          console.log(`🏁 Страница ${pageNum} завершена. Собрано на странице: ${processedOnPage}`);

          if (!isScrapingJobs) break;

          // --- ПЕРЕХОД НА СЛЕДУЮЩУЮ СТРАНИЦУ ---
          const nextBtn = document.querySelector('button.jobs-search-pagination__button--next') || 
                          document.querySelector('button[aria-label="См. следующую страницу"]');

          if (nextBtn && !nextBtn.disabled) {
              progressText.innerText = `Переход на страницу ${pageNum + 1}...`;
              nextBtn.scrollIntoView({ behavior: 'smooth', block: 'center' });
              await sleep(1000);
              nextBtn.click();
              
              pageNum++;
              // Ждем загрузки нового списка
              await sleep(4000); 
              
              // Обновляем контейнер
              scrollContainer = document.querySelector('.jobs-search-results-list') || 
                                document.querySelector('.scaffold-layout__list-container') ||
                                document.querySelector('.scaffold-layout__list');
              
              if(scrollContainer) scrollContainer.scrollTop = 0;

          } else {
              console.log("Пагинация завершена (кнопка Next не найдена или неактивна).");
              break;
          }
      }

      isScrapingJobs = false;
      showProgress(100, `Готово! Всего вакансий: ${allJobs.length}`);
      
      finishAndExport(allJobs, 'Jobs_Clean');
      btnJobs.innerText = '💼 Собрать Вакансии';
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
          progressText.innerText = `Сохраняю ${data.length} строк...`; 
          exportCSV(data, type); 
      } else { 
          progressText.innerText = 'Ничего не найдено.'; 
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
  
  console.log("🚀 Loaded: LinkedIn Parser v6.3 (Clean & Fixed)");
>>>>>>> 8bf69d92ba0202c145548b57f570d9f389acab8d
})();