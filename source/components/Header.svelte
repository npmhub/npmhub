<script>
  import HeaderLink from './HeaderLink.svelte';

  export let name;
  export let hasDependencies = false;
  export let selfLink = false;
</script>
{name}
{#if selfLink}
  <HeaderLink href={selfLink} label="package.json"/>
{/if}
<HeaderLink href="https://www.npmjs.com/package/{name}" label="npmjs.com"/>
<HeaderLink href="https://npm.runkit.com/{name}" label="RunKit"/>
<HeaderLink href="https://www.unpkg.com/browse/{name}@latest/" label="Explore contents"/>
{#if hasDependencies}
  <HeaderLink href="http://npm.broofa.com/?q={name}" label="Visualize full tree"/>
{/if}