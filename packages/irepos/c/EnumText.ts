import { h } from "vue";
import { TBDEFAULT } from "lmLibs/schema";

/**
 * 字典文本列
 * @example "状态|status|enum-type:STUDENT_STATUS"
 * @desc 与 rs.ict-saas 一致：enum 列的字典类型来自渲染器参数 type
 */
export default function enumText(config: Record<string, any> = {}) {
	const dictType = config.dictType || config.type;
	const defaultItem: Record<string, any> = {
		align: "left",
		headerAlign: "left",
		minWidth: 110,
		dictType,
		tdFn(_h: any, ctx: any) {
			const { data, col } = ctx;
			const val = data.row?.[col.prop];
			const label = ctx.dictLabel?.(dictType, val);
			const type = ctx.dictType?.(dictType, val);
			return h(
				"span",
				{
					class: `ir-enum ir-enum--${type || "info"}`,
					style: {
						color: type === "success" ? "#00B42A" : type === "danger" ? "#F53F3F" : type === "warning" ? "#FF7D00" : "#1D2129"
					}
				},
				String(label || TBDEFAULT)
			);
		}
	};
	const { type, ...rest } = config;
	return { ...defaultItem, ...rest, dictType };
}
