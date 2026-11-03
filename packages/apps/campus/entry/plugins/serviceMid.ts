import type { Router } from "vue-router";
import { service } from "lmUtils/api";
import { ElMessage } from "lmLibs/element-plus";
import { clearAuthStorage } from "lmUtils/auth";

let lastTipTime = 0;

/** 401 防抖：1 秒内只提示一次 */
function handleUnauthorized(router: Router) {
	const now = Date.now();
	if (now - lastTipTime > 1000) {
		lastTipTime = now;
		ElMessage.warning("登录状态已失效，请重新登录");
	}
	clearAuthStorage();
	const current = router.currentRoute.value;
	if (current.path !== "/login/") {
		router.replace({ path: "/login/", query: { redirect: current.fullPath } });
	}
}

/**
 * 接口中间层
 * @desc 统一解包 { status, result, msg } 响应结构，并处理错误提示与登录失效
 */
export function serviceMid(router: Router) {
	service.interceptors.response.use(
		(res: any) => {
			if (res.config?.responseType === "blob" || res.config?.responseType === "arraybuffer") return res.data;

			const data = res.data;
			if (data && typeof data === "object" && "status" in data) {
				const success = data.status === true || data.status === 0 || data.status === "true";
				if (success) return data.result;

				const msg = data.msg || data.info || "请求失败";
				if (!res.config?.notInterceptError) {
					if (data.code === 401) handleUnauthorized(router);
					else ElMessage.error(msg);
				}
				return Promise.reject(new Error(msg));
			}
			return data;
		},
		error => {
			if (error.config?.notInterceptError) return Promise.reject(error);
			const status = error.response?.status;
			if (status === 401) handleUnauthorized(router);
			else ElMessage.error(error.response?.data?.msg || error.message || "网络异常，请稍后重试");
			return Promise.reject(error);
		}
	);
}
