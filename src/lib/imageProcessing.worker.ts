import { imageToBlocks } from "./imageProcessing";

interface MessageData {
    imageData: ImageData;
    averagingSquareWidth: number;
    averagingSquareHeight: number;
}

onmessage = async ({ data }) => {
    const { imageData, averagingSquareWidth, averagingSquareHeight } = data as MessageData;
    console.time("process")
    const result = await imageToBlocks(imageData, averagingSquareWidth, averagingSquareHeight)
    console.timeEnd("process")
    postMessage(result);
};

export { };
