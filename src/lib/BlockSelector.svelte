<script lang="ts">
    import { createEventDispatcher } from "svelte";

    export let blockPositions: Record<string, number[]>;
    export let filter: string[];
    export let bannedTextures: Map<string, number[]>;
    export let invert: boolean = false;

    const dispatchBan = createEventDispatcher<{ ban: string }>();
    const dispatchBanAll = createEventDispatcher<{ banAll: { blocks: [string, number[]][]; checked: boolean } }>();
    let filteredBlocks: [[string, number[]], string][];

    if (!invert) {
        filteredBlocks = Object.entries(blockPositions).reduce((acc, [texture, pos]) => {
            for (let string of filter) {
                if (texture.includes(string)) {
                    acc.push([[texture, pos], string]);
                    break;
                }
            }

            return acc;
        }, [] as [[string, number[]], string][]);
    } else {
        filteredBlocks = Object.entries(blockPositions).reduce((acc, [texture, pos]) => {
            let found = false;

            for (let string of filter) {
                if (texture.includes(string)) {
                    found = true;
                    break;
                }
            }

            if (!found) acc.push([[texture, pos], ""]);
            return acc;
        }, [] as [[string, number[]], string][]);
    }

    $: blocks = filteredBlocks.sort((a, b) => (a[1] === b[1] ? 0 : 1)).map(([pos]) => pos);
    $: checked = filteredBlocks.reduce(
        (acc, [[texture]]) => (!acc || bannedTextures.has(texture) ? false : true),
        true,
    );
</script>

<article>
    <input type="checkbox" bind:checked on:click={() => dispatchBanAll("banAll", { blocks, checked })} />

    <div>
        {#each blocks as [texture, [x, y]], index (index)}
            <!-- svelte-ignore a11y-click-events-have-key-events -->
            <span
                class="image"
                style="background-position: -{x}px -{y}px"
                on:click={() => dispatchBan("ban", texture)}
                class:grey-border={bannedTextures.has(texture)}
            />
        {/each}
    </div>
</article>

<style lang="scss" scoped>
    @function color($varName, $A: 1) {
        @return Rgba(#{var($varName)}, $A);
    }

    article {
        --border-width: 5px;

        box-sizing: border-box;
        width: 80vw;
        display: grid;
        grid-template-columns: 30px 1fr;
        gap: 0.5rem;

        background: hsl(0, 0%, 90%);
        padding: 1rem;
        border-radius: 5px;

        input {
            width: 20px;
            height: 20px;
            grid-row: 1;
        }

        div {
            width: 100%;
            display: grid;
            grid-template-columns: repeat(auto-fill, calc(64px + var(--border-width) * 2));
            grid-auto-rows: 1fr;
            gap: 0.2rem;
            justify-content: space-between;

            grid-row: 2;
            grid-column: 1 / 3;
        }
    }

    span {
        position: relative;
        display: inline-block;
        width: 64px;
        height: 64px;
        background-image: url("images/spritemap64.png");
        cursor: pointer;

        border: var(--border-width) solid color(--accent-color);
    }

    .grey-border {
        border: var(--border-width) solid #ccc;
    }
</style>
