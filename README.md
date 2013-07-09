# npm-hub

npm-hub is a browser extension that lets your explore npm dependencies on GitHub repos. When viewing a repository on github.com that has a package.json file, this extension will introspect the dependencies in package.json and display links and description for each dependency, just below the file list. npm-hub relies on [github-raw-cors-proxy](https://github.com/zeke/github-raw-cors-proxy#readme) and [npm-registry-cors-proxy](https://github.com/zeke/npm-registry-cors-proxy#readme) for making cross-origin requests to npmjs.org and github.com.

## Installation

npm-hub was created with [Crossrider](http://crossrider.com/), a platform for authoring and distributing cross-browser extensions. Install it on [Google Chrome](https://chrome.google.com/webstore/detail/npm-hub/kbbbjimdjbjclaebffknlabpogocablj) or [other browsers](http://crossrider.com/install/36212-npm-hub).

## Design

Here's what npm-hub looks like:

![http://crossrider.com/system/media1s/36212/original/Screen_Shot_2013-07-01_at_8.05.34_AM.png](http://crossrider.com/system/media1s/36212/original/Screen_Shot_2013-07-01_at_8.05.34_AM.png)