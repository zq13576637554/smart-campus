import { h } from "vue";
import { ElProgress } from "lmLibs/element-plus";

/**
 * 进度条列
 * @example "完成率|rate|progress"
 */
export default function progress(config: Record<string, any> = {}) {
	const defaultItem: Record<string, any> = {
		align: "left",
		headerAlign: "left",
		minWidth: 160,
		tdFn(_h: any, ctx: any) {
			const { data, col } = ctx;
			const val = Number(data.row?.[col.prop] || 0);
			const percent = val > 0 && val <= 1 ? Math.round(val * 100) : Math.round(val);
			return h(
				"div",
				{ class: "ir-progress" },
				h(ElProgress, {
					percentage: Math.max(0, Math.min(100, percent)),
					strokeWidth: 8,
					color: percent >= 90 ? "#00B42A" : percent >= 60 ? "#165DFF" : "#FF7D00"
				})
			);
		}
	};
	return { ...defaultItem, ...config };
}
