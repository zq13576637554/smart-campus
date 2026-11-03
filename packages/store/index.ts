export { store, setupStore } from "./modules/setup";
export { useAppStore, useAppStoreWithOut, defaultAppInfo } from "./modules/app";
export { useTagsStore } from "./modules/tags";
export { useDictStore } from "./modules/dict";
export type { AppStateProps, MenuItem, UserInfo, TokenInfo } from "./modules/app";
export type { TagView } from "./modules/tags";
export type { DictItem, DictMap } from "./modules/dict";
