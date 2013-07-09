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
  console.log("pkgUrl", pkgUrl)

  // Add a heading to the list of NPM modules
  $('#js-repo-pjax-container').append("<h2>npm dependencies</h2>")

  // Set up DOM container for list of modules
  $('#js-repo-pjax-container').append("<ol id='pkgs'></ol>")
  var pkgList = $("#pkgs")

  appAPI.request.get(pkgUrl, function(data) {
    var pkg = JSON.parse(data);

      if (Object.keys(pkg.dependencies).length === 0) {
      pkgList.append("<li>No dependencies found in this repo's package.json</li>")
      return;
      }

      var depNames = Object.keys(pkg.dependencies);

    for (var i in depNames) {
      var name = depNames[i];
      var depUrl = "http://npm-registry-cors-proxy.herokuapp.com/" + name

      pkgList.append("<li id='dep-" + name + "'><a href='https://npmjs.org/package/" + name + "'>" + name + "</a>&nbsp;&nbsp;</li>");

      appAPI.request.get(depUrl, function(data) {
        var dep = JSON.parse(data);
        $("#dep-"+dep.name).append(dep.description)
      });
    }

    $('#pkgs').css({
      listStyle: 'none',
      margin: '10px 0 10px 0'
    });

    $('#pkgs > li').css({
      padding: '10px 0',
      borderBottom: "1px solid #DDD"
    });

    $('#pkgs > li > span').css({
      display: "inline-block"
    });

    $('#pkgs > li > span.name').css({
      minWidth: "500px",
      maxWidth: "600px"
    });

    $('#pkgs > li > span.count').css({
      color: "#999",
      minWidth: "100px"
    });

    $('#pkgs > li > span.count em').css({
      color: "#000",
      fontStyle: "normal"
    });

  });


});
