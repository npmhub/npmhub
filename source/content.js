import 'webext-dynamic-content-scripts';
import {escape as esc} from 'escape-goat';
import githubInjection from 'github-injection';
import select from 'select-dom';
import parseRepoUrl from './lib/parse-repo-url';
import html from './lib/parse-html';
import elementReady from './lib/element-ready';

const errorMessage = 'npmhub: there was an error while';

async function fetchPackageFromNpm(name) {
  // Get the data from NPM registry via background.js
  // due to CORB policies introduced in Chrome 73
  return new Promise((resolve, reject) =>
    chrome.runtime.sendMessage(
      {action: 'fetch', payload: {name}},
      response => {
        if (response.error) {
          const error = new Error(response.error.title);
          error.message = response.error.message;
          reject(error);
        } else {
          resolve(response);
        }
      }
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
  box.firstElementChild.prepend(html.el(`
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

    dom = html(body);
  }

  // ElementReady required for GitLab's deferred content load
  const jsonEl = await elementReady('.blob-wrapper table, .blob-viewer pre', dom);

  return JSON.parse(jsonEl.textContent);
}

function createBox(title, container) {
  /* eslint-disable indent */
  const box = html.el(`
    <div class="readme boxed-group file-holder readme-holder mt-5">
      <div class="npmhub-header BtnGroup"></div>
      ${
        isGitLab() ?
        `<div class="file-title"><strong>${title}</strong></div>` :
        `<h3>${title}</h3>`
      }
      <ol class="npmhub-deps markdown-body"></ol>
    </div>
  `);
  /* eslint-enable indent */

  container.append(box);
  return box;
}

async function addDependency(name, container) {
  const depEl = html.el(`
    <li>
      <a href='https://www.npmjs.com/package/${esc(name)}'>
        ${esc(name)}
      </a>
    </li>
  `);
  container.append(depEl);

  let dep;
  try {
    dep = await fetchPackageFromNpm(name);
  } catch (error) {
    if (error.message === 'Not found') {
      return depEl.append(html('<em>Not published or private.</em>'));
    }

    console.warn(`${errorMessage} fetching ${esc(name)}/package.json`, error);
    return depEl.append(html('<em>There was a network error.</em>'));
  }

  depEl.append(dep.description);

  const url = parseRepoUrl(dep);
  if (url) {
    depEl.querySelector('a').href = url;
  }
}

function addDependencies(containerEl, list) {
  const listEl = containerEl.querySelector('.npmhub-deps');
  if (!list) {
    listEl.append(html.el(`
      <li class="npmhub-empty">
        <em>There was a network error.</em>
      </li>
    `));
  } else if (list.length > 0) {
    for (const name of list) {
      addDependency(name, listEl);
    }
  } else {
    listEl.append(html.el(`
      <li class="npmhub-empty">
        No dependencies!
        <g-emoji alias="tada" class="emoji" fallback-src="https://assets-cdn.github.com/images/icons/emoji/unicode/1f389.png" ios-version="6.0">🎉</g-emoji>
      </li>
    `));
  }
}

async function init() {
  if (select('.npmhub-header')) {
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
    try {
      const realPkg = await fetchPackageFromNpm(pkg.name);
      if (realPkg.name) { // If 404, realPkg === {}
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
    } catch (error) {
      console.warn(`${errorMessage} pinging the current package on npmjs.org`, error);
    }
  }
}

githubInjection(init);
