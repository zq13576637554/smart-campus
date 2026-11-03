import { h } from "vue";
import ActionGroup from "lmCmpsBasic/ActionGroup";
import { isFunction } from "lmUtils/obj";

export interface CmdItem {
	text: string;
	action: string;
	/** 权限码 */
	auth?: string;
	/** 是否显示 */
	viewFn?: (row: Record<string, any>) => boolean;
	type?: string;
	icon?: string;
	[key: string]: any;
}

/**
 * 操作列
 * @example "actions|查看:view-编辑:edit-删除:delete"
 * @example "actions|查看:view:student:view-编辑:edit:student:edit"
 */
export default function actions(config: Record<string, any> = {}) {
	const defaultItem: Record<string, any> = {
		label: "操作",
		prop: "__actions__",
		type: "actions",
		fixed: "right",
		align: "left",
		headerAlign: "left",
		minWidth: 160,
		tdFn(_h: any, ctx: any) {
			const { col, emit } = ctx;
			const { row } = ctx.data;
			let cmds: CmdItem[] = isFunction(col.cmds) ? col.cmds(row) || [] : col.cmds || [];
			cmds = cmds.filter(c => (c.viewFn ? c.viewFn(row) : true));
			if (!cmds.length) return h("span", { class: "ir-empty" }, "--");
			return h(ActionGroup, {
				cmds,
				maxBtnNum: col.maxBtnNum ?? 3,
				onClick: (cmd: CmdItem) => emit?.(cmd.action, ctx)
			});
		}
	};
	return { ...defaultItem, ...config };
}
