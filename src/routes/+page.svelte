<script lang="ts">
    import { onMount } from "svelte";
    import Modal from "$lib/Modal.svelte";
    import BlockSelector from "$lib/BlockSelector.svelte";

    import blockPositions64 from "$lib/data/blockPositions64.json";

    let previewCanvas: HTMLCanvasElement;
    let uploadedImage: HTMLCanvasElement;
    let spriteSheet: HTMLImageElement;
    let ctx: CanvasRenderingContext2D;
    let worker: Worker;
    let image: HTMLImageElement;

    const textureCategories = [
        ["log", "planks"],
        ["concrete_powder"],
        ["concrete.png"],
        ["glazed_terracotta", "terracotta"],
        ["wool"],
        ["sandstone"],
        ["ore"],
        ["trapdoor"],
        ["dead_", "coral"],
        ["blackstone"],
        ["snow"],
        ["prismarine"],
        ["basalt"],
        ["copper_block", "oxidized", "cut_copper"],
    ];
    const allowImagesFiles = ["image/png", "image/jpeg"];
    const BLOCK_TEXTURE_SIZE = 16;

    let bannedTextures: Map<string, number[]> = new Map();
    let fileUrl = "";
    let fileName = "No file selected";
    let uploadedImageUrl = "";
    let showResultModal = false;
    let pixelsToAverage: number[] = [16, 16];
    let downscaleFactor = 1;
    let sentToWorker = false;
    let imageSize = [0, 0];
    let dragging = false;

    // The bigger the smaller and less detailed the output image
    $: averagingSquareWidth = pixelsToAverage[0];
    $: averagingSquareHeight = pixelsToAverage[1];

    // Matrix containing the blocks that should replace the measured squared in the original image
    let newImageBlockNames: string[][] = [];

    function onFileSelected(event: Event) {
        if (!event.target) return;
        const target = event.target as HTMLInputElement;

        if (!target.files) return;
        if (target.files.length > 1) return;
        if (allowImagesFiles.indexOf(target.files[0].type) < 0) return;

        const file = target.files[0];
        uploadImage(file);
    }

    function uploadImage(file: File) {
        fileUrl = URL.createObjectURL(file);
        fileName = file.name;
        uploadedImageUrl = fileUrl;

        image.src = fileUrl;

        image.onload = () => {
            downscaleFactor = Math.max(image.width / 500, image.height / 500);
            if (downscaleFactor < 1) {
                downscaleFactor = 1;
            }

            previewCanvas.width = image.width / downscaleFactor;
            previewCanvas.height = image.height / downscaleFactor;

            imageSize = [image.width, image.height];
            const newWidth = (image.width / 16) * BLOCK_TEXTURE_SIZE;
            const newHeight = (image.height * newWidth) / image.width;

            pixelsToAverage = [
                Math.ceil((image.width / newWidth) * BLOCK_TEXTURE_SIZE),
                Math.ceil((image.height / newHeight) * BLOCK_TEXTURE_SIZE),
            ];

            // renderAveragingSquare();
        };
    }

    function renderAveragingSquare() {
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        ctx.lineWidth = 2;
        ctx.strokeStyle = "#00FF00";
        ctx.strokeRect(1, 1, averagingSquareWidth * downscaleFactor, averagingSquareHeight * downscaleFactor);
    }

    function processImage() {
        const ctx = uploadedImage.getContext("2d")!;
        uploadedImage.width = image.width;
        uploadedImage.height = image.height;

        ctx.drawImage(image, 0, 0);
        const imageData = ctx.getImageData(0, 0, image.width, image.height);

        worker.postMessage({
            imageData,
            averagingSquareWidth,
            averagingSquareHeight,
            bannedTextures,
        });

        sentToWorker = true;
    }

    function changeImageSize(event: Event) {
        if (!event.target) return;
        const target = event.target as HTMLInputElement & { dataset: { measure: string } };
        let newWidth, newHeight;

        switch (target.dataset.measure) {
            case "width":
                // Formula obtained from "Regla de tres simple"
                newWidth = +target.value * BLOCK_TEXTURE_SIZE;
                newHeight = (image.height * newWidth) / image.width;
                break;
            case "height":
                // Formula obtained from "Regla de tres simple"
                newHeight = +target.value * BLOCK_TEXTURE_SIZE;
                newWidth = (image.width * newHeight) / image.height;
                break;
            default:
                newWidth = 100;
                newHeight = 100;
                break;
        }

        pixelsToAverage = [
            Math.ceil((image.width / newWidth) * BLOCK_TEXTURE_SIZE),
            Math.ceil((image.height / newHeight) * BLOCK_TEXTURE_SIZE),
        ];

        imageSize = [newWidth, newHeight];
    }

    function dropFileHandler(event: DragEvent) {
        dragging = false;
        if (event.dataTransfer?.files) {
            const files = event.dataTransfer.files;
            console.log(files);
            if (files.length > 1) return;
            if (allowImagesFiles.indexOf(files[0].type) < 0) return;
            uploadImage(files[0]);
        }
    }

    function turnOnDragging() {
        dragging = true;
    }

    function turnOffDragging() {
        dragging = false;
    }

    function banTexture(event: CustomEvent<string>) {
        const texture = event.detail;
        if (bannedTextures.has(texture)) {
            bannedTextures.delete(texture);
        } else {
            bannedTextures.set(texture, [-100, -100, -100]);
        }

        bannedTextures = bannedTextures;
    }

    function banAll(event: CustomEvent<{ blocks: [string, number[]][]; checked: boolean }>) {
        const textures = event.detail.blocks;
        textures.forEach(([texture]) => {
            if (bannedTextures.has(texture)) {
                bannedTextures.delete(texture);
            } else if (event.detail.checked) {
                bannedTextures.set(texture, [-100000, -100000, -1000000]);
            }
        });

        bannedTextures = bannedTextures;
    }

    onMount(async () => {
        ctx = previewCanvas.getContext("2d")!;
        image = new Image();

        const importedWorker = await import("$lib/imageProcessing.worker?worker");
        worker = new importedWorker.default();

        worker.onmessage = ({ data }) => {
            newImageBlockNames = data;
            sentToWorker = false;
            showResultModal = true;
        };
    });
