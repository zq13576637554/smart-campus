import { h } from "vue";
import { TBDEFAULT } from "lmLibs/schema";

export interface IRTextProps {
	prop?: string;
	/** 自定义值格式化 */
	formatValue?: (row: Record<string, any>) => any;
	setComProps?: (row: Record<string, any>) => any;
}

/**
 * 文本列
 * @example "姓名|name"  "金额|amount|text|minWidth:120"
 */
export default function text(config: Record<string, any> = {}) {
	const { formatValue, ...rest } = config;
	const defaultItem: Record<string, any> = {
		align: "left",
		headerAlign: "left",
		minWidth: 110,
		tdFn(_h: any, ctx: any) {
			const { data, col } = ctx;
			const { row } = data;
			const val = formatValue ? formatValue(row) : row?.[col.prop];
			const show = val === 0 ? 0 : val || TBDEFAULT;
			return h("div", { class: "ir-text" }, String(show));
		}
	};
	return { ...defaultItem, ...rest };
}
