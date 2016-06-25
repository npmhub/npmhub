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
    // Dependencies
    // -------------------------------------------------------------------------------

    if (pkg.dependencies === undefined) {
      $depsList.append("<li class='empty'>None found in package.json</li>")
    } else {
      var depNames = Object.keys(pkg.dependencies)

      for (var i in depNames) {
        var name = depNames[i]
        var depUrl = 'https://npm-registry-cors-proxy.herokuapp.com/' + name

        $depsList.append("<li id='dep-" + name + "'><a href='https://npmjs.org/package/" + name + "'>" + name + '</a>&nbsp;&nbsp;</li>')

        fetch(depUrl).then(response => response.json()).then(function (dep) {
          $('#dep-' + dep.name).append(dep.description)

          if (dep.repository) {
            $('#dep-' + dep.name).append(" <a href='http://ghub.io/" + dep.name + "'>(repo)</a>")
          }
        })
      }
    }


    // Dev Dependencies
    // -------------------------------------------------------------------------------

    if (pkg.devDependencies === undefined) {
      $devDepsList.append("<li class='empty'>None found in package.json</li>")
    } else {
      var depNames = Object.keys(pkg.devDependencies)

      for (var i in depNames) {
        var name = depNames[i]
        var depUrl = 'https://npm-registry-cors-proxy.herokuapp.com/' + name

        $devDepsList.append("<li id='devDep-" + name + "'><a href='https://npmjs.org/package/" + name + "'>" + name + '</a>&nbsp;&nbsp;</li>')

        fetch(depUrl).then(response => response.json()).then(function (dep) {
          $('#devDep-' + dep.name).append(dep.description)
          if (dep.repository) {
            $('#devDep-' + dep.name).append(" <a href='http://ghub.io/" + dep.name + "'>(repo)</a>")
          }
        })
      }
    }

  })

})
