// Get DOM node(s) from HTML
export default function parseHTML(html) {
  const template = document.createElement('template');
  template.innerHTML = html;
  return template.content;
}

parseHTML.el = html => parseHTML(html).firstElementChild;
