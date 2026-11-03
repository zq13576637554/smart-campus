import { h } from "vue";

/**
 * 序号列
 * @example "idx"  "idx|width:70"
 */
export default function idx(config: Record<string, any> = {}) {
	return {
		label: "#",
		prop: "__idx__",
		type: "idx",
		width: 70,
		align: "center",
		headerAlign: "center",
		...config,
		tdFn(_h: any, ctx: any) {
			const { data, tb } = ctx;
			const offset = tb?.pageNumber && tb?.pageSize ? (tb.pageNumber - 1) * tb.pageSize : 0;
			return h("span", { class: "ir-idx" }, String(offset + data.$index + 1));
		}
	};
}
