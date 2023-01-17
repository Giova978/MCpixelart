<script lang="ts">
	import resizeImage from 'resize-image-data';	
	import {rgb2lab, deltaE} from "$lib/rgb2lab";
	import { onMount } from "svelte"
	import Modal from "$lib/Modal.svelte";
	import { findClosestColor, getAverageColor, groupPixels, imageToBlocks, imageToBlocks2 } from '$lib/imageProcessing';

	let previewCanvas: HTMLCanvasElement
	let uploadedImage: HTMLCanvasElement;
	let spriteSheet: HTMLImageElement;
	let ctx: CanvasRenderingContext2D;
	
	let fileUrl = "";
	let fileName = "No file selected"
	let uploadedImageUrl = ""
	let showResultModal = false
	let pixelsToAverage: number[] = [16, 16]
	let downscaleFactor = 1
	
	// How big should the averaging square be
	// The bigger the smaller and less detailed the output image
	$: averagingSquareWidth = pixelsToAverage[0]
	$: averagingSquareHeight = pixelsToAverage[1]

	// Matrix containing the blocks that should replace the measured squared in the original image
	let newImageBlockNames: string[][] = []

	function onFileSelected(event: Event) {
		// @ts-expect-error
		const file = event.target.files[0]
		fileUrl = URL.createObjectURL(file)
		fileName = file.name
		uploadedImageUrl = fileUrl

		let image = new Image()
		image.src = fileUrl

		image.onload = () => {
			downscaleFactor = Math.max(image.width  / 500, image.height / 500)
			if (downscaleFactor < 1) {
				downscaleFactor = 1
			}	

			const ctx = previewCanvas.getContext('2d')!

			previewCanvas.width = image.width / downscaleFactor
			previewCanvas.height = image.height / downscaleFactor

			// ctx.drawImage(image, 0, 0, image.width / downscaleFactor, image.height / downscaleFactor)
			renderAveragingSquare()
		}
	}

	function renderAveragingSquare() {
		ctx.clearRect(0,0, ctx.canvas.width, ctx.canvas.height)
		ctx.lineWidth = 2
		ctx.strokeStyle = "#00FF00"
		ctx.strokeRect(1,1, averagingSquareWidth* downscaleFactor, averagingSquareHeight * downscaleFactor)
	}

	function processImage() {
		let image = new Image()
		image.src = fileUrl

		image.onload = () => {
		
			const ctx = uploadedImage.getContext('2d')!
			uploadedImage.width = image.width
			uploadedImage.height = image.height
			
			// ctx.drawImage(image, 0, 0)
			// const imageData = ctx.getImageData(0,0, image.width, image.height) 

			// @ts-ignore
			// image = resizeImage(imageData, 128, (image.height * (128 / image.width)), "nearest-neighbor")
			// uploadedImage.width = image.width
			// uploadedImage.height = image.height

			ctx.drawImage(image, 0, 0)
			const imageData = ctx.getImageData(0, 0, image.width, image.height)
			// console.log(groupPixels(ctx.getImageData(0,0,image.width, image.height), averagingSquareWidth, averagingSquareHeight));
			// newImageBlockNames = imageToBlocks2(ctx.getImageData(0,0,image.width, image.height), averagingSquareWidth, averagingSquareHeight)
			// showResultModal = true

			newImageBlockNames = imageToBlocks(imageData, averagingSquareWidth, averagingSquareHeight)
			showResultModal = true
			return

			// How many time we have move our averaging square in the x and y coordinates
			const xIterations = Math.ceil(image.width / averagingSquareWidth)
			const yIterations = Math.ceil(image.height / averagingSquareHeight)
			
			let timeAvg = 0

			// const xIterations = image.width//Math.ceil(image.width / averagingSquareWidth)
			// const yIterations = image.height//Math.ceil(image.height / averagingSquareHeight)

			const cache = new Map<string, string>()

			// Reset items from previous conversions without reassigment
			newImageBlockNames.length = 0
			for (let yOffsetFactor = 0; yOffsetFactor < yIterations; yOffsetFactor++) {
				let height = image.height % averagingSquareHeight
				height = yOffsetFactor === yIterations - 1 && height > 0 ? height : averagingSquareHeight

				// First array representing the y lines in the image
				newImageBlockNames[yOffsetFactor] = []

				for (let xOffsetFactor = 0; xOffsetFactor < xIterations; xOffsetFactor++) {
					let width = image.width % averagingSquareWidth 
					width = xOffsetFactor === xIterations - 1 && width > 0 ? width : averagingSquareWidth
					
					// @ts-ignore
					// const [r, g, b, a] = image.data.slice(xOffsetFactor*4, 4+(4*xOffsetFactor))
					// const avgColor = [r, g, b]
					const t0 = performance.now()
					const data = ctx.getImageData(averagingSquareWidth*xOffsetFactor, averagingSquareHeight*yOffsetFactor, width, height).data 
					const t1 = performance.now()
					timeAvg += t1 - t0
					const avgColor = getAverageColor(data)

					let closestColoredBlock;
					if (cache.has(avgColor.toString())) {
						closestColoredBlock = cache.get(avgColor.toString())!
					} else {
						closestColoredBlock = findClosestColor(avgColor)
					}

					newImageBlockNames[yOffsetFactor].push(closestColoredBlock)
				}
			}
			
			console.log(timeAvg / (xIterations * yIterations))
			showResultModal = true
		}
	}
	
	
	onMount(() => {
		ctx = previewCanvas.getContext('2d')!
	})

