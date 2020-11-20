import githubInjection from 'github-injection';
import elementReady from './lib/element-ready';
import select from 'select-dom';
import App from './components/App.svelte';

function isPackageJson() {
  // Example URLs:
  // https://gitlab.com/gitlab-org/gitlab-foss/blob/master/package.json
  // https://github.com/npmhub/npmhub/blob/master/package.json
  const pathnameParts = window.location.pathname.split('/');
  return pathnameParts[3] === 'blob' && pathnameParts.pop() === 'package.json';
}

function hasPackageJson() {
  return Boolean(getPackageURL());
}

function getPackageURL() {
  const packageLink = select([
    '#files ~ div [title="package.json"]', // GitHub
    '.files [title="package.json"]', // GitHub before "Repository refresh"
    '.tree-item-file-name [title="package.json"]' // GitLab
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
        childList: true
      });
    });
  }

  if (
    select.exists('.npmhub-header') ||
    !(isPackageJson() || hasPackageJson())
  ) {
    return;
  }

  new App({
    props: {
      isPackageJson: isPackageJson(),
      packageURL: getPackageURL(),
      isGitLab: select.exists('.navbar-gitlab')
    },
    target: select([
      '.repository-content', // GitHub
      '.tree-content-holder', // GitLab
      '.blob-content-holder' // GitLab package.json page
    ])
  });
}

githubInjection(init);
