import { deltaE, rgb2lab } from "./rgb2lab";
import blocksColor from "$lib/data/avgColorPerBlock.json";

// Since Uint8ClampedArray from image.data is flat we need to offset our slice by 4 to account for R G B A values
const PIXELS_OFFSET = 4;

export function imageToBlocks(image: ImageData, averagingSquareWidth: number, averagingSquareHeight: number) {
    // How many time we have move our averaging square in the x and y coordinates
    const xIterations = Math.ceil(image.width / averagingSquareWidth);
    const yIterations = Math.ceil(image.height / averagingSquareHeight);

    const avgColorsToBlockTextureCache = new Map<string, string>();

    const newImageBlockNames: string[][] = [];
    const groupedPixels = groupPixels(image, averagingSquareWidth, averagingSquareHeight);
    for (let yOffsetFactor = 0; yOffsetFactor < yIterations; yOffsetFactor++) {
        let height = image.height % averagingSquareHeight;
        height = yOffsetFactor === yIterations - 1 && height > 0 ? height : averagingSquareHeight;

        // First array representing the y lines in the image
        newImageBlockNames[yOffsetFactor] = [];

        for (let xOffsetFactor = 0; xOffsetFactor < xIterations; xOffsetFactor++) {
            let width = image.width % averagingSquareWidth;
            width = xOffsetFactor === xIterations - 1 && width > 0 ? width : averagingSquareWidth;

            const avgColor = getAverageColor2(groupedPixels[yOffsetFactor][xOffsetFactor].flat());

            let closestColoredBlock: string;
            if (avgColorsToBlockTextureCache.has(avgColor.toString())) {
                closestColoredBlock = avgColorsToBlockTextureCache.get(avgColor.toString())!;
            } else {
                closestColoredBlock = findClosestColor(avgColor);
            }

            newImageBlockNames[yOffsetFactor].push(closestColoredBlock);
        }
    }

    return newImageBlockNames;
}

export function imageToBlocks2(image: ImageData, averagingSquareWidth: number, averagingSquareHeight: number) {
    const xIterations = Math.ceil(image.width / averagingSquareWidth);
    const yIterations = Math.ceil(image.height / averagingSquareHeight);

	const squareAverageToBlockTexturesCache = new Map<string, string>()

    const leftoverHeight = image.height % averagingSquareHeight;
    const leftoverWidth = image.width % averagingSquareWidth;
    for (let yOffset = 0; yOffset < yIterations; yOffset++) {
        const squareHeight = yOffset === yIterations - 1 && leftoverHeight > 0 ? leftoverHeight : averagingSquareHeight;

        for (let xOffset = 0; xOffset < xIterations; xOffset++) {
            const squareWidth = xOffset === xIterations - 1 && leftoverWidth > 0 ? leftoverWidth : averagingSquareWidth;
            const pixelsInSquare = [];

            for (let y = yOffset * averagingSquareHeight; y < yOffset * averagingSquareHeight + squareHeight; y++) {
                const cursor = y * image.width + xOffset * averagingSquareWidth;
                const line = image.data.slice(cursor, cursor + squareWidth * PIXELS_OFFSET);
                pixelsInSquare.push(line);
            }
			
			const avgColor = getAverageColor2()
			
			if (squareAverageToBlockTexturesCache.has)

        }
    }
}

export function groupPixels(image: ImageData, averagingSquareWidth: number, averagingSquareHeight: number) {
    const data = arrayTo2D(image.data);
    const groupedPixels: Uint8ClampedArray[][][][] = [];

    const xIterations = Math.ceil(image.width / averagingSquareWidth);
    const yIterations = Math.ceil(image.height / averagingSquareHeight);

    for (let yOffset = 0; yOffset < yIterations; yOffset++) {
        groupedPixels[yOffset] = [];
        for (let xOffset = 0; xOffset < xIterations; xOffset++) {
            const pixels = [];

            for (
                let y = yOffset * averagingSquareHeight;
                y < averagingSquareHeight * yOffset + averagingSquareHeight;
                y++
            ) {
                const temp = y * image.width + xOffset * averagingSquareWidth;
                const line = data.slice(temp, temp + averagingSquareWidth);
                pixels.push(line);
            }

            groupedPixels[yOffset].push(pixels);
        }
    }

    return groupedPixels;
}

function getAverageColor2(data: Uint8ClampedArray[]) {
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

function arrayTo2D(array: Uint8ClampedArray): Array<Uint8ClampedArray> {
    const newArray: Uint8ClampedArray[] = [];
    for (let i = 0; i < array.length; i += 4) {
        newArray.push(array.slice(i, i + 4));
    }

    return newArray;
}

export function getAverageColor(data: Uint8ClampedArray) {
    // https://stackoverflow.com/questions/44556692/javascript-get-average-color-from-a-certain-area-of-an-image
    let r = 0;
    let g = 0;
    let b = 0;
    let a = 0;

    for (let i = 0; i < data.length; i += 4) {
        const [R, G, B, A] = data.slice(i, i + 4);
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

    const pixelsPerChannel = data.length / 4;

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
