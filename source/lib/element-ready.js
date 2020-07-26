// Mini version of https://github.com/sindresorhus/element-ready
export default function elementReady(selector, parent) {
  return new Promise(resolve => {
    (function check() {
      const element = (parent || document).querySelector(selector);
      if (element) {
        resolve(element);
      } else {
        requestAnimationFrame(check);
      }
    })();
  });
}
