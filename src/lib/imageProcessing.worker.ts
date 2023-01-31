import { imageToBlocks } from "./imageProcessing";

interface MessageData {
    imageData: ImageData;
    averagingSquareWidth: number;
    averagingSquareHeight: number;
}

onmessage = ({ data }) => {
    const { imageData, averagingSquareWidth, averagingSquareHeight } = data as MessageData;
    postMessage(imageToBlocks(imageData, averagingSquareWidth, averagingSquareHeight));
};

export { };
