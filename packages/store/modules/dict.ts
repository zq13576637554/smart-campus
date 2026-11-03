import { defineStore } from "pinia";
import { STORAGE_DICT_KEY } from "lmUtils/consts";

export interface DictItem {
	label: string;
	value: string | number;
	/** 标签颜色类型：success / warning / danger / info / primary */
	type?: string;
	/** 自定义色值 */
	color?: string;
	/** 附加信息 */
	extra?: any;
}

export type DictMap = Record<string, DictItem[]>;

interface DictState {
	dicts: DictMap;
	updateTime: number;
	timeout: number;
}

const readCache = (): Partial<DictState> => {
	try {
		return JSON.parse(localStorage.getItem(STORAGE_DICT_KEY) || "{}");
	} catch {
		return {};
	}
};

const cache = readCache();

export const useDictStore = defineStore({
	id: "dict",
	state: (): DictState => ({
		dicts: cache.dicts || {},
		updateTime: cache.updateTime || 0,
		timeout: cache.timeout || 3600
	}),
	getters: {
		/** 取字典列表：dictStore.getDict("STUDENT_STATUS") */
		getDict:
			state =>
			(type: string): DictItem[] =>
				state.dicts[type] || [],
		/** 取字典项文本 */
		getDictLabel:
			state =>
			(type: string, value: any): string => {
				const hit = (state.dicts[type] || []).find(d => String(d.value) === String(value));
				return hit?.label ?? (value === undefined || value === null || value === "" ? "" : String(value));
			},
		/** 取字典项标签类型 */
		getDictType:
			state =>
			(type: string, value: any): string => {
				const hit = (state.dicts[type] || []).find(d => String(d.value) === String(value));
				return hit?.type || "info";
			}
	},
	actions: {
		setDict(type: string, list: DictItem[]) {
			this.dicts[type] = list || [];
			this.persist();
		},
		setDicts(map: DictMap) {
			this.dicts = { ...this.dicts, ...(map || {}) };
			this.persist();
		},
		/** 合并远端 + 本地字典，并写入缓存 */
		initDict(map: DictMap, timeout = 3600) {
			this.dicts = { ...this.dicts, ...(map || {}) };
			this.timeout = timeout;
			this.updateTime = Date.now();
			this.persist();
		},
		isExpired() {
			if (!this.updateTime) return true;
			return Date.now() - this.updateTime > this.timeout * 1000;
		},
		persist() {
			localStorage.setItem(
				STORAGE_DICT_KEY,
				JSON.stringify({ dicts: this.dicts, updateTime: this.updateTime, timeout: this.timeout })
			);
		},
		reset() {
			this.dicts = {};
			this.updateTime = 0;
			localStorage.removeItem(STORAGE_DICT_KEY);
		}
	}
});
