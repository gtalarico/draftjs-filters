import {
  preserveAtomicBlocks,
  resetAtomicBlocks,
  removeInvalidAtomicBlocks,
  removeInvalidDepthBlocks,
  limitBlockDepth,
  preserveBlockByText,
  filterBlockTypes,
  filterInlineStyles,
  cloneEntities,
  filterEntityRanges,
  shouldKeepEntityType,
  shouldRemoveImageEntity,
  filterEntityData,
  replaceTextBySpaces,
  applyContentWithSelection,
  filterEditorState,
} from "./index"

const pkg = require("../../package.json")

/**
 * Makes sure the API shape is validated against.
 */
describe(pkg.name, () => {
  it("preserveAtomicBlocks", () => expect(preserveAtomicBlocks).toBeDefined())
  it("resetAtomicBlocks", () => expect(resetAtomicBlocks).toBeDefined())
  it("removeInvalidAtomicBlocks", () =>
    expect(removeInvalidAtomicBlocks).toBeDefined())
  it("removeInvalidDepthBlocks", () =>
    expect(removeInvalidDepthBlocks).toBeDefined())
  it("limitBlockDepth", () => expect(limitBlockDepth).toBeDefined())
  it("preserveBlockByText", () => expect(preserveBlockByText).toBeDefined())
  it("filterBlockTypes", () => expect(filterBlockTypes).toBeDefined())
  it("filterInlineStyles", () => expect(filterInlineStyles).toBeDefined())
  it("cloneEntities", () => expect(cloneEntities).toBeDefined())
  it("filterEntityRanges", () => expect(filterEntityRanges).toBeDefined())
  it("shouldKeepEntityType", () => expect(shouldKeepEntityType).toBeDefined())
  it("shouldRemoveImageEntity", () =>
    expect(shouldRemoveImageEntity).toBeDefined())
  it("filterEntityData", () => expect(filterEntityData).toBeDefined())
  it("replaceTextBySpaces", () => expect(replaceTextBySpaces).toBeDefined())
  it("applyContentWithSelection", () =>
    expect(applyContentWithSelection).toBeDefined())
  it("filterEditorState", () => expect(filterEditorState).toBeDefined())
})
