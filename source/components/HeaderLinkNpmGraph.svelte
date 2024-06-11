<script>
  import HeaderLink from './HeaderLink.svelte';
  export let packageJson;

  function getInlinePackageUrl({name = 'uploaded via npmhub', dependencies, devDependencies, peerDependencies, bundledDependencies}) {
    const trimmedPackage = {
      name, dependencies, devDependencies, peerDependencies, bundledDependencies,
    };
    const parameters = new URLSearchParams([['packages', JSON.stringify([trimmedPackage])]]);
    return `https://npmgraph.js.org/?q=${name}#${parameters}`;
  }
</script>

<HeaderLink href={getInlinePackageUrl(packageJson)} label="Dependency tree"/>
