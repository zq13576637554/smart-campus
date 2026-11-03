import { ref } from "vue";

/**
 * 配置化字段（DIY）支持
 * @desc 页面配置可被用户自定义（显隐/排序）覆盖，当前实现保留扩展点
 */
export function useDiyConfig() {
	/**
	 * 格式化页面配置
	 * @param items 配置项数组（可含 null/false，用于条件渲染）
	 * @param key 配置唯一键，用于读取用户自定义
	 */
	const formatConfig = <T = any>(items: T[], key?: string): T[] => {
		const list = (items || []).filter(Boolean) as T[];
		if (!key) return list;

		let custom: any = null;
		try {
			custom = JSON.parse(localStorage.getItem("CAMPUS_DIY_CONFIG") || "null");
		} catch {
			custom = null;
		}
		const conf = custom?.[key];
		if (!conf) return list;

		const hidden: string[] = conf.hidden || [];
		const order: string[] = conf.order || [];
		let result = list.filter((item: any) => !hidden.includes(item?.prop || item?.bar || item?.label));

		if (order.length) {
			result = [...result].sort((a: any, b: any) => {
				const ai = order.indexOf(a?.prop || a?.key);
				const bi = order.indexOf(b?.prop || b?.key);
				if (ai === -1 && bi === -1) return 0;
				if (ai === -1) return 1;
				if (bi === -1) return -1;
				return ai - bi;
			});
		}
		return result;
	};

	/** 保存用户自定义配置 */
	const saveDiyConfig = (key: string, conf: { hidden?: string[]; order?: string[] }) => {
		let all: any = {};
		try {
			all = JSON.parse(localStorage.getItem("CAMPUS_DIY_CONFIG") || "{}");
		} catch {
			all = {};
		}
		all[key] = conf;
		localStorage.setItem("CAMPUS_DIY_CONFIG", JSON.stringify(all));
	};

	return { formatConfig, saveDiyConfig };
}

/** 表单 loading 包装 */
export function useFormLoading() {
	const loading = ref(false);
	const run = async <T>(fn: () => Promise<T>): Promise<T> => {
		loading.value = true;
		try {
			return await fn();
		} finally {
			loading.value = false;
		}
	};
	return { loading, run };
}

export default useDiyConfig;
