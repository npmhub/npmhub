// Imported from
// https://github.com/sindresorhus/refined-github/blob/f201cf5d7d1b49b5467d1bf1288d97815cd04f75/source/libs/fetch-dom.ts
import doma from 'doma';

export default async function fetchDom(url, selector) {
  const absoluteURL = new URL(url, window.location.origin).toString(); // Firefox `fetch`es from the content script, so relative URLs fail
  const response = await fetch(absoluteURL, {credentials: 'include'});
  const dom = doma(await response.text());
  if (selector) {
    return dom.querySelector(selector);
  }

  return dom;
}
