appAPI.ready(function($) {
  //console.log(Date());

  // Are we on github.com?
  if (!document.location.href.match(/github\.com/)) return;

  // Are we on a repo page?
  var pathParts = document.location.pathname.match(/\/+([^/]*)\/([^(/|\?)]*)/)
  if (!pathParts) return;

  // Does the repo have a package.json?
  if (!$("table.files").text().match(/package\.json/)) return;

  // Assemble API URL for fetching raw json from github
  var user = pathParts[1]
  var repo = pathParts[2]
  var pkgUrl = "http://github-raw-cors-proxy.herokuapp.com/" + user + "/" + repo + "/blob/master/package.json"

  // Set up list containers and headings
  $('#js-repo-pjax-container').append("<h2>npm dependencies</h2>")
  $('#js-repo-pjax-container').append("<ol id='deps' class='deps'></ol>")
  $('#js-repo-pjax-container').append("<h2>npm devDependencies</h2>")
  $('#js-repo-pjax-container').append("<ol id='devDeps' class='deps'></ol>")

  var depList = $("#deps")
  var devDepList = $("#devDeps")


  function applyStyles() {

    $('.deps').css({
      listStyle: 'none',
      margin: '10px 0 10px 0'
    });

    $('.deps > li').css({
      padding: '10px 0',
      borderBottom: "1px solid #DDD"
    });

    $('.deps > li:last').css({
      borderBottom: "none"
    });

    $('.deps > li.empty').css({
      opacity: '0.5'
    });

    $('.deps > li > span').css({
      display: "inline-block"
    });

    $('.deps > li > span.name').css({
      minWidth: "500px",
      maxWidth: "600px"
    });

    $('.deps > li > span.count').css({
      color: "#999",
      minWidth: "100px"
    });

    $('.deps > li > span.count em').css({
      color: "#000",
      fontStyle: "normal"
    });

  }


  appAPI.request.get(pkgUrl, function(data) {
    var pkg = JSON.parse(data);

    // Dependencies
    // -------------------------------------------------------------------------------

    if (pkg.dependencies === undefined) {
      depList.append("<li class='empty'>No dependencies found in package.json</li>")
      return;
    }

    var depNames = Object.keys(pkg.dependencies);

    for (var i in depNames) {
      var name = depNames[i];
      var depUrl = "http://npm-registry-cors-proxy.herokuapp.com/" + name

      depList.append("<li id='dep-" + name + "'><a href='https://npmjs.org/package/" + name + "'>" + name + "</a>&nbsp;&nbsp;</li>");

      appAPI.request.get(depUrl, function(data) {
        var dep = JSON.parse(data);
        $("#dep-"+dep.name).append(dep.description)
        applyStyles()
      });
    }

    // Dev Dependencies
    // -------------------------------------------------------------------------------

    if (pkg.devDependencies === undefined) {
      devDepList.append("<li class='empty'>No devDependencies found in package.json</li>")
      return;
    }

    var depNames = Object.keys(pkg.devDependencies);

    for (var i in depNames) {
      var name = depNames[i];
      var depUrl = "http://npm-registry-cors-proxy.herokuapp.com/" + name
      console.log(depUrl)

      devDepList.append("<li id='devDep-" + name + "'><a href='https://npmjs.org/package/" + name + "'>" + name + "</a>&nbsp;&nbsp;</li>");

      appAPI.request.get(depUrl, function(data) {
        var dep = JSON.parse(data);
        $("#devDep-"+dep.name).append(dep.description)
        applyStyles()
      });
    }

  });


});
