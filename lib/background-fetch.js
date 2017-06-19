// /////////////////////////////////////////////////////// //
// Load content via window.fetch in a background script,   //
// from a content script                                   //
// /////////////////////////////////////////////////////// //
// Load this file as background and content scripts
// Use in content_script as:
// backgroundFetch(url).then(doSomething)

if (chrome.runtime.getBackgroundPage) {
  // Setup in background page
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'fetch') {
      fetch(...message.arguments)
      .then(response => response.json())
      .then(sendResponse)
      .catch(err => sendResponse(String(err)));
    }
    return true; // Tell browser to await response
  });
}

export default function backgroundFetch(...args) {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage({
      action: 'fetch',
      arguments: args
    }, response => {
      if (String(response).startsWith('Error')) {
        reject(new Error(response.replace(/Error:? ?/, '')));
      } else {
        resolve(response);
      }
    });
  });
}
