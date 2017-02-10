// Are we on a repo page that has a package.json?
const packageLink = document.querySelector('.files [title="package.json"]');

if (packageLink) {
  const pkgUrl = packageLink.href;

  // Set up list containers and headings
  const $template = $('#readme').clone().empty().removeAttr('id');

  const $depsList = $("<ol class='deps markdown-body'>");
  const $devDepsList = $("<ol class='deps markdown-body'>");
  const $depsVisBtn = $("<button class='btn btn-sm viz-btn' style='float: right; margin: 5px 5px 0 0;' type='button'>Dependency tree visualization");

  $template.clone()
  .append($depsVisBtn)
  .append('<h3 id="dependencies">Dependencies', $depsList)
  .appendTo('.repository-content');

  $template.clone()
  .append('<h3 id="dev-dependencies">Dev dependencies', $devDepsList)
  .appendTo('.repository-content');

  fetch(pkgUrl, { credentials: 'include' }).then(res => res.text()).then(domStr => {
    const pkg = JSON.parse($(domStr).find('.blob-wrapper').text());
    $depsVisBtn.wrap(`<a href="http://npm.anvaka.com/#/view/2d/${pkg.name}"></a>`);
    addDependencies(pkg.dependencies, $depsList);
    addDependencies(pkg.devDependencies, $devDepsList);
  });

  function addDependencies(dependencies, $list) {
    if (!dependencies || !Object.keys(dependencies).length) {
      return $list.append("<li class='empty'>None found in package.json</li>");
    }

    Object.keys(dependencies).forEach(name => {
      const depUrl = 'https://registry.npmjs.org/' + name
      const $dep = $("<li><a href='http://ghub.io/" + name + "'>" + name + '</a>&nbsp;</li>')
      $dep.appendTo($list);
      backgroundFetch(depUrl).then(dep => {
        $dep.append(dep.description)
      })
    });
  }
}
