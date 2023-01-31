import { deltaE, rgb2lab } from "./rgb2lab";
import blocksColor from "$lib/data/avgColorPerBlock.json";

export async function imageToBlocks(image: ImageData, averagingSquareWidth: number, averagingSquareHeight: number) {
    const xIterations = Math.ceil(image.width / averagingSquareWidth);
    const yIterations = Math.ceil(image.height / averagingSquareHeight);

    const colorAverageToBlockCache = new Map<string, string>();

    const leftoverHeight = image.height % averagingSquareHeight;
    const leftoverWidth = image.width % averagingSquareWidth;

    const blocks: string[][] = [];
    for (let yOffset = 0; yOffset < yIterations; yOffset++) {
        const squareHeight = yOffset === yIterations - 1 && leftoverHeight > 0 ? leftoverHeight : averagingSquareHeight;

        blocks[yOffset] = [];
        const pixelsInAreasPromises = [];
        for (let xOffset = 0; xOffset < xIterations; xOffset++) {
            const squareWidth = xOffset === xIterations - 1 && leftoverWidth > 0 ? leftoverWidth : averagingSquareWidth;
            pixelsInAreasPromises.push(getPixelsInAreaAverageColor(image, yOffset, xOffset, averagingSquareHeight, averagingSquareWidth, squareHeight, squareWidth))

        }

        const areasAverageColor = await Promise.all(pixelsInAreasPromises)
        blocks[yOffset] = areasAverageColor.reduce((acc, avgColor) => {
            let closestColoredBlock = colorAverageToBlockCache.get(avgColor.toString()) ?? findClosestColor(avgColor);
            if (!closestColoredBlock) {
                closestColoredBlock = findClosestColor(avgColor);
                colorAverageToBlockCache.set(avgColor.toString(), closestColoredBlock);
            }

            acc.push(closestColoredBlock)
            return acc
        }, [] as string[])
    }

    return blocks;
}

async function getPixelsInAreaAverageColor(image: ImageData, yOffset: number, xOffset: number, averagingSquareHeight: number, averagingSquareWidth: number, squareHeight: number, squareWidth: number) {
    // Since Uint8ClampedArray from image.data is flat we need to offset our slice by 4 to account for R G B A individual pixel values
    const PIXELS_OFFSET = 4;

    const startPosition = yOffset * averagingSquareHeight
    const pixels: Uint8ClampedArray[] = []
    for (let y = startPosition; y < startPosition + squareHeight; y++) {
        const cursor = PIXELS_OFFSET * (y * image.width + xOffset * averagingSquareWidth);
        const line = image.data.slice(cursor, cursor + squareWidth * PIXELS_OFFSET)
        pixels.push(line)
    }

    return getAverageColor(pixels)
}

function getAverageColor(data: Uint8ClampedArray[]) {
    // https://stackoverflow.com/questions/44556692/javascript-get-average-color-from-a-certain-area-of-an-image
    let r = 0;
    let g = 0;
    let b = 0;
    let a = 0;

    for (let i = 0; i < data.length; i++) {
        const [R, G, B, A] = data[i];
        if (A == 0) {
            // Work around for transparent blocks, gotta refactor
            r += 255 * 255;
            g += 255 * 255;
            b += 255 * 255;
            a += A;
        } else {
            r += R;
            g += G;
            b += B;
            a += A;
        }
    }

    const pixelsPerChannel = data.length;

    r = (r / pixelsPerChannel) | 0;
    g = (g / pixelsPerChannel) | 0;
    b = (b / pixelsPerChannel) | 0;

    return [r, g, b];
}

export function findClosestColor(color: number[]) {
    let closestDelta = Number.POSITIVE_INFINITY;
    let closestDeltaColorIndex = 0;
    const blocksColorEntries = Object.entries(blocksColor);

    for (let i = 0; i < blocksColorEntries.length; i++) {
        const colorDelta = findColorDelta(color, blocksColorEntries[i][1]);
        if (colorDelta < closestDelta) {
            closestDelta = colorDelta;
            closestDeltaColorIndex = i;
        }
    }

    return blocksColorEntries[closestDeltaColorIndex][0];
}

function findColorDelta([r1, g1, b1]: number[], lab: number[]) {
    return deltaE(rgb2lab([r1, g1, b1]), lab);
}
