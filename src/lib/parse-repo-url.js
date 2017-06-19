// Imported from
// https://github.com/juliangruber/ghub.io/blob/f5dffef663588cb0e58e9897553a1f786f808762/index.js#L19-L30
import parse from './github-url-to-object';

function validUrl(url) {
  return typeof url === 'string' && url.length && url.indexOf('github') > -1 ?
    url :
    false;
}

export default function (pkg) {
  let repoUrl =
    validUrl(pkg.repository) ||
    validUrl(pkg.repository && pkg.repository.url) ||
    validUrl(
      pkg.versions &&
        Object.keys(pkg.versions).length &&
        pkg.versions[Object.keys(pkg.versions).pop()].homepage
    );
  repoUrl = parse(repoUrl);
  return (repoUrl && repoUrl.https_url) || 'https://www.npmjs.com/package/' + pkg.name;
}
