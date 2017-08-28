import 'webext-dynamic-content-scripts';
import {escape as esc} from 'escape-goat';
import githubInjection from 'github-injection';
import parseRepoUrl from './lib/parse-repo-url';
import html from './lib/parse-html';

function getPkgUrl(name) {
  return 'https://registry.npmjs.org/' + name.replace('/', '%2F');
}

function isGitLab() {
  return Boolean(document.querySelector('.navbar-gitlab'));
}

function addHeaderLink(box, name, url) {
  box.firstElementChild.appendChild(html`<a class="btn btn-sm" href="${url}">${name}</a>`);
}

async function init() {
  const packageLink = document.querySelector('.files [title="package.json"], .tree-item-file-name [title="package.json"]');
  if (!packageLink || document.querySelector('.npmhub-header')) {
    return;
  }

  const container = document.querySelector('.repository-content, .tree-content-holder');
  const dependenciesBox = createBox('Dependencies', container);
  addHeaderLink(dependenciesBox, 'See package.json', packageLink.href);

  const pkg = await fetchPackageJson(packageLink);

  const dependencies = Object.keys(pkg.dependencies || {});
  addDependencies(dependenciesBox, dependencies);

  [
    'peer',
    'bundled',
    'optional',
    'dev'
  ].forEach(depType => {
    let list = pkg[depType + 'Dependencies'] || [];
    if (!Array.isArray(list)) {
      list = Object.keys(list);
    }
    if (list.length > 0) {
      const title = depType[0].toUpperCase() + depType.substr(1) + ' Dependencies';
      addDependencies(createBox(title, container), list);
    }
  });

  if (!pkg.private && pkg.name) {
    fetch(getPkgUrl(pkg.name)).then(r => r.json())
    .then(realPkg => {
      if (realPkg.name) { // If 404, realPkg === {}
        addHeaderLink(
          dependenciesBox,
          'Open on npmjs.com',
          `https://www.npmjs.com/package/${esc(pkg.name)}`
        );
        if (dependencies.length > 0) {
          addHeaderLink(
            dependenciesBox,
            'Visualize full tree',
            `http://npm.anvaka.com/#/view/2d/${esc(pkg.name)}`
          );
        }
      }
    }, err => {
      console.warn('npmhub: there was an error while pinging the current package on npmjs.org', err);
    });
  }
}

async function fetchPackageJson(link) {
  // https://gitlab.com/user/repo/blob/master/package.json
  // https://github.com/user/repo/blob/master/package.json
  const url = link.href.replace(/(gitlab[.]com[/].+[/].+[/])blob/, '$1raw');

  // GitLab will return a raw JSON
  // GitHub will return an HTML page
  let pkg = await fetch(url, {
    credentials: 'include'
  }).then(r => r.text());

  // Parse the JSON string out of the HTML page
  if (!isGitLab()) {
    pkg = html(pkg).querySelector('.blob-wrapper table').textContent;
  }

  return JSON.parse(pkg);
}

function createBox(title, container) {
  const box = html`
    <div class="readme boxed-group file-holder readme-holder">
      <div class="npmhub-header"></div>
      ${
        isGitLab() ?
        `<div class="file-title"><strong>${title}</strong></div>` :
        `<h3>${title}</h3>`
      }
      <ol class="npmhub-deps markdown-body"></ol>
    </div>
  `;

  container.appendChild(box);
  return box;
}

function addDependencies(containerEl, list) {
  const listEl = containerEl.querySelector('.npmhub-deps');
  if (list.length > 0) {
    list.forEach(async name => {
      const depEl = html`<li><a href='http://ghub.io/${esc(name)}'>${esc(name)}</a>&nbsp;</li>`;
      listEl.appendChild(depEl);
      const dep = await fetch(getPkgUrl(name)).then(r => r.json());
      depEl.appendChild(html(esc(dep.description)));
      depEl.querySelector('a').href = parseRepoUrl(dep);
    });
  } else {
    listEl.appendChild(html`<li class="npmhub-empty">No dependencies!</li>`);
  }
}

githubInjection(window, init);
