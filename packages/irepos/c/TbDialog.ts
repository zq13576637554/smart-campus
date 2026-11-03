import { h } from "vue";
import { TBDEFAULT } from "lmLibs/schema";

/**
 * 弹窗表格列
 * @desc 单元格点击后由页面监听 tbDialog 事件，弹出明细表格
 * @example { col: "选课数量|courseNum|tbDialog", setComProps: { text: "查看明细" } }
 */
export default function tbDialog(config: Record<string, any> = {}) {
	const defaultItem: Record<string, any> = {
		align: "left",
		headerAlign: "left",
		minWidth: 120,
		tdFn(_h: any, ctx: any) {
			const { data, col, emit } = ctx;
			const { row } = data;
			const raw = row?.[col.prop];
			const text = col.setComProps?.text || (raw === undefined || raw === null ? TBDEFAULT : String(raw));
			return h(
				"a",
				{
					class: "ir-link",
					onClick: () => emit?.("tbDialog", { row, prop: col.prop })
				},
				text
			);
		}
	};
	return { ...defaultItem, ...config };
}
