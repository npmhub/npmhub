<script>
  import elementReady from '../lib/element-ready';
  import fetchDom from '../lib/fetch-dom';
  import Box from './Box.svelte';
  import Header from './Header.svelte';

  export let packageURL;
  export let isPackageJson;
  export let isGitLab;

  const errorMessage = 'npmhub: there was an error while';

  function getDependencyKey(type) {
    return type.toLowerCase() + 'Dependencies';
  }

  async function getPackageJson() {
    // GitLab will return raw JSON so we can use that directly
    // https://gitlab.com/user/repo/raw/master/package.json
    if (!isPackageJson && isGitLab) {
      const url = packageURL.replace(/(gitlab[.]com[/].+[/].+[/])blob/, '$1raw');
      const response = await fetch(url);
      return response.json();
    }

    // If it's a package.json page, use the local dom

    const document_ = isPackageJson ? document : await fetchDom(packageURL);

    const jsonBlobElement = await elementReady([
      '.blob-wrapper table', // GitHub
      '.blob-viewer pre' // GitLab, defers content load so it needs `elementReady`
    ], document_);

    return JSON.parse(jsonBlobElement.textContent);
  }

  async function getLocalPackage() {
    const packageJson = await getPackageJson();
    const package_ = {
      name: packageJson.name,
      dependencies: Object.keys(packageJson.dependencies || {}).map(name => ({
        name,
        info: fetchPackageInfo(name)
      }))
    };
    for (const type of types) {
      const key = getDependencyKey(type);
      let list = packageJson[key] || [];
      if (!Array.isArray(list)) {
        list = Object.keys(list);
      }

      if (list.length > 0) {
        package_[key] = list.map(name => ({
          name,
          info: fetchPackageInfo(name)
        }));
      }
    }

    return package_;
  }

  async function fetchPackageInfo(name) {
    // Get the data from NPM registry via background.js
    // due to CORB policies introduced in Chrome 73
    return new Promise(resolve =>
      chrome.runtime.sendMessage(
        {action: 'fetch', payload: {name}},
        resolve
      )
    );
  }

  async function isPackagePublic(name) {
    const {error} = await fetchPackageInfo(name);
    if (!error) {
      return true;
    }

    if (error.message !== 'Not found') {
      console.warn(`${errorMessage} pinging the current package on npmjs.org`, error);
    }

    return false;
  }

  const types = [
    'Peer',
    'Bundled',
    'Optional',
    'Dev'
  ];
  const packagePromise = getLocalPackage();
  packagePromise.catch(error => {
    console.warn(`${errorMessage} fetching the current package.json from ${window.location.hostname}`, error);
  });
</script>

<Box dependencies={packagePromise.then(package_ => package_.dependencies)}>
  {#await packagePromise then package_}
    {#await isPackagePublic(package_.name) then isPublic}
      {#if isPublic}
        <Header
          hasDependencies={package_.dependencies.length}
          selfLink={!isPackageJson && packageURL}
          name={package_.name}
        />
      {/if}
    {/await}
  {/await}
</Box>
{#await packagePromise then package_}
  {#each types as type}
    {#if package_[getDependencyKey(type)]}
      <Box {type} dependencies={package_[getDependencyKey(type)]}></Box>
    {/if}
  {/each}
{/await}
