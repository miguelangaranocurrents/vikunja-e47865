import type {Node as ProseMirrorNode, Slice} from '@tiptap/pm/model'

/**
 * Plain text for the `text/plain` clipboard flavor. ProseMirror's default flattens list
 * items into bare lines, so a copied bullet list loses its markers. Lists are written
 * with `-` / `1.` markers, nested lists are indented, and top-level blocks are separated
 * by a blank line.
 */
export function sliceToPlainText(slice: Slice): string {
	const blocks: string[] = []
	slice.content.forEach(node => {
		blocks.push(blockToLines(node).join('\n'))
	})
	return blocks.join('\n\n')
}

function blockToLines(node: ProseMirrorNode, indent = ''): string[] {
	if (node.type.name === 'bulletList') {
		return listToLines(node, () => '- ', indent)
	}

	if (node.type.name === 'orderedList') {
		const start = Number(node.attrs.start ?? 1)
		return listToLines(node, index => `${start + index}. `, indent)
	}

	if (node.isTextblock) {
		return [indent + node.textContent]
	}

	if (node.isLeaf) {
		return []
	}

	const lines: string[] = []
	node.forEach(child => {
		lines.push(...blockToLines(child, indent))
	})
	return lines
}

function listToLines(
	list: ProseMirrorNode,
	marker: (index: number) => string,
	indent: string,
): string[] {
	const lines: string[] = []
	list.forEach((item, _offset, index) => {
		const itemMarker = marker(index)
		const continuation = indent + ' '.repeat(itemMarker.length)
		item.forEach((child, _childOffset, childIndex) => {
			if (childIndex === 0 && child.isTextblock) {
				lines.push(indent + itemMarker + child.textContent)
				return
			}
			lines.push(...blockToLines(child, continuation))
		})
	})
	return lines
}
