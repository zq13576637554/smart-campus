import type { Router } from "vue-router";
import { isLogin } from "lmUtils/auth";

/** 免登录白名单 */
const WHITE_LIST = ["/login/", "/404/"];

/**
 * 路由守卫：登录态校验
 * @desc meta.isOpen 为 true 的页面不套外壳，也不需要登录
 */
export function beforeEach(router: Router) {
	router.beforeEach((to, _from, next) => {
		const meta = (to.meta || {}) as any;
		if (meta.isOpen || WHITE_LIST.includes(to.path)) return next();

		if (!isLogin()) {
			return next({ path: "/login/", query: { redirect: to.fullPath }, replace: true });
		}
		return next();
	});
}
