# Contributing to npmhub

:+1::tada: First off, thanks for taking the time to contribute! :tada::+1:

The following is a set of guidelines for contributing. These are just guidelines,
not rules, so use your best judgment and feel free to propose changes to this
document in a pull request.

## Code of Conduct

This project adheres to the
[Contributor Covenant](http://contributor-covenant.org/), a code of conduct for
open source projects.

> be overt in our openness, welcoming all people to contribute, and pledging in return to value them as human beings and to foster an atmosphere of kindness, cooperation, and understanding.

## Contributing

Projects in this organization follow the [open open source](http://openopensource.org/)
contribution model:

> Individuals making significant and valuable contributions are given commit-access to the project to contribute as they see fit. This project is more like an open wiki than a standard guarded open source project.


To get started, you'll need `git` and `node` installed.

```sh
git clone https://github.com/npmhub/npmhub
cd npmhub
npm install
```

To run the extension locally while developing:

1. Open Chrome preferences and click "Extensions", or type `chrome://extensions` in the location bar.
1. Disable the production version of npmhub if you have it installed already.
1. Enable "Developer Mode".
1. Click "Load Unpacked Extension".
1. Browse to the `/extension` directory of your checked-out project.
1. Visit a [Javascripty repo with dependencies](https://github.com/VictorBjelkholm/trymodule) and you should see dependencies listed below the README.

## Deployment

Changes to the master branch are deployed automatically to the Chrome web store.
Once your PR is merged, the updates should be live after a few minutes but it
can sometimes take up to an hour for the Chrome web store to update.
