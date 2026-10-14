import {$, $optional, elementExists} from 'select-dom';
import App from './components/App.svelte';
import ScrollButton from './components/ScrollButton.svelte';

function isPackageJson() {
  // Example URLs:
  // https://github.com/npmhub/npmhub/blob/main/package.json
  const pathnameParts = window.location.pathname.split('/');
  return pathnameParts[3] === 'blob' && pathnameParts.pop() === 'package.json';
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

let app;
let appRoot;
let lastPackageURL;

async function init() {
  const packageURL = getPackageURL();

  // GitHub's React navigation keeps our list around, so only re-render when the package.json changes or the list was removed
  if (packageURL === lastPackageURL && (!packageURL || appRoot?.isConnected)) {
    return;
  }

  app?.$destroy();
  app = undefined;
  appRoot = undefined;
  lastPackageURL = packageURL;

  if (!packageURL) {
    return;
  }

  const target = $([
    '#repo-content-turbo-frame',
    '.repository-content', // Old container https://github.com/refined-github/refined-github/issues/5751
    '#repos-split-pane-content', // React layout, no Turbo frame
  ]);
  app = new App({
    props: {
      isPackageJson: isPackageJson(),
      packageURL,
    },
    target,
  });
  appRoot = target.lastElementChild;

  const position = $optional(['.BorderGrid-cell [href$=\'/forks\']'])?.parentElement;

  if (position && !elementExists('[href="#dependencies"]', position.parentElement)) {
    const frag = document.createDocumentFragment();

    new ScrollButton({target: frag});

    position.after(frag);
  }
}

init();

// https://github.com/refined-github/refined-github/blob/6c88bc3e4d29453d564c0466096ac97341b47529/source/feature-manager.tsx#L172
document.addEventListener('turbo:render', init);
document.addEventListener('soft-nav:react-done', init); // Also fired on back/forward
