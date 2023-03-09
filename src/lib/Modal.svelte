<script lang="ts">
    import blockPositions from "$lib/data/blockPositions.json";
    import { createEventDispatcher, tick } from "svelte";
    import {} from "svelte/animate";
    import { clickOutside } from "./clickOutside";
    import {
        AlongAxis,
        frontFacingEast,
        frontFacingNorth,
        frontFacingSouth,
        frontFacingWest,
        generateSetblock,
        type Facing,
    } from "./generateSetblock";

    export let show = false;
    export let spriteSheet: HTMLImageElement;
    export let newImageData: string[][];
    let canvas: HTMLCanvasElement;
    let textarea: HTMLTextAreaElement;
    const dispatch = createEventDispatcher();

    let showCanvas = true;
    let commands = "";
    let showCommand = false;
    let opposingAxisOffset = 10;
    let axis = AlongAxis.AlongX;
    let facing: Facing = frontFacingNorth;

    $: {
        if (axis == AlongAxis.AlongZ) {
            facing = frontFacingWest;
        } else {
            facing = frontFacingNorth;
        }
    }

    function render(ctx: CanvasRenderingContext2D, blocksMatrix: string[][]) {
        for (let yFactor = 0; yFactor < blocksMatrix.length; yFactor++) {
            for (let xFactor = 0; xFactor < blocksMatrix[yFactor].length; xFactor++) {
                const block = blocksMatrix[yFactor][xFactor];
                // @ts-expect-error
                const [x, y, w, h] = blockPositions[block];
                createImageBitmap(spriteSheet, x, y, w, h).then((subImage) =>
                    ctx.drawImage(subImage, 16 * xFactor, 16 * yFactor),
                );
            }
        }
    }

    function generateCommands() {
        commands = generateSetblock(newImageData, axis, facing, opposingAxisOffset);

        showCommand = true;
        showCanvas = false;
    }

    function swapCanvas() {
        showCommand = false;
        showCanvas = true;
    }

    $: if (showCanvas && show) {
        // Wait for the html to render before updating the canvas
        tick().then(() => {
            render(canvas.getContext("2d")!, newImageData);
        });
    }
</script>

{#if show}
    <article class="modal">
        <div use:clickOutside on:clickOutside={() => dispatch("hide")}>
            <article>
                <button on:click={generateCommands}>Generate command</button>
                <fieldset>
                    <h2>Axis:</h2>
                    <label>
                        <input type="radio" bind:group={axis} name="axis" value={AlongAxis.AlongX} />
                        Along X
                    </label>

                    <label>
                        <input type="radio" bind:group={axis} name="axis" value={AlongAxis.AlongZ} />
                        Along Z
                    </label>
                </fieldset>
                <fieldset>
                    <h2>Facing:</h2>

                    {#if axis == AlongAxis.AlongX}
                        <label>
                            <input type="radio" bind:group={facing} name="facing" value={frontFacingNorth} />
                            Facing North
                        </label>
                        <label>
                            <input type="radio" bind:group={facing} name="facing" value={frontFacingSouth} />
                            Facing South
                        </label>
                    {:else}
                        <label>
                            <input type="radio" bind:group={facing} name="facing" value={frontFacingWest} checked />
                            Facing West
                        </label>
                        <label>
                            <input type="radio" bind:group={facing} name="facing" value={frontFacingEast} />
                            Facing East
                        </label>
                    {/if}
                </fieldset>
                <fieldset>
                    <label>
                        Distance from the player in the opposite direction
                        <input type="number" value={opposingAxisOffset} />
                    </label>
                </fieldset>
            </article>
            <div>
                {#if showCommand}
                    <textarea autocomplete="off" readonly bind:this={textarea}>{commands}</textarea>
                {:else}
                    <canvas bind:this={canvas} width={newImageData[0].length * 16} height={newImageData.length * 16} />
                {/if}
            </div>
            {#if showCommand}
                <button on:click={() => navigator.clipboard.writeText(textarea.value)} class="copy-to-clipboard"
                    >Copy to Clipboard</button
                >
                <button on:click={swapCanvas} id="noclose" class="back">Back</button>
            {/if}
            <button on:click={() => dispatch("hide")} class="close">X</button>
        </div>
    </article>
{/if}

<style lang="scss">
    @function color($varName, $A: 1) {
        @return Rgba(#{var($varName)}, $A);
    }

    button {
        font-family: "Rubik", sans-serif;
        cursor: pointer;
        border: none;
        border-radius: 5px;

        color: color(--text-color);
        background: color(--accent-color);
    }

    .modal {
        width: 100%;
        height: 100%;
        position: absolute;
        top: 0;
        left: 0;

        display: grid;
        justify-items: center;
        align-items: center;
        background: rgba(#000, 0.4);

        article {
            max-width: 145px;

            button {
                display: block;
                padding: 0.5rem;
                font-size: 1.3rem;
            }

            fieldset {
                color: #fff;
                margin: 0.5rem 0;
                padding: 0.5rem;
                border-radius: 5px;
                background-color: color(--accent-color-2);

                label {
                    margin-top: 0.2rem;
                    display: block;
                }

                input[type="number"] {
                    max-width: 50px;
                }
            }
        }

        & > div {
            width: auto;
            position: relative;
            background: none;
            display: grid;
            grid-template-columns: 10% minmax(1fr, 80vw);
            gap: 1rem;

            div {
                grid-column: 2;
                max-width: 90vw;
                max-height: 80vh;
                overflow-y: scroll;
                overflow-x: auto;
                scrollbar-gutter: stable;

                canvas {
                    display: block;
                }

                textarea {
                    width: 75vw;
                    resize: none;
                    height: 78vh;
                    outline: none;
                    border: none;
                }
            }

            .close {
                position: absolute;
                width: 30px;
                height: 30px;
                font-size: 1.5rem;
                line-height: 1px;
                font-weight: 500;
                top: -35px;
                right: -35px;

                border: 0;
                border-radius: 5px;
            }

            .back {
                @extend .close;
                width: auto;
                left: 0;
                background-color: color(--accent-color-2);
            }

            .copy-to-clipboard {
                @extend .close;
                width: auto;
                right: 0;

                &:active {
                    animation: scaleDown 0.8s ease forwards;
                }
            }

            @keyframes scaleDown {
                from {
                    transform: scale(1);
                }

                to {
                    transform: scale(0.8);
                }
            }
        }
    }
</style>
