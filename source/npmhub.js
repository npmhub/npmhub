import githubInjection from 'github-injection';
import elementReady from 'element-ready';
import App from './components/App.svelte';
import ScrollButton from './components/ScrollButton.svelte';

function isPackageJson() {
  // Example URLs:
  // https://github.com/npmhub/npmhub/blob/main/package.json
  const pathnameParts = window.location.pathname.split('/');
  return pathnameParts[3] === 'blob' && pathnameParts.pop() === 'package.json';
}

function hasPackageJson() {
  return Boolean(getPackageURL());
}

function getPackageURL() {
  if (isPackageJson()) {
    return location.origin + location.pathname;
  }

  // Example URLs:
  // https://github.com/npmhub/npmhub
  // https://github.com/eslint/eslint/tree/main/packages/eslint-config-eslint
  return document.querySelector([
    '.react-directory-filename-column [title="package.json"] a',
    '#files ~ div [title="package.json"]', // GitHub pre-2022 refresh
  ])?.href;
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
    || !hasPackageJson()
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

  const position = document.querySelector(['.BorderGrid-cell [href*=\'report-content\']'])?.parentElement;

  if (position) {
    const frag = document.createDocumentFragment();

    new ScrollButton({target: frag});

    position.before(frag);
  }
}

githubInjection(init);
