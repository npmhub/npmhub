import domainPermissionToggle from 'webext-domain-permission-toggle';
import dynamicContentScripts from 'webext-dynamic-content-scripts';

// GitHub Enterprise support
dynamicContentScripts.addToFutureTabs();
domainPermissionToggle.addContextMenu();

const cache = new Map();
const cacheLimit = 1000;

window.npmhubCache = cache;

// Trim cache twice-daily in long browser sessions
setInterval(() => {
  for (const name of cache) {
    if (cache.size < cacheLimit) {
      return;
    }

    cache.delete(name);
  }
}, 12 * 60 * 60 * 1000);

async function fetchPackageJson(name) {
  // Scoped repositories contain an escaped slash and a regular at-sign
  // Example: https://registry.npmjs.org/@shinnn%2Feslint-config-node
  const url = 'https://registry.npmjs.org/' + name.replace('/', '%2F');
  const response = await fetch(url);
  return response.json();
}

// `background` fetch required to avoid avoid CORB introduced in Chrome 73 https://chromestatus.com/feature/5629709824032768
chrome.runtime.onMessage.addListener((
  {action, payload},
  sender,
  sendResponse
) => {
  if (action === 'fetch') {
    const {name} = payload;

    const promise = cache.get(name) || fetchPackageJson(name);

    promise.then(sendResponse, error => {
      cache.delete(name); // Drop errors from cache

      sendResponse({
        error: {
          title: error.title,
          message: error.message
        }
      });
    });

    cache.set(name, promise);

    return true; // Required to signal intent to respond asynchronously
  }
});
