import type { Router } from "vue-router";
import NProgress from "nprogress";

NProgress.configure({ showSpinner: false, minimum: 0.15, speed: 400 });

export interface EnhanceRouteOptions {
	/** 应用标题后缀 */
	appTitle?: string;
	/** 自定义路由处理器 */
	customHandle?: (to: any, from: any) => void;
}

/**
 * 路由增强
 * @desc 注入 NProgress 加载条、写入 document.title、处理 keepAlive 刷新
 */
export function enhanceRoute(router: Router, options: EnhanceRouteOptions = {}) {
	const { appTitle = "智慧校园管理系统", customHandle } = options;

	router.beforeEach((to, from) => {
		if (to.path !== from.path) NProgress.start();
		customHandle?.(to, from);
		return true;
	});

	router.afterEach(to => {
		NProgress.done();
		const { zhTitle, title } = (to.meta || {}) as any;
		const name = zhTitle || title || "";
		document.title = name ? `${name} - ${appTitle}` : appTitle;
	});

	router.onError(() => NProgress.done());

	return router;
}

/** 页面级路由元信息约定 */
export interface RouteMeta {
	/** 路由唯一标识 */
	title?: string;
	/** 菜单/页签显示的中文标题 */
	zhTitle?: string;
	/** 关闭 keep-alive 缓存 */
	closeKeepAlive?: boolean;
	/** 是否显示多页签 */
	isOpen?: boolean;
	/** 菜单图标 */
	icon?: string;
	/** 是否在菜单中隐藏 */
	hideMenu?: boolean;
	/** 按钮权限码 */
	auth?: string[];
}
