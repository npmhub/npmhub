import githubInjection from 'github-injection';
import select from 'select-dom';
import App from './components/App.svelte';

function isPackageJson() {
  // Example URLs:
  // https://gitlab.com/gitlab-org/gitlab-foss/blob/master/package.json
  // https://github.com/npmhub/npmhub/blob/master/package.json
  const pathnameParts = location.pathname.split('/');
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
  if (select.exists('.npmhub-header') || !(isPackageJson() || hasPackageJson())) {
    return;
  }
  new App({
    props: {
      isPackageJson: isPackageJson(),
      packageURL: getPackageURL(),
      isGitLab: select.exists('.navbar-gitlab'),
    },
    target: select([
      '.repository-content', // GitHub
      '.tree-content-holder', // GitLab
      '.blob-content-holder' // GitLab package.json page
    ])
  });
}

githubInjection(init);
