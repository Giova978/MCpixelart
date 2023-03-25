import { imageToBlocks } from "./imageProcessing";
import blocksColor from "$lib/data/avgColorPerBlock.json"

interface MessageData {
    imageData: ImageData;
    averagingSquareWidth: number;
    averagingSquareHeight: number;
    bannedTextures: [string, number[]][];
}

onmessage = async ({ data }) => {
    const { imageData, averagingSquareWidth, averagingSquareHeight, bannedTextures } = data as MessageData;
    console.time("process")
    // Clone the blocksColor object so change are reversable
    const tmp = Object.assign({}, blocksColor)
    const result = await imageToBlocks(imageData, averagingSquareWidth, averagingSquareHeight, Object.assign(tmp, Object.fromEntries(bannedTextures)))
    console.log(bannedTextures);
    console.timeEnd("process")
    postMessage(result);
};

export { };
