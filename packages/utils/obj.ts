/** 深拷贝（保持简单类型与数组/对象/Date） */
export function copy<T>(target: any, ...sources: any[]): T {
	const out = target ?? {};
	sources.forEach(src => {
		if (!src) return;
		Object.keys(src).forEach(k => {
			const v = src[k];
			if (v === undefined) return;
			if (Array.isArray(v)) {
				out[k] = v.map((i: any) => (i && typeof i === "object" ? copy({}, i) : i));
			} else if (v instanceof Date) {
				out[k] = new Date(v.getTime());
			} else if (v && typeof v === "object") {
				out[k] = copy({}, out[k], v);
			} else {
				out[k] = v;
			}
		});
	});
	return out as T;
}

/** 深合并 */
export function deepMerge<T extends Record<string, any>>(target: T, ...sources: Partial<T>[]): T {
	return copy({}, target, ...sources) as T;
}

/** 判断函数 */
export const isFunction = (v: unknown): v is (...args: any[]) => any => typeof v === "function";

/** 空值判断 */
export const isEmpty = (v: unknown): boolean => {
	if (v === null || v === undefined || v === "") return true;
	if (Array.isArray(v)) return v.length === 0;
	if (typeof v === "object") return Object.keys(v as object).length === 0;
	return false;
};

/**
 * 渲染器通用属性解析
 * @desc 支持 setComProps 为对象或 (row) => 对象
 */
export const getComProps = (setComProps: any, row: Record<string, any> = {}) => {
	if (!setComProps) return {};
	return isFunction(setComProps) ? setComProps(row) || {} : setComProps;
};

/** 只取对象指定字段 */
export const pick = <T extends Record<string, any>>(obj: T, keys: string[]): Partial<T> =>
	keys.reduce((acc: any, k) => (k in obj ? ((acc[k] = obj[k]), acc) : acc), {});

/** 排除对象指定字段 */
export const omit = <T extends Record<string, any>>(obj: T, keys: string[]): Partial<T> =>
	Object.keys(obj).reduce((acc: any, k) => (keys.includes(k) ? acc : ((acc[k] = obj[k]), acc)), {});

/** 移除空值字段（接口参数常用） */
export function cleanEmpty<T extends Record<string, any>>(obj: T): T {
	const out: any = {};
	Object.keys(obj || {}).forEach(k => {
		const v = (obj as any)[k];
		if (v === undefined || v === null || v === "") return;
		if (Array.isArray(v) && v.length === 0) return;
		out[k] = v;
	});
	return out;
}

/** 对象转 options */
export const objToOptions = (data: Record<string, string> = {}) =>
	Object.keys(data).map(k => ({ label: data[k], value: k }));
