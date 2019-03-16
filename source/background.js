import domainPermissionToggle from 'webext-domain-permission-toggle';
import dynamicContentScripts from 'webext-dynamic-content-scripts';

// GitHub Enterprise support
dynamicContentScripts.addToFutureTabs();
domainPermissionToggle.addContextMenu();

// let's avoid CORB introduced in Chrome 73 chromestatus.com/feature/5629709824032768
chrome.runtime.onMessage.addListener(function(
  { action, payload },
  sender,
  sendResponse
) {
  if (action === "fetch") {
    const { name } = payload;

    var url = `https://registry.npmjs.org/${encodeURIComponent(name)}`;

    fetch(url)
      .then(response => response.json())
      .then(json => sendResponse(json));

    return true; // we will respond asynchronously.
  }
});
