import domainPermissionToggle from 'webext-domain-permission-toggle';
import dynamicContentScripts from 'webext-dynamic-content-scripts';

// GitHub Enterprise support
dynamicContentScripts.addToFutureTabs();
domainPermissionToggle.addContextMenu();

// `background` fetch required to avoid avoid CORB introduced in Chrome 73 https://chromestatus.com/feature/5629709824032768
chrome.runtime.onMessage.addListener((
  {action, payload},
  sender,
  sendResponse
) => {
  if (action === 'fetch') {
    const {name} = payload;

    // Scoped repositories contain an escaped slash and a regular at-sign
    // Example: https://registry.npmjs.org/@shinnn%2Feslint-config-node
    const url = 'https://registry.npmjs.org/' + name.replace('/', '%2F');

    fetch(url)
      .then(response => response.json())
      .then(json => sendResponse(json))
      .catch(error => sendResponse({
        error: {
          title: error.title,
          message: error.message
        }
      }));

    return true; // Required to signal intent to respond asynchronously
  }
});
