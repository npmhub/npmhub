import 'webext-dynamic-content-scripts';
import memoize from 'memoize';
import addPermissionToggle from 'webext-permission-toggle';
import parseRepoUrl from './lib/parse-repo-url.js';

// GitHub Enterprise support
addPermissionToggle();

const fetchPackageJson = memoize(async name => {
  console.log('fetching', name);
  // Scoped repositories contain an escaped slash and a regular at-sign
  // Example: https://registry.npmjs.org/@shinnn%2Feslint-config-node
  const url = 'https://registry.npmjs.org/' + name.replace('/', '%2F');

  const response = await fetch(url);
  const package_ = await response.json();

  if (package_.error) {
    throw new Error(package_.error);
  }

  // Only store/pass the necessary info
  return {
    url: parseRepoUrl(package_),
    description: package_.description,
  };
}, {
  maxAge: 1000 * 60 * 60 * 24,
});

// `background` fetch required to avoid avoid CORB introduced in Chrome 73 https://chromestatus.com/feature/5629709824032768
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message?.fetchPackageInfo) {
    fetchPackageJson(message.fetchPackageInfo).then(sendResponse, error => {
      sendResponse({
        error: error.message, // Make error JSON.stringify-able
      });

      // Throw it again so it appears in the background console
      throw error;
    });

    return true; // Required to signal intent to respond asynchronously
  }
});
