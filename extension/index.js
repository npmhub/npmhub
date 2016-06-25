$(function () {
  // Are we on a repo page?
  var pathParts = document.location.pathname.match(/\/+([^/]*)\/([^(/|\?)]*)/)
  if (!pathParts) return

  // Does the repo have a package.json?
  if (!$('.files [title="package.json"]').length) return

  // Assemble API URL for fetching raw json from github
  var user = pathParts[1]
  var repo = pathParts[2]
  var pkgUrl = 'https://github-raw-cors-proxy.herokuapp.com/' + user + '/' + repo + '/blob/master/package.json'

  // Set up list containers and headings
  var $template = $('#readme').clone().empty().removeAttr('id');

  var $depsList = $("<ol class='deps markdown-body'>");
  var $devDepsList = $("<ol class='deps markdown-body'>");

  $template.clone()
  .append('<h3 id="dependencies">Dependencies', $depsList)
  .appendTo('.repository-content');

  $template.clone()
  .append('<h3 id="dev-dependencies">Dev dependencies', $devDepsList)
  .appendTo('.repository-content');

  fetch(pkgUrl).then(response => response.json()).then(function (pkg) {
    addDependencies(pkg.dependencies, $depsList);
    addDependencies(pkg.devDependencies, $devDepsList);
  });

  function addDependencies(dependencies, $list) {
    if (dependencies) {
      var depNames = Object.keys(dependencies).forEach(name => {
        console.log(name)
        var depUrl = 'https://npm-registry-cors-proxy.herokuapp.com/' + name

        var $dep = $("<li><a href='https://npmjs.org/package/" + name + "'>" + name + '</a>&nbsp;&nbsp;</li>')
        $dep.appendTo($list);

        fetch(depUrl).then(response => response.json()).then(function (dep) {
          console.log(dep)
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

})
