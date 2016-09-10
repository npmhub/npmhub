$().ready(() => {
  // Are we on a repo page?
  const [, user, repo] = document.location.pathname.match(/\/+([^/]*)\/([^(/|\?)]*)/) || [];
  if (!user) return

  // Does the repo have a package.json?
  if (!$('.files [title="package.json"]').length) return

  // Assemble API URL for fetching raw json from github
  const depUrl = 'https://registry.npmjs.org/' + name

  // Set up list containers and headings
  const $template = $('#readme').clone().empty().removeAttr('id');

  const $depsList = $("<ol class='deps markdown-body'>");
  const $devDepsList = $("<ol class='deps markdown-body'>");

  const $depsVisBtn = $("<button class='btn btn-sm viz-btn' type='button'>Dependency tree visualization</button>");
  $depsVisBtn.attr("style", "float: right; margin: 5px 5px 0 0;");

  $template.clone()
  .append($depsVisBtn)
  .append('<h3 id="dependencies">Dependencies', $depsList)
  .appendTo('.repository-content');

  $template.clone()
  .append('<h3 id="dev-dependencies">Dev dependencies', $devDepsList)
  .appendTo('.repository-content');

  backgroundFetch(pkgUrl).then(pkg => {
    $depsVisBtn.click({pkg}, viewDepsViz);
    addDependencies(pkg.dependencies, $depsList);
    addDependencies(pkg.devDependencies, $devDepsList);
  });

  function addDependencies(dependencies, $list) {
    if (dependencies) {
      const depNames = Object.keys(dependencies).forEach(name => {
        const depUrl = 'https://registry.npmjs.org/' + name

        const $dep = $("<li><a href='https://npmjs.org/package/" + name + "'>" + name + '</a>&nbsp;&nbsp;</li>')
        $dep.appendTo($list);

        backgroundFetch(depUrl).then(dep => {
          $dep.append(dep.description)

          if (dep.repository) {
            $dep.append(" <a href='http://ghub.io/" + dep.name + "'>(repo)</a>")
          }
        })
      });
    } else {
      $list.append("<li class='empty'>None found in package.json</li>");
    }
  }

  function viewDepsViz(e) {
    const npmPkgName = e.data.pkg.name;
    const windowFeatures = "resizable,scrollbars,status";

    var otherWindow = window.open(`http://npm.anvaka.com/#/view/2d/${npmPkgName}`, "npmanvaka", windowFeatures);
    otherWindow.opener = null;
    otherWindow.location = url;
    return false;
  }
});
