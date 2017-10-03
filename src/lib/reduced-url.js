// Module required until https://github.com/npm/hosted-git-info/pull/26 is in
// This can't be replaced with `new URL()` because browsers don't support git+http urls

const protocol = '(?:([^:]+:)?(?://)?)?';
const auth = '(?:(\\S+(?::\\S*)?)@)?';
const host = '([^/:]*)';
const path = '([/]?[^#]*)';
const hash = '(#.+)?';
const urlLaxRegex = new RegExp(protocol + auth + host + path + hash);

exports.parse = function (url) {
  const match = url.match(urlLaxRegex);
  if (match) {
    let path = match[4];
    if (path && path[0] !== '/') {
      path = `/${path}`;
    }
    return {
      protocol: match[1],
      auth: match[2],
      host: match[3],
      path,
      hash: match[5]
    };
  }
};
