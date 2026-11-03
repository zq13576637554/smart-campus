import { ElMessage, ElMessageBox, ElNotification } from "element-plus";

export const tip = {
	success(msg: string) {
		ElMessage.success(msg);
	},
	error(msg: string) {
		ElMessage.error(msg);
	},
	warning(msg: string) {
		ElMessage.warning(msg);
	},
	info(msg: string) {
		ElMessage.info(msg);
	},
	notify(title: string, message: string, type: "success" | "warning" | "info" | "error" = "info") {
		ElNotification({ title, message, type });
	},
	/** 确认框 */
	confirm(content: string, title = "提示", okText = "确定"): Promise<boolean> {
		return ElMessageBox.confirm(content, title, {
			confirmButtonText: okText,
			cancelButtonText: "取消",
			type: "warning"
		})
			.then(() => true)
			.catch(() => false);
	}
};

export default tip;
