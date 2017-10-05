// Mini version of https://github.com/sindresorhus/element-ready
import select from 'select-dom';

export default function (selector, parent) {
  return new Promise(resolve => {
    (function check() {
      const el = select(selector, parent);
      if (el) {
        resolve(el);
      } else {
        requestAnimationFrame(check);
      }
    })();
  });
}
