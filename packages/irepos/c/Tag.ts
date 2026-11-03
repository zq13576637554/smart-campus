import { h } from "vue";
import NTag from "lmCmpsBasic/NTag";
import { getComProps } from "lmUtils/obj";
import { TBDEFAULT } from "lmLibs/schema";

/**
 * 标签列
 * @example "状态|status|tag|minWidth:120"
 *   字典驱动：{ col: "状态|status|tag", setComProps: { dictType: "STUDENT_STATUS" } }
 *   自定义：{ col: "状态|status|tag", setComProps: (row) => ({ type: "success", text: "在读" }) }
 */
export default function tag(config: Record<string, any> = {}) {
	const defaultItem: Record<string, any> = {
		align: "left",
		headerAlign: "left",
		minWidth: 110,
		tdFn(_h: any, ctx: any) {
			const { data, col } = ctx;
			const { row } = data;
			const comAttr = col.setComProps ? getComProps(col.setComProps, row) : {};

			// 字典优先：dictType 存在时按字典取文本与颜色
			if (comAttr.dictType && !comAttr.text) {
				const label = ctx.dictLabel?.(comAttr.dictType, row?.[col.prop]);
				const type = ctx.dictType?.(comAttr.dictType, row?.[col.prop]);
				if (label === "" || label === null || label === undefined) return h("span", { class: "ir-empty" }, TBDEFAULT);
				return h(NTag, { type: type || "info", fill: comAttr.fill ?? true, size: comAttr.size }, () => String(label));
			}

			const val = comAttr.text ?? row?.[col.prop];
			if (val === "" || val === null || val === undefined) return h("span", { class: "ir-empty" }, TBDEFAULT);
			return h(
				NTag,
				{ type: comAttr.type || "info", fill: comAttr.fill ?? true, size: comAttr.size },
				() => String(val)
			);
		}
	};
	const merged = { ...defaultItem, ...config };
	if (config.width && !config.minWidth) merged.minWidth = undefined;
	return merged;
}
