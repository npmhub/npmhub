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

if (packageLink) {
  const pkgUrl = packageLink.href;

  // Set up list containers and headings
  const $template = $('#readme, .readme-holder').clone().empty().removeAttr('id');

  const $depsList = $('<ol class="deps markdown-body">');
  const $devDepsList = $('<ol class="deps markdown-body">');

  const dependenciesHeader = isGitLab ?
    '<div id="dependencies" class="file-title"><strong>Dependencies' :
    '<h3 id="dependencies">Dependencies';
  const devDependenciesHeader = isGitLab ?
    '<div id="dev-dependencies" class="file-title"><strong>Dev Dependencies' :
    '<h3 id="dev-dependencies">Dev Dependencies';

  $template.clone()
  .addClass('npmhub-container')
  .append(dependenciesHeader, $depsList)
  .appendTo('.repository-content, .tree-content-holder');

  $template.clone()
  .append(devDependenciesHeader, $devDepsList)
  .appendTo('.repository-content, .tree-content-holder');

  fetch(pkgUrl, {credentials: 'include'}).then(res => res.text()).then(domStr => {
    const json = $(domStr).find('.blob-wrapper, .blob-content').text();
    const pkg = JSON.parse(json);
    const dependencies = Object.keys(pkg.dependencies || {});
    const devDependencies = Object.keys(pkg.devDependencies || {});

    addDependencies(dependencies, $depsList);
    addDependencies(devDependencies, $devDepsList);

    if (dependencies.length && !pkg.private) {
      $('<a class="btn btn-sm">')
      .text('Dependency tree visualization')
      .attr('href', `http://npm.anvaka.com/#/view/2d/${esc(pkg.name)}`)
      .css({
        float: 'right',
        margin: 5
      })
      .prependTo('.npmhub-container');
    }
  });

  function addDependencies(dependencies, $list) {
    if (!dependencies.length) {
      return $list.append('<li class="empty">No dependencies! 🎉</li>');
    }

    dependencies.forEach(name => {
      const depUrl = 'https://registry.npmjs.org/' + name;
      const $dep = $(`<li><a href='http://ghub.io/${esc(name)}'>${esc(name)}</a>&nbsp;</li>`);
      $dep.appendTo($list);
      backgroundFetch(depUrl).then(dep => {
        $dep.append(dep.description);
      });
    });
  }
}
