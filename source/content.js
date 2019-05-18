import 'webext-dynamic-content-scripts';
import {escape as esc} from 'escape-goat';
import githubInjection from 'github-injection';
import select from 'select-dom';
import doma from 'doma';
import elementReady from './lib/element-ready';

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
  const breadcrumb = select('.breadcrumb .final-path, .breadcrumb li:last-child strong');
  return breadcrumb && breadcrumb.textContent === 'package.json';
}

function addHeaderLink(box, name, url) {
  box.firstElementChild.prepend(doma(`
    <a class="btn btn-sm BtnGroup-item" href="${url}">${name}</a>
  `));
}

function getPackageURL() {
  if (isPackageJson()) {
    return location.href;
  }

  const packageLink = select([
    '.files [title="package.json"]', // GitHub
    '.tree-item-file-name [title="package.json"]' // GitLab
  ].join(','));
  if (packageLink) {
    return packageLink.href;
  }
}

async function fetchPackageFromRepo(url) {
  let dom = document;
  if (!isPackageJson()) {
    // https://gitlab.com/user/repo/raw/master/package.json
    // https://github.com/user/repo/blob/master/package.json
    url = url.replace(/(gitlab[.]com[/].+[/].+[/])blob/, '$1raw');

    const response = await fetch(url, {credentials: 'include'});
    const body = await response.text();

    // GitLab will return raw JSON
    // GitHub will return an HTML page
    if (isGitLab()) {
      return JSON.parse(body);
    }

    dom = doma(body);
  }

  // ElementReady required for GitLab's deferred content load
  const jsonEl = await elementReady('.blob-wrapper table, .blob-viewer pre', dom);

  return JSON.parse(jsonEl.textContent);
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
  if (select.exists('.npmhub-header')) {
    return;
  }

  const packageURL = getPackageURL();
  if (!packageURL) {
    return;
  }

  const container = select([
    '.repository-content', // GitHub
    '.tree-content-holder', // GitLab
    '.blob-content-holder' // GitLab package.json page
  ].join(','));

  const dependenciesBox = createBox('Dependencies', container);
  if (!isPackageJson()) {
    addHeaderLink(dependenciesBox, 'package.json', packageURL);
  }

  let pkg;
  try {
    pkg = await fetchPackageFromRepo(packageURL);
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
