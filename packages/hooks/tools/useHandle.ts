import { ElMessage, ElMessageBox } from "lmLibs/element-plus";
import { sync } from "lmUtils/promise";

export interface HandleOptions {
	/** 标题 */
	name?: string;
	/** 提示内容；openTip 为 false 时可不填 */
	content?: string;
	/** 是否弹出确认框，默认 true */
	openTip?: boolean;
	/** 确认类型 */
	type?: "warning" | "success" | "info" | "error";
	/** 执行的接口 */
	api: (params?: any) => Promise<any>;
	/** 成功回调 */
	callback?: (res?: any) => void;
	/** 成功提示语，传空字符串则不提示 */
	successText?: string;
	/** 失败提示语 */
	errorText?: string;
	params?: any;
}

/**
 * 通用「确认 -> 执行接口 -> 提示 -> 回调」处理器
 * @example useHandle({ name: "删除", content: "确认删除？", api: () => $delete(id), callback: () => doSearch() })
 */
export async function useHandle(options: HandleOptions) {
	const { name = "提示", content = "", openTip = true, type = "warning", api, callback, successText = "操作成功", params } = options;

	if (openTip && content) {
		const ok = await ElMessageBox.confirm(content, name, {
			confirmButtonText: "确定",
			cancelButtonText: "取消",
			type
		}).catch(() => false);
		if (!ok) return false;
	}

	const [err, res] = await sync(Promise.resolve(api(params)));
	if (err) {
		ElMessage.error(options.errorText || (err as any)?.message || "操作失败");
		return false;
	}
	if (successText) ElMessage.success(successText);
	callback?.(res);
	return true;
}

export default useHandle;
