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

    // @ char (scoped repositories) is not escaped, only / is...
    const url = 'https://registry.npmjs.org/' + name.replace('/', '%2F');

    fetch(url)
      .then(response => response.json())
      .then(json => sendResponse(json));

    return true; // Required to signal intent to respond asynchronously
  }
});
