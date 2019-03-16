import domainPermissionToggle from 'webext-domain-permission-toggle';
import dynamicContentScripts from 'webext-dynamic-content-scripts';

// GitHub Enterprise support
dynamicContentScripts.addToFutureTabs();
domainPermissionToggle.addContextMenu();

// Let's avoid CORB introduced in Chrome 73 chromestatus.com/feature/5629709824032768
chrome.runtime.onMessage.addListener((
  {action, payload},
  sender,
  sendResponse
) => {
  if (action === 'fetch') {
    const {name} = payload;

    const url = `https://registry.npmjs.org/${encodeURIComponent(name)}`;

    fetch(url)
      .then(response => response.json())
      .then(json => sendResponse(json));

    return true; // We will respond asynchronously.
  }
});
