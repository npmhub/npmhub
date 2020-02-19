import 'webext-dynamic-content-scripts';
import addDomainPermissionToggle from 'webext-domain-permission-toggle';
import parseRepoUrl from './lib/parse-repo-url';

// GitHub Enterprise support
addDomainPermissionToggle();

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

  try {
    const response = await fetch(url);
    const pkg = await response.json();

    if (pkg.error) {
      throw new Error(pkg.error);
    }

    // Only store/pass the necessary info
    return {
      url: parseRepoUrl(pkg),
      description: pkg.description
    };
  } catch (error) {
    cache.delete(name); // Drop errors from cache

    return {
      error: error.message // Make error JSON.stringify-able
    };
  }
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
    promise.then(sendResponse);
    cache.set(name, promise);

    return true; // Required to signal intent to respond asynchronously
  }
});
