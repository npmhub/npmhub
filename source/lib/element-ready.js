// Mini version of https://github.com/sindresorhus/element-ready
export default function (selector, parent) {
  return new Promise(resolve => {
    (function check() {
      const el = (parent || document).querySelector(selector);
      if (el) {
        resolve(el);
      } else {
        requestAnimationFrame(check);
      }
    })();
  });
}
