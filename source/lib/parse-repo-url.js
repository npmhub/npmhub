// Partially imported from and inspired by
// https://github.com/npm/npm/blob/20589f4b028d3e8a617800ac6289d27f39e548e8/lib/repo.js#L38-L51
// https://github.com/npm/normalize-package-data/blob/9948ecf3d97cffcaab8f914522a0f3953edac6e4/lib/fixer.js#L14-L38
// https://github.com/juliangruber/ghub.io/blob/f5dffef663588cb0e58e9897553a1f786f808762/index.js#L19-L30

import {fromUrl as parseRepo} from 'hosted-git-info';

function unknownHostedUrl(url) {
  try {
    const idx = url.indexOf('@');
    if (idx !== -1) {
      url = url.slice(idx + 1).replace(/:([^\d]+)/, '/$1');
    }
    url = new URL(url);
    const protocol = url.protocol === 'https:' ?
      'https:' :
      'http:';
    return protocol + '//' + (url.host || '') +
      url.pathname.replace(/\.git$/, '');
  } catch (err) {/**/}
}

function normalizeRepository(repoField) {
  if (repoField && repoField.url) {
    return repoField.url;
  }
  return repoField;
}

export default function (pkg) {
  const repoUrl = normalizeRepository(pkg.repository);
  const info = parseRepo(repoUrl);
  return info ? info.browse() : unknownHostedUrl(repoUrl);
}
