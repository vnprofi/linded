// Инъекция скрипта в контекст страницы (Main World)
const script = document.createElement('script');
script.src = chrome.runtime.getURL('injected.js');
script.onload = function() {
    this.remove(); // Удаляем тег скрипта после загрузки, код остается в памяти
};
(document.head || document.documentElement).appendChild(script);