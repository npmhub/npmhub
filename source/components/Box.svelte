<script>
  export let type = '';
  export let dependencies;
  export let id = type.toLowerCase() + 'dependencies';
</script>


<div {id} class="Box Box--condensed mt-5 file-holder">
  <div class="npmhub-header BtnGroup">
    <slot></slot>
  </div>
  <h3 class="Box-header Box-title px-2">{type} Dependencies</h3>
  <ol class="npmhub-deps markdown-body">
    {#await dependencies then dependencies}
      {#if dependencies}
        {#if dependencies.length === 0}
          <li class="npmhub-empty">
            No dependencies!
            <g-emoji class="g-emoji" alias="tada" fallback-src="https://github.githubassets.com/images/icons/emoji/unicode/1f389.png">🎉</g-emoji>
          </li>
        {:else}
          {#each dependencies as {name, info}}
            <li>
              {#await info}
                <a href='https://www.npmjs.com/package/{name}'>
                  {name}
                </a>
              {:then info}
                <a href={info.url ?? `https://www.npmjs.com/package/${name}`}>
                  {name}
                </a>
                {#if info.error === 'Not found'}
                  <em>Not published or private.</em>
                {:else if info.error}
                  <em>Error: {info.error}</em>
                {:else if info.description}
                  {info.description}
                {:else}
                  <em>No description.</em>
                {/if}
              {/await}
            </li>
          {/each}
        {/if}
      {/if}
    {:catch}
      <li class="npmhub-empty">
        <em>There was a network error.</em>
      </li>
    {/await}
  </ol>
</div>
