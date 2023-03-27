export function clickOutside(node: HTMLElement) {
	const handleClick = (event: MouseEvent) => {
		if (!node.contains(event.target as HTMLElement | null)) {
			// @ts-expect-error
			// Needed due to a weird behavior where the second button "close" is not contained inside the modal
			if (event.target.id === "noclose") return;

			node.dispatchEvent(new CustomEvent("clickOutside"))
		}
	}

	document.addEventListener("click", handleClick)

	return {
		destroy() {
			document.removeEventListener("click", handleClick)
		}
	}
}