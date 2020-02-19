import {escape as esc} from 'escape-goat';
import githubInjection from 'github-injection';
import select from 'select-dom';
import doma from 'doma';
import elementReady from './lib/element-ready';
import fetchDom from './lib/fetch-dom';

const errorMessage = 'npmhub: there was an error while';

async function fetchPackageInfo(name) {
  // Get the data from NPM registry via background.js
  // due to CORB policies introduced in Chrome 73
  return new Promise(resolve =>
    chrome.runtime.sendMessage(
      {action: 'fetch', payload: {name}},
      resolve
    )
  );
}

function isGitLab() {
  return select.exists('.navbar-gitlab');
}

function isPackageJson() {
  // Example URLs:
  // https://gitlab.com/gitlab-org/gitlab-foss/blob/master/package.json
  // https://github.com/npmhub/npmhub/blob/master/package.json
  const pathnameParts = location.pathname.split('/');
  return pathnameParts[3] === 'blob' && pathnameParts.pop() === 'package.json';
}

function addHeaderLink(box, name, url) {
  box.firstElementChild.prepend(doma(`
    <a class="btn btn-sm BtnGroup-item" href="${url}">${name}</a>
  `));
}

function hasPackageJson() {
  return Boolean(getPackageURL());
}

function getPackageURL() {
  const packageLink = select([
    '.files [title="package.json"]', // GitHub
    '.tree-item-file-name [title="package.json"]' // GitLab
  ].join(','));
  if (packageLink) {
    return packageLink.href;
  }
}

async function getPackageJson() {
  // GitLab will return raw JSON so we can use that directly
  // https://gitlab.com/user/repo/raw/master/package.json
  if (!isPackageJson() && isGitLab()) {
    const url = getPackageURL().replace(/(gitlab[.]com[/].+[/].+[/])blob/, '$1raw');
    const response = await fetch(url);
    return response.json();
  }

  // If it's a package.json page, use the local dom
  const document_ = isPackageJson() ? document : await fetchDom(getPackageURL());

  const jsonBlobElement = await elementReady([
    '.blob-wrapper table', // GitHub
    '.blob-viewer pre' // GitLab, defers content load so it needs `elementReady`
  ], document_);

  return JSON.parse(jsonBlobElement.textContent);
}

function createBox(title, container) {
  /* eslint-disable indent */
  const box = doma.one(`
    <div class="Box Box--condensed mt-5 file-holder">
      <div class="npmhub-header BtnGroup"></div>
      ${
        isGitLab() ?
        `<div class="file-title"><strong>${title}</strong></div>` :
        `<h3 class="Box-header Box-title px-2">${title}</h3>`
      }
      <ol class="npmhub-deps markdown-body"></ol>
    </div>
  `);
  /* eslint-enable indent */

  container.append(box);
  return box;
}

async function addDependency(name, container) {
  const depEl = doma.one(`
    <li>
      <a href='https://www.npmjs.com/package/${esc(name)}'>
        ${esc(name)}
      </a>
    </li>
  `);
  container.append(depEl);

  const {url, description, error} = await fetchPackageInfo(name);

  if (error) {
    if (error === 'Not found') {
      depEl.append(doma('<em>Not published or private.</em>'));
    } else {
      console.warn(`${errorMessage} fetching ${esc(name)}/package.json`, error);
      depEl.append(doma('<em>There was a network error.</em>'));
    }

    return;
  }

  depEl.append(description);

  if (url) {
    depEl.querySelector('a').href = url;
  }
}

function addDependencies(containerEl, list) {
  const listEl = containerEl.querySelector('.npmhub-deps');
  if (!list) {
    listEl.append(doma(`
      <li class="npmhub-empty">
        <em>There was a network error.</em>
      </li>
    `));
  } else if (list.length > 0) {
    for (const name of list) {
      addDependency(name, listEl);
    }
  } else {
    listEl.append(doma(`
      <li class="npmhub-empty">
        No dependencies!
        <g-emoji class="g-emoji" alias="tada" fallback-src="https://github.githubassets.com/images/icons/emoji/unicode/1f389.png">🎉</g-emoji>
      </li>
    `));
  }
}

async function init() {
  if (select.exists('.npmhub-header') || !(isPackageJson() || hasPackageJson())) {
    return;
  }

  const container = select([
    '.repository-content', // GitHub
    '.tree-content-holder', // GitLab
    '.blob-content-holder' // GitLab package.json page
  ].join(','));

  const dependenciesBox = createBox('Dependencies', container);
  if (!isPackageJson()) {
    addHeaderLink(dependenciesBox, 'package.json', getPackageURL());
  }

  let pkg;
  try {
    pkg = await getPackageJson();
  } catch (error) {
    addDependencies(dependenciesBox, false);
    console.warn(`${errorMessage} fetching the current package.json from ${location.hostname}`, error);
    return;
  }

  const dependencies = Object.keys(pkg.dependencies || {});
  addDependencies(dependenciesBox, dependencies);

  const types = [
    'Peer',
    'Bundled',
    'Optional',
    'Dev'
  ];
  for (const depType of types) {
    let list = pkg[depType.toLowerCase() + 'Dependencies'] || [];
    if (!Array.isArray(list)) {
      list = Object.keys(list);
    }

    if (list.length > 0) {
      addDependencies(createBox(`${depType} Dependencies`, container), list);
    }
  }

  if (!pkg.private && pkg.name) {
    // Does the current package exist on npm?
    const {error} = await fetchPackageInfo(pkg.name);
    if (error) {
      if (error.message !== 'Not found') {
        console.warn(`${errorMessage} pinging the current package on npmjs.org`, error);
      }

      return;
    }

    addHeaderLink(
      dependenciesBox,
      'npmjs.com',
      `https://www.npmjs.com/package/${esc(pkg.name)}`
    );
    addHeaderLink(
      dependenciesBox,
      'RunKit',
      `https://npm.runkit.com/${esc(pkg.name)}`
    );
    if (dependencies.length > 0) {
      addHeaderLink(
        dependenciesBox,
        'Visualize full tree',
        `http://npm.broofa.com/?q=${esc(pkg.name)}`
      );
    }
  }
}

githubInjection(init);
