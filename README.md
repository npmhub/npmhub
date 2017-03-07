# npmhub [![Version on Chrome Web Store][badge-cws]][link-cws] [![Travis autodeployment][badge-travis]][link-travis]

  [badge-cws]: https://img.shields.io/chrome-web-store/v/kbbbjimdjbjclaebffknlabpogocablj.svg
  [badge-travis]: https://img.shields.io/travis/npmhub/npmhub/master.svg?label=autodeployment
  [link-cws]: https://chrome.google.com/webstore/detail/npmhub/kbbbjimdjbjclaebffknlabpogocablj
  [link-travis]: https://travis-ci.org/npmhub/npmhub

npmhub is a browser extension that lets you explore npm dependencies on GitHub and GitLab repos. When viewing a repository's file list containing a `package.json`, this extension will display links and descriptions for each dependency at the bottom of the page.

## Installation

### Chrome

Install it from the [Chrome Web Store](https://chrome.google.com/webstore/detail/npmhub/kbbbjimdjbjclaebffknlabpogocablj)

### Firefox

1. Download [this repo as a zip file](https://github.com/npmhub/npmhub/archive/master.zip)
2. Extract its contents
3. Visit `about:debugging#addons` in Firefox
4. Click on **Load Temporary Add-on**
5. Select the file `extension/manifest.json`

## Design

Here's what npmhub looks like:

![npmhub on Chrome](assets/npm-hub-screenshot.png)

## See Also

- [packagehub](https://github.com/BrainMaestro/packagehub) - an extension for displaying dependencies for different package managers on GitHub.
- [ghub.io](http://ghub.io) - jump straight to the GitHub repo of an npm package, e.g. [ghub.io/express](http://ghub.io/express).
