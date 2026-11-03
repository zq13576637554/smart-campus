import { h } from "vue";

/**
 * 链接列
 * @example "学号|studentNo|link"  （点击 emit("link", {row, prop})）
 */
export default function link(config: Record<string, any> = {}) {
	const defaultItem: Record<string, any> = {
		align: "left",
		headerAlign: "left",
		minWidth: 120,
		tdFn(_h: any, ctx: any) {
			const { data, col, emit } = ctx;
			const val = data.row?.[col.prop];
			if (!val) return h("span", { class: "ir-empty" }, "--");
			return h(
				"a",
				{
					class: "ir-link",
					onClick: () => emit?.("link", { row: data.row, prop: col.prop })
				},
				String(val)
			);
		}
	};
	return { ...defaultItem, ...config };
}
