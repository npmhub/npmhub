import githubInjection from 'github-injection';
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
  return document.querySelector(`
    .react-directory-filename-column :is(
      a[title="package.json"],
      [title="package.json"] a
    )
  `)?.href;
}

async function init() {
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

  const position = document.querySelector(['.BorderGrid-cell [href$=\'/forks\']'])?.parentElement;

  if (position) {
    const frag = document.createDocumentFragment();

    new ScrollButton({target: frag});

    position.after(frag);
  }
}

githubInjection(init);