</script>

<svelte:window on:dragenter|={turnOnDragging} on:dragover={turnOnDragging} on:dragleave|capture={turnOffDragging} />

<nav>
    <h1>Pixel art generator</h1>
</nav>

<main>
    <article>
        <span
            class="drop-notice"
            class:drop-here-animated={dragging}
            on:drop|preventDefault={dropFileHandler}
            on:dragover|preventDefault>Drop your images here</span
        >
        <canvas
            bind:this={previewCanvas}
            class="preview"
            style="background-image: url({fileUrl});"
            on:drop|preventDefault={dropFileHandler}
            on:dragover|preventDefault
            class:drop-here={dragging}
        />

        <label class="file-upload">
            <input type="file" on:change={onFileSelected} accept=".jpeg, .png" />
            Select file
        </label>

        <label class="image-size" class:disabled={!fileUrl}>
            <span>Generated image dimensions</span>
            <input type="text" data-measure="width" value={Math.ceil(imageSize[0] / 16)} on:change={changeImageSize} />
            <input type="text" data-measure="height" value={Math.ceil(imageSize[1] / 16)} on:change={changeImageSize} />
        </label>

        <!-- <label class="averaging-square x" class:disabled={!fileUrl}>
            <span>Averaging square width</span>
            <input type="range" min="4" max="64" on:change={renderAveragingSquare} bind:value={pixelsToAverage[0]} />
            <input type="number" min="4" max="64" on:change={renderAveragingSquare} bind:value={pixelsToAverage[0]} />
        </label>

        <label class="averaging-square y" class:disabled={!fileUrl}>
            <span>Averaging square height</span>
            <input type="range" min="4" max="64" on:change={renderAveragingSquare} bind:value={pixelsToAverage[1]} />
            <input type="number" min="4" max="64" on:change={renderAveragingSquare} bind:value={pixelsToAverage[1]} />
        </label> -->

        {#if averagingSquareWidth < 16 || averagingSquareHeight < 16}
            <span class="notice" class:show={averagingSquareWidth < 9 || averagingSquareHeight < 9}>
                *Notice: the smaller the averaging square's size, the slower the generation will be
            </span>
        {:else}
            <span class="notice" class:show={averagingSquareWidth > 32 || averagingSquareHeight > 32}>
                *Notice: the bigger the averaging square's size, the lower the resolution will be
            </span>
        {/if}
        <button class:disabled={!fileUrl} class:loading={sentToWorker} class="convert" on:click={processImage}
            >Convert!</button
        >
    </article>

    <div class="canvas">
        <canvas bind:this={uploadedImage} class="uploaded-imgae" style="display: none;" />
    </div>

    <img src="images/spritemap.png" hidden alt="Sprite map" bind:this={spriteSheet} />
    <article class="texture-bans">
        {#each textureCategories as categories, index (index)}
            <BlockSelector
                blockPositions={blockPositions64}
                filter={categories}
                {bannedTextures}
                on:ban={banTexture}
                on:banAll={banAll}
            />
        {/each}

        <BlockSelector
            blockPositions={blockPositions64}
            filter={textureCategories.flat()}
            {bannedTextures}
            invert={true}
            on:ban={banTexture}
            on:banAll={banAll}
        />
    </article>
</main>

<Modal
    show={showResultModal}
    newImageData={newImageBlockNames}
    {spriteSheet}
    on:hide={() => (showResultModal = false)}
/>

<style lang="scss">
    :root {
        --text-color: 255, 255, 255;
        --accent-color: 21, 113, 69;
        --accent-color-2: 57, 67, 183;
    }

    @function color($varName, $A: 1) {
        @return Rgba(#{var($varName)}, $A);
    }

    nav {
        color: color(--text-color);
        font-size: 2rem;
        height: 1em;
        font-weight: 300;
        background: color(--accent-color);
        box-shadow: 0px 0px 20px 0px color(--accent-color, 1);
        padding: 0.25em;

        h1 {
            margin: 0;
        }
    }

    main {
        margin-top: 1.5rem;
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
            opacity: 0.5;
            border-radius: inherit;
        }
    }

    article.texture-bans {
        box-sizing: border-box;
        width: 100%;
        padding: 1rem;
        display: grid;
        grid-auto-flow: row;
        gap: 1rem 0;
    }

    article {
        display: grid;
        grid-template-rows: 1fr auto;
        justify-items: center;

        .drop-notice {
            margin-bottom: 0.5rem;
            color: #686767;
            opacity: 0.8;
            font-style: italic;
            font-weight: 300;
        }

        .drop-here {
            background: color(--accent-color-2);
            opacity: 0.8;
        }

        .drop-here-animated {
            opacity: 1;
            animation: drop-here 1.5s infinite ease-in-out forwards;
        }

        .preview {
            position: relative;
            background-size: cover;
            max-width: 500px;
            max-height: 500px;
            box-shadow: 0px 10px 15px 1px rgba(#000, 0.3);
        }

        .notice {
            width: 230px;
            font-size: 1rem;
            color: #686767;
            transform: scale(0);
            transition: transform 0.3s ease-out;

            &.show {
                transform: scale(1);
            }
        }

        .image-size {
            margin-top: 1rem;
            display: grid;
            grid-template-columns: 1fr;
            grid-template-columns: 1fr 1fr;
            gap: 0.5rem 1rem;

            color: color(--text-color);
            margin-top: 1rem;
            background: color(--accent-color-2);
            padding: 0.25rem;
            border-radius: 5px;

            span {
                grid-row: 1;
                grid-column: 1 / 3;
            }

            input {
                grid-row: 2;
                width: 50px;
                position: relative;

                &:last-of-type {
                    justify-self: left;
                }

                &:first-of-type {
                    justify-self: right;
                }
            }
        }

        // .averaging-square.x,
        // .y {
        //     display: grid;
        //     grid-template-rows: 1fr 1fr;
        //     gap: 4px 1rem;

        //     color: color(--text-color);
        //     margin-top: 1rem;
        //     background: color(--accent-color-2);
        //     padding: 0.25rem;
        //     border-radius: 5px;

        //     span {
        //         grid-column: 1 / 3;
        //         justify-self: center;
        //     }

        //     input[type="range"] {
        //         margin: 0;
        //         grid-row: 2;

        //         &::-moz-progress-bar {
        //             background-color: color(--text-color);
        //         }
        //     }

        //     input[type="number"] {
        //         grid-row: 2;
        //         max-width: 40px;
        //     }
        // }

        .file-upload {
            color: color(--text-color);
            margin-top: 2rem;
            width: 75px;
            position: relative;
            display: inline-block;
            background: color(--accent-color-2);
            padding: 0.25rem;
            border-radius: 5px;
            border: 1px solid color(--accent-color-2);
            transition: transform 0.3s ease;
            filter: brightness(1.2);

            &:hover {
                display: inline-block;
                transform: translateY(-5px);
                cursor: pointer;
            }

            input[type="file"] {
                display: none;
            }
        }

        button.convert {
            width: 120px;
            height: 40px;
            margin-top: 1.2rem;
            font-size: 1.5rem;
            transition: transform 0.3s ease;

            border: none;
            border-radius: 5px;

            color: color(--text-color);
            background: color(--accent-color);

            &:hover {
                transform: scale(1.3);
                filter: brightness(1.2);
            }
        }

        .loading {
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
                opacity: 0.5;
                border-radius: inherit;
            }
            &::before {
                content: "";
                position: absolute;
                top: 50%;
                left: 50%;
                margin-top: -18px;
                margin-left: -18px;
                width: 25px;
                height: 25px;
                border-radius: 50px;
                border: 5px solid #ccc;
                border-top-color: cyan;
                animation: loading 2s linear infinite;
                z-index: 2;
            }
        }

        @keyframes loading {
            0% {
                transform: rotate(0deg);
            }
            100% {
                transform: rotate(360deg);
            }
        }

        @keyframes drop-here {
            0% {
                transform: scale(1);
            }

            50% {
                transform: scale(1.3);
            }

            100% {
                transform: scale(1);
            }
        }
    }
</style>
