/**
 * Backward compatibility layer — redirects to new items/ module
 * @deprecated Use lib/albion/items/index instead
 */

export * from "./items/index";
export type { AlbionItem as AlbionItemDef } from "./items/index";
export { getItemById as getItemDefById } from "./items/index";
