import { ref } from "vue";
import { useDictStore } from "lmStore/modules/dict";
import type { DictItem, DictMap } from "lmStore/modules/dict";

/**
 * 字典 hook
 * @desc 用法：const { dictOptions, dictLabel, dictType } = useDict()
 */
export function useDict() {
	const store = useDictStore();

	const dictOptions = (type: string): DictItem[] => store.getDict(type);
	const dictLabel = (type: string, value: any): string => store.getDictLabel(type, value);
	const dictType = (type: string, value: any): string => store.getDictType(type, value);

	/** 枚举 -> el-select options */
	const toOptions = (type: string) => store.getDict(type).map(d => ({ label: d.label, value: d.value }));

	/**
	 * 初始化字典
	 * @param opt.api 远端字典接口
	 * @param opt.localDict 本地兜底字典
	 */
	const initDict = async (opt: { api?: () => Promise<DictMap>; localDict?: DictMap; timeout?: number; force?: boolean }) => {
		const { api, localDict = {}, timeout = 3600, force = false } = opt;
		if (!force && store.updateTime && !store.isExpired()) return store.dicts;

		let remote: DictMap = {};
		if (api) {
			try {
				remote = (await api()) as DictMap;
			} catch (e) {
				console.warn("[dict] 远端字典加载失败，使用本地字典", e);
			}
		}
		store.initDict({ ...localDict, ...remote }, timeout);
		return store.dicts;
	};

	return { dictStore: store, dictOptions, dictLabel, dictType, toOptions, initDict };
}

export default useDict;
