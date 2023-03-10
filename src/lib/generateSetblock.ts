import textureToId from "$lib/data/textureNameToId.json"

export enum AlongAxis {
	AlongX,
	AlongZ,
}

export interface Facing {
	Front: string;
	Back: string;
	Side1: string;
	Side2: string;
}

export enum frontFacingEast {
	Front = "east",
	Back = "west",
	Side1 = "south",
	Side2 = "north",
}

export enum frontFacingWest {
	Front = "west",
	Back = "east",
	Side1 = "south",
	Side2 = "north"
}

export enum frontFacingSouth {
	Front = "south",
	Back = "north",
	Side1 = "east",
	Side2 = "west"
}

export enum frontFacingNorth {
	Front = "north",
	Back = "south",
	Side1 = "east",
	Side2 = "north"
}
export function generateSetblock(blocksMatrix: string[][], axis: AlongAxis, facing: Facing, oposingAxisOffset: number) {
	if (blocksMatrix.length < 1) return "";
	const generateCommand = getCommandGenerator(axis)
	let comamnds: string = ""

	const imageTop = blocksMatrix.length - 1
	let imageWidth = 0

	if (facing.Front == "north" || facing.Front == "east") imageWidth = blocksMatrix[0].length - 1

	for (let y = 0; y < blocksMatrix.length; y++) {
		for (let x = 0; x < blocksMatrix[y].length; x++) {
			const [blockId, ...states] = (textureToId as { [key: string]: string })[blocksMatrix[y][x]].split("~")
			let extraData = '['

			if (states.length > 0) {
				states.map((state: string) => {
					switch (state) {
						case 'front':
							extraData += `facing=${facing.Front}`
							break
						case 'back':
							extraData += `facing=${facing.Back}`
							break
						case 'side':
							extraData += `facing=${facing.Side1}`
							break
						case 'sideup':
							extraData += `facing=up`
							break
						case 'axisy':
							extraData += `axis=y`
							break
						default:
							console.log(blockId, state)
					}
				})
			}

			if (blockId.includes("trapdoor")) {
				extraData += `facing=${facing.Back},open=true`
			}

			extraData += ']'
			// We substract from the top coordinates because the image data comes from the top-left to bottom-right
			// If the direction the image need to face is north or east we need to mirror x for it to be correctly oriented, we do that by substracting the width of the image from the current x value, this way we start from the right instead of the left
			comamnds += "\n" + generateCommand(mirrorX(x, imageWidth), imageTop - y, oposingAxisOffset, blockId, extraData)
		}
	}
	return comamnds.trim()
}

function mirrorX(x: number, imageWidth: number) {
	return imageWidth > 0 ? imageWidth - x : x
}

function getCommandGenerator(axis: AlongAxis) {
	const baseCommand = "execute as @s run setblock"
	// x will either be the Z coordinate or X coordinate depending on the axis, is called x because we are producing a 2D canvas that will get generate on a 3D space
	if (axis == AlongAxis.AlongX) {
		return (x: number, y: number, opposingAxisOffset: number, blockId: string, extraData: string) => `${baseCommand} ~${x} ~${y} ~${opposingAxisOffset} minecraft:${blockId}${extraData}`
	} else {
		return (x: number, y: number, opposingAxisOffset: number, blockId: string, extraData: string) => `${baseCommand} ~${opposingAxisOffset} ~${y} ~${x} minecraft:${blockId}${extraData}`
	}
}