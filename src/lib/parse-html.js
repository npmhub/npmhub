// Get DOM node(s) from HTML
export default function (html) {
  if (html.raw) {
    // Shortcut for html`text` instead of html(`text`)
    html = String.raw(...arguments);
  }

  const fragment = document.createRange().createContextualFragment(html.trim());
  if (fragment.firstChild === fragment.lastChild) {
    return fragment.firstChild;
  }
  return fragment;
}
