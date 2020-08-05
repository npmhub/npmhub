import 'webext-dynamic-content-scripts';
import addDomainPermissionToggle from 'webext-domain-permission-toggle';
import pMemoize from 'p-memoize';
import parseRepoUrl from './lib/parse-repo-url';

// GitHub Enterprise support
addDomainPermissionToggle();

const fetchPackageJson = pMemoize(async name => {
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
    description: package_.description
  };
}, {
  maxAge: 1000 * 60 * 60 * 24
});

// `background` fetch required to avoid avoid CORB introduced in Chrome 73 https://chromestatus.com/feature/5629709824032768
chrome.runtime.onMessage.addListener((
  {action, payload},
  sender,
  sendResponse
) => {
  if (action === 'fetch') {
    const {name} = payload;

    fetchPackageJson(name)
      .catch(error => ({
        error: error.message // Make error JSON.stringify-able
      }))
      .then(sendResponse);

    return true; // Required to signal intent to respond asynchronously
  }
});

