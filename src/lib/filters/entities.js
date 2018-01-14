// @flow
import { CharacterMetadata, ContentState, ContentBlock } from "draft-js"
import type { DraftBlockType } from "draft-js/lib/DraftBlockType.js.flow"

import { ATOMIC, UNSTYLED, IMAGE } from "../constants"

/**
 * Resets atomic blocks to unstyled based on which entity types are enabled,
 * and also normalises block text to a single "space" character.
 */
export const filterAtomicBlocks = (
  whitelist: Array<Object>,
  content: ContentState,
) => {
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
    blocks = blocks.merge(normalisedBlocks)
  }

  const resetBlocks = blocks
    .filter((block) => block.getType() === ATOMIC)
    .filter((block) => {
      const entityKey = block.getEntityAt(0)
      let shouldReset = false

      if (entityKey) {
        const type = content.getEntity(entityKey).getType()

        shouldReset = !whitelist.some((t) => t.type === type)
      }

      return shouldReset
    })
    .map((block) => block.set("type", UNSTYLED))

  if (resetBlocks.size !== 0) {
    blocks = blocks.merge(resetBlocks)
  }

  return content.merge({
    blockMap: blockMap.merge(blocks),
  })
}

/**
 * Filters entity ranges (where entities are applied on text) based on the result of
 * the callback function. Returning true keeps the entity range, false removes it.
 * Draft.js automatically removes entities if they are not applied on any text.
 */
export const filterEntityRanges = (
  filterFn: (
    content: ContentState,
    entityKey: string,
    block: ContentBlock,
  ) => boolean,
  content: ContentState,
) => {
  const blockMap = content.getBlockMap()

  /**
   * Removes entities from the character list if the entity isn't enabled.
   * Also removes image entities placed outside of atomic blocks, which can happen
   * on paste.
   * A better approach would probably be to split the block where the image is and
   * create an atomic block there, but that's another story. This is what Draft.js
   * does when the copy-paste is all within one editor.
   */
  const blocks = blockMap.map((block) => {
    let altered = false

    const chars = block.getCharacterList().map((char) => {
      const entityKey = char.getEntity()

      if (entityKey) {
        const shouldRemove = !filterFn(content, entityKey, block)

        if (shouldRemove) {
          altered = true
          return CharacterMetadata.applyEntity(char, null)
        }
      }

      return char
    })

    return altered ? block.set("characterList", chars) : block
  })

  return content.merge({
    blockMap: blockMap.merge(blocks),
  })
}

/**
 * Keeps all entity types (images, links, documents, embeds) that are enabled.
 */
export const shouldKeepEntityType = (
  whitelist: Array<Object>,
  type: string,
) => {
  return whitelist.some((e) => e.type === type)
}

/**
 * Removes invalid images – they should only be in atomic blocks.
 * This only removes the image entity, not the camera emoji (📷) that Draft.js inserts.
 * If we want to remove this in the future, consider that:
 * - It needs to be removed in the block text, where it's 2 chars / 1 code point.
 * - The corresponding CharacterMetadata needs to be removed too, and it's 2 instances
 */
export const shouldRemoveImageEntity = (
  entityType: string,
  blockType: DraftBlockType,
) => {
  return entityType === IMAGE && blockType !== ATOMIC
}

/**
 * Filters entities based on the data they contain.
 */
export const shouldKeepEntityByAttribute = (
  entityTypes: Array<Object>,
  entityType: string,
  data: Object,
) => {
  const config = entityTypes.find((t) => t.type === entityType)
  const whitelist = config ? config.whitelist : null

  // If no whitelist is defined, the filter keeps the entity.
  if (!whitelist) {
    return true
  }

  const isValid = Object.keys(whitelist).every((attr) => {
    const regex = new RegExp(whitelist[attr])
    return regex.test(data[attr])
  })

  return isValid
}

/**
 * Filters data on an entity to only retain what is whitelisted.
 */
export const filterEntityData = (
  entityTypes: Array<Object>,
  content: ContentState,
) => {
  let newContent = content
  const entities = {}

  newContent.getBlockMap().forEach((block) => {
    block.findEntityRanges((char) => {
      const entityKey = char.getEntity()
      if (entityKey) {
        const entity = newContent.getEntity(entityKey)
        entities[entityKey] = entity
      }
    })
  })

  Object.keys(entities).forEach((key) => {
    const entity = entities[key]
    const data = entity.getData()
    const config = entityTypes.find((t) => t.type === entity.getType())
    const whitelist = config ? config.attributes : null

    // If no whitelist is defined, keep all of the data.
    if (!whitelist) {
      return data
    }

    const newData = whitelist.reduce((attrs, attr) => {
      // We do not want to include undefined values if there is no data.
      if (data.hasOwnProperty(attr)) {
        attrs[attr] = data[attr]
      }

      return attrs
    }, {})

    newContent = newContent.replaceEntityData(key, newData)
  })

  return newContent
}
