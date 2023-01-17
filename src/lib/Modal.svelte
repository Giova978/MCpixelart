<script lang="ts">
	import blockPositions from "$lib/data/blockPositions.json"
    import { createEventDispatcher, tick } from "svelte";

	export let show = false;
	export let spriteSheet: HTMLImageElement;
	export let newImageData: string[][];
	let canvas: HTMLCanvasElement;
	const dispatch = createEventDispatcher()

	function render(ctx: CanvasRenderingContext2D, blocksMatrix: string[][]) {
		for (let yFactor = 0; yFactor < blocksMatrix.length; yFactor++) {
			for (let xFactor = 0; xFactor < blocksMatrix[yFactor].length; xFactor++) {
				const block = blocksMatrix[yFactor][xFactor]
				// @ts-expect-error
				const [x, y, w, h] = blockPositions[block]
				createImageBitmap(spriteSheet, x, y, w, h).then(subImage => ctx.drawImage(subImage, 16*xFactor, 16*yFactor))
			}
		}
	}

	$: if (show) {
		// Wait for the html to render before updating the canvas
		tick().then(() => {
			render(canvas.getContext('2d')!, newImageData)
		})
	}

</script>

{#if show}
	<article class="modal">
		<div>
			<div>
				<canvas bind:this={canvas} width="{newImageData[0].length * 16}" height="{newImageData.length * 16}"></canvas>
			</div>
			<button on:click={() => dispatch('hide')}>X</button>
		</div>
	</article>
{/if}

<style lang="scss">
	.modal {
		width: 100%;
		height: 100%;
		position: absolute;
		top: 0;
		left: 0;
		
		display: grid;
		justify-items: center;
		align-items: center;
		background: rgba(#000, .4);

		& > div {
			width: auto;
			position: relative;
			background: #fff;

			div {
				max-width: 90vw;
				max-height: 90vh;
				overflow-y: scroll;
				overflow-x: auto;
				scrollbar-gutter: stable;

				canvas {
					display: block;
				}
			}	

			button {
				font-family: 'Rubik', sans-serif;
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
		}	
	}
</style>