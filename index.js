appAPI.ready(function ($) {
  // Are we on github.com?
  if (!document.location.href.match(/github\.com/)) return

  // Are we on a repo page?
  var pathParts = document.location.pathname.match(/\/+([^/]*)\/([^(/|\?)]*)/)
  if (!pathParts) return

  // Does the repo have a package.json?
  if (!$('.files [title="package.json"]').length) return

  // Assemble API URL for fetching raw json from github
  var user = pathParts[1]
  var repo = pathParts[2]
  var pkgUrl = 'http://github-raw-cors-proxy.herokuapp.com/' + user + '/' + repo + '/blob/master/package.json'

  // Set up list containers and headings
  var $template = $('#readme').clone().empty().removeAttr('id');

  var $depsList = $("<ol class='deps markdown-body'>");
  var $devDepsList = $("<ol class='deps markdown-body'>");

  $template.clone()
  .append('<h3>Dependencies', $depsList)
  .appendTo('.repository-content');

  $template.clone()
  .append('<h3>Dev dependencies', $devDepsList)
  .appendTo('.repository-content');

  function applyStyles () {
    $('.deps').css({
      listStyle: 'none',
      padding: 0
    })

    $('.deps > li').css({
      padding: '10px',
      borderBottom: '1px solid #DDD'
    })

    $('.deps > li:last-child').css({
      borderBottom: 'none'
    })

    $('li.empty').css({
      opacity: '0.6'
    })

  }

  appAPI.request.get(pkgUrl, function (data) {
    var pkg = JSON.parse(data)

    // Dependencies
    // -------------------------------------------------------------------------------

    if (pkg.dependencies === undefined) {
      $depsList.append("<li class='empty'>None found in package.json</li>")
      applyStyles()
    } else {
      var depNames = Object.keys(pkg.dependencies)

      for (var i in depNames) {
        var name = depNames[i]
        var depUrl = 'http://npm-registry-cors-proxy.herokuapp.com/' + name

        $depsList.append("<li id='dep-" + name + "'><a href='https://npmjs.org/package/" + name + "'>" + name + '</a>&nbsp;&nbsp;</li>')

        appAPI.request.get(depUrl, function (data) {
          var dep = JSON.parse(data)
          $('#dep-' + dep.name).append(dep.description)

          if (dep.repository && dep.repository.url) {
            $('#dep-' + dep.name).append(" <a href='" + dep.repository.url + "'>(repo)</a>")
          }
          applyStyles()
        })
      }
    }


    // Dev Dependencies
    // -------------------------------------------------------------------------------

    if (pkg.devDependencies === undefined) {
      $devDepsList.append("<li class='empty'>None found in package.json</li>")
      applyStyles()
    } else {
      var depNames = Object.keys(pkg.devDependencies)

      for (var i in depNames) {
        var name = depNames[i]
        var depUrl = 'http://npm-registry-cors-proxy.herokuapp.com/' + name

        $devDepsList.append("<li id='devDep-" + name + "'><a href='https://npmjs.org/package/" + name + "'>" + name + '</a>&nbsp;&nbsp;</li>')

        appAPI.request.get(depUrl, function (data) {
          var dep = JSON.parse(data)
          $('#devDep-' + dep.name).append(dep.description)
          if (dep.repository && dep.repository.url) {
            $('#devDep-' + dep.name).append(" <a href='" + dep.repository.url + "'>(repo)</a>")
          }
          applyStyles()
        })
      }
    }

  })

})
