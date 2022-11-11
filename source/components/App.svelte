<script>
  import elementReady from 'element-ready';
  import fetchDom from '../lib/fetch-dom';
  import Box from './Box.svelte';
  import HeaderLink from './HeaderLink.svelte';

  export let packageURL;
  export let isPackageJson;

  const errorMessage = 'npmhub: there was an error while';

  function getDependencyKey(type) {
    return type.toLowerCase() + 'Dependencies';
  }

  async function getBlobContentFromDOM(document_) {
    
    const fileSourceElementSelectors = [
      'main main table[data-tab-size]',
      'table[data-tab-size]',
      'main table'
    ];

    let jsonBlobElement;
    while (!jsonBlobElement && fileSourceElementSelectors.length) {
      jsonBlobElement = await elementReady(fileSourceElementSelectors.shift(), {target: document_, timeout: 1000});
    }
    if (!jsonBlobElement) {
      // Cannot find the content of the package.json in the DOM
      return undefined;
    }
  }

  /**
   * The blob content can be found within:
   *   <script type="application/json" data-target="react-app.embeddedData"
   *           {"payload":{ ...
   *   </script
   */
  async function getBlobContentFromEmbeddedData(document_) {
    const embeddedDataElement = await elementReady('script[data-target="react-app.embeddedData"]', {target: document_, timeout: 1000});
    const embeddedData = JSON.parse(embeddedDataElement.textContent);
    return embeddedData?.payload?.blob?.rawBlob;
  }

  // The November 2022 new deployment does a client-side render of blob pages, making the DOM approach fail.
  async function getPackageJsonContent() {
    // Pull text out of the /blob/ page HTML, as the /raw/ is a diff origin without CORS.
    const document_ = isPackageJson ? document : await fetchDom(packageURL);

    let jsonStr = await getBlobContentFromDOM(document_);
    if (!jsonStr) {
      jsonStr = await getBlobContentFromEmbeddedData(document_);
    }

    return JSON.parse(jsonStr);
  }

  async function getLocalPackage() {
    const packageJson = await getPackageJsonContent();
    const package_ = {
      name: packageJson.name,
      version: packageJson.version,
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

    if (error !== 'Not found') {
      console.warn(`${errorMessage} pinging the (${name}) package on npmjs.org:`, error);
    }

    return false;
  }

  const types = [
    'Peer',
    'Bundled',
    'Optional',
    'Dev'
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
