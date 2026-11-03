import { ref } from "vue";
import type { Ref } from "vue";

export interface TbInstance {
	search: (opts?: { keepPage?: boolean; type?: "search" | "reset" | "page" }) => void;
	clearSelection: () => void;
	getSelection: () => any[];
	getTableData: () => any[];
}

/**
 * 表格实例注册与刷新入口
 * @desc NPageBasic / 页面通过 doSearch() 刷新表格，Tb 组件 emit("register") 注册自身
 */
export function useTb() {
	const tbRef = ref<TbInstance | null>(null);

	const register = (instance: TbInstance) => {
		tbRef.value = instance;
	};

	/** keepPage=true 保留当前页（编辑后刷新），false 回到第一页（新增后刷新） */
	const doSearch = (keepPage = false, type: "search" | "reset" | "page" = "search") => {
		tbRef.value?.search?.({ keepPage, type });
	};

	const getSelection = () => tbRef.value?.getSelection?.() || [];
	const getTableData = () => tbRef.value?.getTableData?.() || [];

	return { tbRef: tbRef as Ref<TbInstance | null>, register, doSearch, getSelection, getTableData };
}

export default useTb;
