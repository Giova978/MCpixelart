# Minecraft pixelart generator

Generates an image made of Minecraft' blocks textures by similarity in averaged color of the block and an averaged portion of the input image.

Built using [SvelteKit](https://kit.svelte.dev/).

## Averaging the image

The file responsible for the averaging is [imageProcessing.ts](src/lib/imageProcessing.ts).

And the blocks' averaging is done by a [python script](https://github.com/Giova978/MCBlocksColorAverager).

## Color format

The color format used for comparison is LAB and the file responsible for transforming the averaged portion of the input image is [rgb2lab.ts](src/lib/rgb2lab.ts).

## Commands

```bash
# run dev server
npn run dev

# build release files
npm run build

# preview release
npm run preview
```
