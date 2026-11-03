import { createApp } from "vue";
import "element-plus/dist/index.css";
import "element-plus/theme-chalk/dark/css-vars.css";
import "nprogress/nprogress.css";
import "./assets/styles/index.less";

import { ElLoading } from "lmLibs/element-plus";
import { createRouter, createWebHistory } from "lmLibs/vue-router";
import { setupStore } from "lmStore/modules/setup";
import { useAppStoreWithOut } from "lmStore/modules/app";
import { $enumsByTypeGet } from "lmApisCampus/api/auth";
import { LOCAL_DICTS } from "lmApisCampus/enums";
import { useDict } from "lmHooks/tools/useDict";
import { authUse } from "lmHooks/directive/auth";
import { fixBtnUse } from "lmHooks/directive/vFixBtn";
import { createSticky } from "lmHooks/directive/vTableSticky";
import { enhanceRoute } from "lmUtils/enhanceRoute";

import App from "./App.vue";
import routes, { ensureMduRoutes, pathToMdu } from "./routes";
import { serviceMid } from "./plugins/serviceMid";
import { beforeEach } from "./plugins/beforeEach";

const router = enhanceRoute(
	createRouter({
		history: createWebHistory(import.meta.env.BASE_URL),
		routes: routes as any
	})
);

/** 去掉路径末尾的 / */
const resolvePath = (path: string) => (path.endsWith("/") ? path.slice(0, -1) : path);

/**
 * 模块路由按需加载
 * @desc 访问到某个业务模块时才加载对应 mdus/xxx/routes.ts，与 rs.ict-saas 的模块联邦按需加载等价
 */
router.beforeEach(async (to, _from, next) => {
	if (to.matched.length > 0) return next();

	const targetPath = resolvePath(to.path);
	const entry = pathToMdu.find(e => {
		const mduPath = resolvePath(e.path);
		return targetPath === mduPath || targetPath.startsWith(`${mduPath}/`);
	});

	if (!entry) return next(false);

	try {
		await ensureMduRoutes(entry.mdu, router);
		return next({ path: to.path, query: to.query, hash: to.hash, replace: true });
	} catch (e) {
		console.error(`加载模块路由失败: ${entry.mdu}`, e);
		return next(false);
	}
});

// 接口回调中间层
serviceMid(router);
// 登录态中间层
beforeEach(router);

const app = createApp(App);
setupStore(app);

// 恢复用户主题偏好
try {
	const pref = JSON.parse(localStorage.getItem("CAMPUS_PREF") || "null");
	if (pref?.theme === "dark") document.documentElement.classList.add("dark");
} catch {
	/* ignore */
}

// 字典初始化（依赖 pinia，必须在 setupStore 之后；开发环境强制刷新，生产环境走缓存）
const { initDict } = useDict();
initDict({ api: $enumsByTypeGet, localDict: LOCAL_DICTS, timeout: 3600, force: import.meta.env.DEV });

// 将完整模块路径映射写入 store（供业务侧做系统内路由校验）
useAppStoreWithOut().setPathToMdu(pathToMdu);

// 全局指令
fixBtnUse(app);
authUse(app);
createSticky(app);

// 组件按需引入（页面各自 import），这里只注册全局指令与服务：
// v-loading 指令（ElLoading），以及 ElMessage / ElMessageBox / ElNotification 的服务式调用
app
	.use(ElLoading as any)
	.use(router as any)
	.mount("#app");
