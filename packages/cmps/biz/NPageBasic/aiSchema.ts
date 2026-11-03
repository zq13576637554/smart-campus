/**
 * @file 查询栏 → 智能查询 schema
 * @desc 从 useSimpleBars 生成的 bars 里推导出「智能查询」可识别的字段，
 *       纯函数便于单测；字典选项由调用方注入，避免依赖 store。
 */

export interface AiSchemaItem {
	key: string;
	label: string;
	kind: "text" | "select" | "enum" | "date";
	options: { label: string; value: any }[];
}

const DATE_TYPES = ["daterange", "datetimerange", "date", "month"];

/**
 * @param items 查询栏条目（useSimpleBars 的 items）
 * @param dictOptions 字典取项函数，入参为字典类型
 */
export function buildAiSchema(items: any[] = [], dictOptions: (type: string) => { label: string; value: any }[] = () => []): AiSchemaItem[] {
	return (items || [])
		.map((it: any) => {
			const cfg = it?.props || {};
			let kind: AiSchemaItem["kind"] = "text";
			let options: { label: string; value: any }[] = [];

			if (it?.type === "enumSelect") {
				kind = "enum";
				options = (dictOptions(cfg.type || cfg.dictType || "") || []).map(d => ({ label: d.label, value: d.value }));
			} else if (Array.isArray(cfg.options) && cfg.options.length) {
				kind = "select";
				options = cfg.options.map((o: any) => ({ label: o.label, value: o.value }));
			} else if (DATE_TYPES.includes(cfg.type)) {
				kind = "date";
			}

			return { key: it?.key, label: it?.label || "", kind, options };
		})
		.filter(s => s.key);
}

/** 从 bars（扁平数组或 [{items}]）中取出条目数组 */
export function normalizeBarItems(bars: any[] = []): any[] {
	const list = bars || [];
	if (list.length && list[0]?.items) return list[0].items;
	return list;
}
