appAPI.ready(function ($) {
  // Are we on github.com?
  if (!document.location.href.match(/github\.com/)) return

  // Are we on a repo page?
  var pathParts = document.location.pathname.match(/\/+([^/]*)\/([^(/|\?)]*)/)
  if (!pathParts) return

  // Does the repo have a package.json?
  if (!$('table.files').text().match(/package\.json/)) return

  // Assemble API URL for fetching raw json from github
  var user = pathParts[1]
  var repo = pathParts[2]
  var pkgUrl = 'http://github-raw-cors-proxy.herokuapp.com/' + user + '/' + repo + '/blob/master/package.json'

  // Set up list containers and headings
  $('#readme').append("<h2 id='dependencies' class='npm-hub-heading'>Dependencies</h2>")
  $('#readme').append("<ol id='depsList' class='deps'></ol>")
  $('#readme').append("<h2 id='dev-dependencies' class='npm-hub-heading'>Dev Dependencies</h2>")
  $('#readme').append("<ol id='devDepsList' class='deps'></ol>")

  var $depsList = $('#depsList')
  var $devDepsList = $('#devDepsList')

  function applyStyles () {
    $('.deps').css({
      listStyle: 'none',
      margin: '10px 0 10px 0'
    })

    $('.deps > li').css({
      padding: '10px 0',
      borderBottom: '1px solid #DDD'
    })

    $('.deps > li:last').css({
      borderBottom: 'none'
    })

    $('.deps > li > span').css({
      display: 'inline-block'
    })

    $('.deps > li > span.name').css({
      minWidth: '500px',
      maxWidth: '600px'
    })

    $('.deps > li > span.count').css({
      color: '#999',
      minWidth: '100px'
    })

    $('.deps > li > span.count em').css({
      color: '#000',
      fontStyle: 'normal'
    })

    $('.npm-hub-heading').css({
      paddingTop: '20px'
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

          if (dep.repository) {
            $('#dep-' + dep.name).append(" <a href='http://ghub.io/" + dep.name + "'>(repo)</a>")
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
          if (dep.repository) {
            $('#devDep-' + dep.name).append(" <a href='http://ghub.io/" + dep.name + "'>(repo)</a>")
          }
          applyStyles()
        })
      }
    }

  })

})
