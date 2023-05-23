<script>
  import Box from './Box.svelte';
  import HeaderLink from './HeaderLink.svelte';

  export let packageURL;
  export let isPackageJson;

  // `content.fetch` is Firefox’s way to make fetches from the page instead of from a different context
  // This will set the correct `origin` header
  // https://github.com/npmhub/npmhub/pull/164
  // https://stackoverflow.com/questions/47356375/firefox-fetch-api-how-to-omit-the-origin-header-in-the-request
  // https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/Content_scripts#XHR_and_Fetch
  const localFetch = globalThis.content?.fetch ?? globalThis.fetch;

  const errorMessage = 'npmhub: there was an error while';

  function getDependencyKey(type) {
    return type.toLowerCase() + 'Dependencies';
  }

  async function getPackageJson() {
    const urlParts = packageURL.split('/');
    urlParts[5] = 'raw';
    const rawUrl = urlParts.join('/');
    // Fetching from the content script enables support for private repos.
    // Do not change this to use `raw.githubusercontent.com` for the same reason.
    const request = await localFetch(rawUrl);
    return request.json();
  }

  async function getLocalPackage() {
    const packageJson = await getPackageJson();
    const package_ = {
      name: packageJson.name,
      version: packageJson.version,
      dependencies: Object.keys(packageJson.dependencies || {}).map(name => ({
        name,
        info: fetchPackageInfo(name),
      })),
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
          info: fetchPackageInfo(name),
        }));
      }
    }

    return package_;
  }

  async function fetchPackageInfo(name) {
    // Get the data from NPM registry via background.js due to CORB policies introduced in Chrome 73
    return new Promise(resolve => {
      chrome.runtime.sendMessage({fetchPackageInfo: name}, resolve);
    });
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
    'Dev',
  ];

  // TODO: also show error in the UI
  const packagePromise = getLocalPackage();
  packagePromise.catch(error => {
    console.warn(`${errorMessage} fetching the current package.json from ${window.location.hostname}`, error);
  });
</script>

<div class="clearfix container-xl px-3 px-md-4 px-lg-5 mt-4">
  <!-- `z-index` due to https://github.com/npmhub/npmhub/issues/147 -->
  <Box dependencies={packagePromise.then(package_ => package_.dependencies)} style="z-index: 1">
    {#if !isPackageJson}
      <HeaderLink href={packageURL} label="package.json"/>
    {/if}
    {#await packagePromise then package_}
      {#if package_.name}
        {#await isPackagePublic(package_.name) then isPublic}
          {#if isPublic}
            <HeaderLink href="https://www.npmjs.com/package/{package_.name}" label="npm"/>
            <HeaderLink href="https://npm.runkit.com/{package_.name}" label="RunKit"/>
            <details class="dropdown details-reset details-overlay d-inline-block BtnGroup-parent">
              <summary class="btn btn-sm BtnGroup-item" aria-haspopup="true">
                <div class="dropdown-caret m-0"></div>
              </summary>

              <ul class="dropdown-menu dropdown-menu-sw">
                <li><a class="dropdown-item" href="https://www.unpkg.com/browse/{package_.name}@{package_.version}/">Contents</a></li>
                <li><a class="dropdown-item" href="https://bundlephobia.com/package/{package_.name}">BundlePhobia</a></li>
                <li><a class="dropdown-item" href="https://packagephobia.com/result?p={package_.name}">PackagePhobia</a></li>
                <li><a class="dropdown-item" href="https://npmgraph.js.org/?q={package_.name}">Dependency tree</a></li>
                <li><a class="dropdown-item" href="https://paka.dev/npm/{package_.name}">Types (if any)</a></li>
              </ul>
            </details>
          {/if}
        {/await}
      {/if}
    {/await}
  </Box>
  {#await packagePromise then package_}
    {#each types as type}
      {#if package_[getDependencyKey(type)]}
        <Box {type} dependencies={package_[getDependencyKey(type)]}></Box>
      {/if}
    {/each}
  {/await}
</div>
