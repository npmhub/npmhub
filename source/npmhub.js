import githubInjection from 'github-injection';
import elementReady from 'element-ready';
import App from './components/App.svelte';

function isPackageJson() {
  // Example URLs:
  // https://github.com/npmhub/npmhub/blob/master/package.json
  const pathnameParts = window.location.pathname.split('/');
  return pathnameParts[3] === 'blob' && pathnameParts.pop() === 'package.json';
}

function hasPackageJson() {
  return Boolean(getPackageURL());
}

function getPackageURL() {
  const packageLink = document.querySelector([
    '#files ~ div [title="package.json"]', // GitHub
    '.files [title="package.json"]', // GitHub before "Repository refresh"
  ]);

  if (packageLink) {
    return packageLink.href;
  }
}

async function init() {
  // If this fragment exists, then the list is deferred.
  // Adapted from https://github.com/sindresorhus/refined-github/blob/b141596/source/github-events/on-file-list-update.ts
  const ajaxFiles = await elementReady('#files ~ include-fragment[src*="/file-list/"]');
  if (ajaxFiles) {
    await new Promise(resolve => {
      new MutationObserver(resolve).observe(ajaxFiles.parentNode, {
        childList: true,
      });
    });
  }

  if (
    document.querySelector('.npmhub-header')
    || !(isPackageJson() || hasPackageJson())
  ) {
    return;
  }

  new App({
    props: {
      isPackageJson: isPackageJson(),
      packageURL: getPackageURL(),
    },
    target: document.querySelector([
      '#repo-content-turbo-frame',
      '.repository-content', // Old container https://github.com/refined-github/refined-github/issues/5751
    ]),
  });
}

githubInjection(init);
