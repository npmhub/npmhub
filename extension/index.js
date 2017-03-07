// Escape HTML
function esc(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

// Are we on a GitLab instance ?
const isGitLab = document.querySelector('.navbar-gitlab');
// Are we on a repo page that has a package.json?
const packageLink = document.querySelector('.files [title="package.json"], .tree-item-file-name [title="package.json"]');

function convertLink(href)
{
  let url = new URL(href);

  if (url.host === "gitlab.com")
  {
    url.pathname = url.pathname.replace("/blob/", "/raw/");
  }
  else if (url.host === "github.com")
  {
    url.pathname = url.pathname.replace("/blob/", "/");
    url.host = "raw.githubusercontent.com";
  }

  return url.href;
}

if (packageLink) {
  // Set up list containers and headings
  const $template = $('#readme, .readme-holder').clone().empty().removeAttr('id');
  const $dependencies = createContainer($template, 'Dependencies');

  const packageJson = convertLink(packageLink.href);

  // Fetch list of dependencies
  fetch(packageJson).then(res => res.text()).then(generateLists);

  function generateLists(json) {
    const pkg = JSON.parse(json);
    const dependencies = Object.keys(pkg.dependencies || {});
    const devDependencies = Object.keys(pkg.devDependencies || {});

    addDependencies($dependencies, dependencies);

    // Don't show dev dependencies if there are absolutely no dependencies
    if (dependencies.length || devDependencies.length) {
      addDependencies(createContainer($template, 'Dev Dependencies'), devDependencies);
    }

    if (dependencies.length && !pkg.private) {
      $('<a class="btn btn-sm">')
      .text('Dependency tree visualization')
      .attr('href', `http://npm.anvaka.com/#/view/2d/${esc(pkg.name)}`)
      .css({
        float: 'right',
        margin: 5
      })
      .prependTo($dependencies);
    }
  }

  function createContainer($template, title) {
    // Create header
    const dependenciesHeader = isGitLab ?
      `<div class="file-title"><strong>${title}` :
      `<h3>${title}`;

    // Merge all and add to page
    return $template.clone()
    .append(dependenciesHeader, '<ol class="deps markdown-body">')
    .appendTo('.repository-content, .tree-content-holder');
  }

  function addDependencies($container, list) {
    const $list = $container.find('.deps');
    if (list.length) {
      list.forEach(name => {
        const depUrl = 'https://registry.npmjs.org/' + name;
        const $dep = $(`<li><a href='http://ghub.io/${esc(name)}'>${esc(name)}</a>&nbsp;</li>`);
        $dep.appendTo($list);
        backgroundFetch(depUrl).then(dep => {
          $dep.append(dep.description);
        });
      });
    } else {
      $list.append('<li class="empty">No dependencies! 🎉</li>');
    }
  }
}