</script>

<nav>
	<h1>Pixel art generator</h1>
</nav>

<main>
	<article>
		<canvas bind:this={previewCanvas} class="preview" style="background-image: url({fileUrl});"></canvas>
		<!-- <canvas src="{uploadedImageUrl}" alt="">	 -->

		<label class="file-upload">
			<input type="file" on:change={onFileSelected} accept=".jpeg, .png"/>
			Select file
		</label>

		<label class="averaging-square x" class:disabled={!fileUrl}>
			<span>Averaging square width</span>
			<input type="range" min="4" max="64" on:change={renderAveragingSquare} bind:value={pixelsToAverage[0]}>
			<input type="number" min="4" max="64" on:change={renderAveragingSquare} bind:value={pixelsToAverage[0]} />
		</label>
		
		<label class="averaging-square y"  class:disabled={!fileUrl}>
			<span>Averaging square height</span>
			<input type="range" min="4" max="64" on:change={renderAveragingSquare} bind:value={pixelsToAverage[1]}>
			<input type="number" min="4" max="64" on:change={renderAveragingSquare} bind:value={pixelsToAverage[1]} />
		</label>

		{#if averagingSquareWidth < 16 || averagingSquareHeight < 16}
			<span class="notice" class:show={averagingSquareWidth < 9 || averagingSquareHeight < 9}>
				*Notice: the smaller the averaging square's size, the slower the generation will be
			</span>
		{:else}
			<span class="notice" class:show={averagingSquareWidth > 32 || averagingSquareHeight > 32}>
				*Notice: the bigger the averaging square's size, the lower the resolution will be
			</span>
		{/if}
		<button class:disabled={!fileUrl} class="convert" on:click={processImage}>Convert!</button>
	</article>

	<div class="canvas">
		<canvas bind:this={uploadedImage} class="uploaded-imgae" style="display: none;"></canvas>
	</div>

	<img src="images/spritemap.png" hidden alt="Sprite map" bind:this={spriteSheet}/>
</main>

<Modal show={showResultModal} newImageData={newImageBlockNames} spriteSheet={spriteSheet} on:hide={() => showResultModal = false}/>

<style lang="scss">
:root {
	--text-color: 255, 255, 255;
	--accent-color: 21, 113, 69;
	--accent-color-2: 57, 67, 183;
}

@function color($varName, $A: 1) {
	@return Rgba(#{var($varName)}, $A)
}

nav {
	color: color(--text-color);
	font-size: 2rem;
	height: 1em;
	font-weight: 300;
	background: color(--accent-color);
	box-shadow: 0px 0px 20px 0px color(--accent-color, 1);
	padding: .25em;

	h1 {
		margin: 0;
	}
}

main {
	margin-top: 2rem;
}

.disabled {
	position: relative;
	pointer-events: none;
	user-select: none;
	
	&::after {
		position: absolute;
		content: "";
		top: 0;
		left: 0;
		background: #3b3b3b;
		width: 100%;
		height: 100%;
		opacity: .5;
		border-radius: inherit;
	}
}

article {
	display: grid;
	grid-template-rows: 1fr auto;
	justify-items: center;

	.preview {
		position: relative;
		background-size: cover;
		max-width: 500px;
		max-height: 500px;
		box-shadow: 0px 10px 15px 1px rgba(#000, .3);
	}


		.notice {
			width: 230px;
			font-size: 1rem;
			color: #686767;
			transform: scale(0);
			transition: transform .3s ease-out;
			
			&.show {
				transform: scale(1);
			}
	}

	.averaging-square.x, .y {
		display: grid;
		grid-template-rows: 1fr 1fr;
		gap: 4px 1rem;

		color: color(--text-color);
		margin-top: 1rem;
		background: color(--accent-color-2);
		padding: .25rem;
		border-radius: 5px;

		span {
			grid-column: 1 / 3;
			justify-self: center;
		}

		input[type=range] {
			margin: 0;
			grid-row: 2;

			&::-moz-progress-bar {
				background-color: color(--text-color);
			}
		}

		input[type=number] {
			grid-row: 2;
			max-width: 40px;
		}
	}
	
	.file-upload {
		color: color(--text-color);
		margin-top: 2rem;
		width: 75px;
		position: relative;
		display: inline-block;
		background: color(--accent-color-2);
		padding: .25rem;
		border-radius: 5px;
		border: 1px solid color(--accent-color-2);
		transition: transform .3s ease;
		filter: brightness(1.2);

		&:hover {
			display: inline-block;
			transform: translateY(-5px);
			cursor: pointer;
		}

		input[type=file] {
			display: none;
		}
	}

	button.convert {
		width: 120px;
		height: 40px;
		margin-top: 2rem;
		font-size: 1.5rem;
		transition: transform .3s ease;

		border: none;
		border-radius: 5px;

		color: color(--text-color);
		background: color(--accent-color);

		&:hover {
			transform: scale(1.3);
			filter: brightness(1.2);
		}
	}
}
</style>