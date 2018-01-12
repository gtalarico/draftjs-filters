import { EditorState, CharacterMetadata } from "draft-js"

import { ATOMIC, UNSTYLED, IMAGE } from "../constants"

/**
 * Resets atomic blocks to unstyled based on which entity types are enabled,
 * and also normalises block text to a single "space" character.
 */
export const resetAtomicBlocks = (
  editorState: EditorState,
  enabledTypes: Array<string>,
) => {
  const content = editorState.getCurrentContent()
  const blockMap = content.getBlockMap()
  let blocks = blockMap

  const normalisedBlocks = blocks
    .filter(
      (block) =>
        block.getType() === ATOMIC &&
        (block.getText() !== " " || block.getInlineStyleAt(0).size !== 0),
    )
    .map((block) => {
      // Retain only the first character, and remove all of its styles.
      const chars = block
        .getCharacterList()
        .slice(0, 1)
        .map((char) => {
          let newChar = char

          char.getStyle().forEach((type) => {
            newChar = CharacterMetadata.removeStyle(newChar, type)
          })

          return newChar
        })
      return block.merge({
        text: " ",
        characterList: chars,
      })
    })

  if (normalisedBlocks.size !== 0) {
    blocks = blockMap.merge(normalisedBlocks)
  }

  const resetBlocks = blocks
    .filter((block) => block.getType() === ATOMIC)
    .filter((block) => {
      const entityKey = block.getEntityAt(0)
      let shouldReset = false

      if (entityKey) {
        const entityType = content.getEntity(entityKey).getType()

        shouldReset = !enabledTypes.includes(entityType)
      }

      return shouldReset
    })
    .map((block) => block.set("type", UNSTYLED))

  if (resetBlocks.size !== 0) {
    blocks = blockMap.merge(resetBlocks)
  }

  return EditorState.set(editorState, {
    currentContent: content.merge({
      blockMap: blockMap.merge(blocks),
    }),
  })
}

/**
 * Reset all entity types (images, links, documents, embeds) that are unavailable.
 */
export const filterEntityType = (
  editorState: EditorState,
  enabledTypes: Array<string>,
) => {
  const content = editorState.getCurrentContent()
  const blockMap = content.getBlockMap()

  /**
   * Removes entities from the character list if the character entity isn't enabled.
   * Also removes image entities placed outside of atomic blocks, which can happen
   * on paste.
   * A better approach would probably be to split the block where the image is and
   * create an atomic block there, but that's another story. This is what Draft.js
   * does when the copy-paste is all within one editor.
   */
  const blocks = blockMap.map((block) => {
    const blockType = block.getType()
    let altered = false

    const chars = block.getCharacterList().map((char) => {
      const entityKey = char.getEntity()

      if (entityKey) {
        const entityType = content.getEntity(entityKey).getType()
        const shouldFilter = !enabledTypes.includes(entityType)
        /**
         * Special case for images. They should only be in atomic blocks.
         * This only removes the image entity, not the camera emoji (📷)
         * that Draft.js inserts.
         * If we want to remove this in the future, consider that:
         * - It needs to be removed in the block text, where it's 2 chars / 1 code point.
         * - The corresponding CharacterMetadata needs to be removed too, and it's 2 instances
         */
        const shouldFilterImage = entityType === IMAGE && blockType !== ATOMIC

        if (shouldFilter || shouldFilterImage) {
          altered = true
          return CharacterMetadata.applyEntity(char, null)
        }
      }

      return char
    })

    return altered ? block.set("characterList", chars) : block
  })

  return EditorState.set(editorState, {
    currentContent: content.merge({
      blockMap: blockMap.merge(blocks),
    }),
  })
}