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

async function init() {
  const dependenciesBox = createBox('Dependencies');
  const domStr = await fetch(packageLink.href, {credentials: 'include'}).then(res => res.text())
  const json = html(domStr).querySelector('.blob-wrapper, .blob-content').textContent;
  const pkg = JSON.parse(json);

  const dependencies = Object.keys(pkg.dependencies || {});
  const devDependencies = Object.keys(pkg.devDependencies || {});

  addDependencies(dependenciesBox, dependencies);

  // Don't show dev dependencies if there are absolutely no dependencies
  if (dependencies.length || devDependencies.length) {
    addDependencies(createBox('Dev Dependencies'), devDependencies);
  }

  if (dependencies.length && !pkg.private) {
    const link = html`<a class="npmhub-anvaka btn btn-sm">Dependency tree visualization`;
    link.href = `http://npm.anvaka.com/#/view/2d/${esc(pkg.name)}`;
    dependenciesBox.insertBefore(link, dependenciesBox.firstChild);
  }
}

function createBox(title) {
  const isGitLab = document.querySelector('.navbar-gitlab');
  const boxTemplate = document.querySelector('#readme, .readme-holder');
  const containerEl = boxTemplate.cloneNode();
  containerEl.removeAttribute('id');
  containerEl.appendChild(isGitLab ?
    html`<div class="file-title"><strong>${title}` :
    html`<h3>${title}`
  );
  containerEl.appendChild(html`<ol class="deps markdown-body">`);

  document.querySelector('.repository-content, .tree-content-holder').appendChild(containerEl);
  return containerEl;
}

function addDependencies(containerEl, list) {
  const listEl = containerEl.querySelector('.deps');
  if (list.length) {
    list.forEach(async name => {
      const depUrl = 'https://registry.npmjs.org/' + name.replace('/', '%2F');
      const depEl = html`<li><a href='http://ghub.io/${esc(name)}'>${esc(name)}</a>&nbsp;</li>`;
      listEl.appendChild(depEl);
      const dep = await window.backgroundFetch(depUrl);
      depEl.appendChild(html(esc(dep.description)));
    });
  } else {
    listEl.appendChild(html`<li class="empty">No dependencies! 🎉</li>`);
  }
}

const packageLink = document.querySelector('.files [title="package.json"], .tree-item-file-name [title="package.json"]');

if (packageLink) {
  init();
}
