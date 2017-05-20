const packageLink = document.querySelector('.files [title="package.json"], .tree-item-file-name [title="package.json"]');

// Escape HTML
function esc(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

// Get DOM node from HTML
function html(html) {
  if (html.raw) {
    // Shortcut for html`text` instead of html(`text`)
    html = String.raw(...arguments);
  }

  const fragment = document.createRange().createContextualFragment(html.trim());
  if (fragment.firstChild === fragment.lastChild) {
    return fragment.firstChild;
  }
  return fragment;
}

function getPkgUrl(name) {
  return 'https://registry.npmjs.org/' + name.replace('/', '%2F');
}

async function init() {
  const dependenciesBox = createBox('Dependencies');
  const domStr = await fetch(packageLink.href, {credentials: 'include'}).then(res => res.text());
  const json = html(domStr).querySelector('.blob-wrapper, .blob-content').textContent;
  const pkg = JSON.parse(json);

  const dependencies = Object.keys(pkg.dependencies || {});
  const devDependencies = Object.keys(pkg.devDependencies || {});

  addDependencies(dependenciesBox, dependencies);

  // Don't show dev dependencies if there are absolutely no dependencies
  if (dependencies.length > 0 || devDependencies.length > 0) {
    addDependencies(createBox('Dev Dependencies'), devDependencies);
  }

  if (!pkg.private) {
    window.backgroundFetch(getPkgUrl(pkg.name))
    .then(realPkg => {
      if (realPkg.name) { // If 404, realPkg === {}
        const link = html`<a class="btn btn-sm">Open on npmjs.com`;
        link.href = `https://www.npmjs.com/package/${esc(pkg.name)}`;
        dependenciesBox.firstChild.appendChild(link);

        if (dependencies.length > 0) {
          const link = html`<a class="btn btn-sm">Visualize full tree`;
          link.href = `http://npm.anvaka.com/#/view/2d/${esc(pkg.name)}`;
          dependenciesBox.firstChild.appendChild(link);
        }
      }
    }, err => {
      console.warn('npmhub: there was an error while pinging the current package on npmjs.org', err);
    });
  }
}

function createBox(title) {
  const isGitLab = document.querySelector('.navbar-gitlab');
  const boxTemplate = document.querySelector('#readme, .readme-holder');
  const containerEl = document.createElement(boxTemplate.tagName);
  containerEl.classList = boxTemplate.classList;
  containerEl.appendChild(html`<div class="npmhub-header">`);
  containerEl.appendChild(isGitLab ?
    html`<div class="file-title"><strong>${title}` :
    html`<h3>${title}`
  );
  containerEl.appendChild(html`<ol class="deps markdown-body">`);

  boxTemplate.parentNode.appendChild(containerEl);
  return containerEl;
}

function addDependencies(containerEl, list) {
  const listEl = containerEl.querySelector('.deps');
  if (list.length > 0) {
    list.forEach(async name => {
      const depEl = html`<li><a href='http://ghub.io/${esc(name)}'>${esc(name)}</a>&nbsp;</li>`;
      listEl.appendChild(depEl);
      const dep = await window.backgroundFetch(getPkgUrl(name));
      depEl.appendChild(html(esc(dep.description)));
    });
  } else {
    listEl.appendChild(html`<li class="empty">No dependencies! 🎉</li>`);
  }
}

if (packageLink) {
  init();
}
