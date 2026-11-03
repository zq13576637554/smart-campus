/**
 * @file 入口路由注册表（由 scripts/gen-routes.mjs 自动生成，请勿手动修改）
 * @desc 只登记「模块 -> 路由加载器」，模块 routes.ts 在首次访问时按需加载并 addRoute。
 */
import type { Router } from "vue-router";

/** 模块路由加载器（模块联邦的本地等价实现） */
export const mduRoutesLoaders: Record<string, () => Promise<any>> = {
	ai: () => import("lmAppsCampusMdusAi/routes"),
	bbzx: () => import("lmAppsCampusMdusBbzx/routes"),
	bjgl: () => import("lmAppsCampusMdusBjgl/routes"),
	cdgl: () => import("lmAppsCampusMdusCdgl/routes"),
	cjgl: () => import("lmAppsCampusMdusCjgl/routes"),
	daping: () => import("lmAppsCampusMdusDaping/routes"),
	fkyy: () => import("lmAppsCampusMdusFkyy/routes"),
	grzx: () => import("lmAppsCampusMdusGrzx/routes"),
	home: () => import("lmAppsCampusMdusHome/routes"),
	jfzx: () => import("lmAppsCampusMdusJfzx/routes"),
	jsgl: () => import("lmAppsCampusMdusJsgl/routes"),
	kcb: () => import("lmAppsCampusMdusKcb/routes"),
	kcgl: () => import("lmAppsCampusMdusKcgl/routes"),
	kqgl: () => import("lmAppsCampusMdusKqgl/routes"),
	ksgl: () => import("lmAppsCampusMdusKsgl/routes"),
	login: () => import("lmAppsCampusMdusLogin/routes"),
	mjgl: () => import("lmAppsCampusMdusMjgl/routes"),
	msg: () => import("lmAppsCampusMdusMsg/routes"),
	nhjc: () => import("lmAppsCampusMdusNhjc/routes"),
	parent: () => import("lmAppsCampusMdusParent/routes"),
	qjgl: () => import("lmAppsCampusMdusQjgl/routes"),
	rzgl: () => import("lmAppsCampusMdusRzgl/routes"),
	ssbx: () => import("lmAppsCampusMdusSsbx/routes"),
	ssgl: () => import("lmAppsCampusMdusSsgl/routes"),
	tsjy: () => import("lmAppsCampusMdusTsjy/routes"),
	tzgg: () => import("lmAppsCampusMdusTzgg/routes"),
	xcgl: () => import("lmAppsCampusMdusXcgl/routes"),
	xfyj: () => import("lmAppsCampusMdusXfyj/routes"),
	xkzx: () => import("lmAppsCampusMdusXkzx/routes"),
	xsgl: () => import("lmAppsCampusMdusXsgl/routes"),
	xtgl: () => import("lmAppsCampusMdusXtgl/routes"),
	ykt: () => import("lmAppsCampusMdusYkt/routes"),
	zctz: () => import("lmAppsCampusMdusZctz/routes"),
	zdgl: () => import("lmAppsCampusMdusZdgl/routes"),
	zhsz: () => import("lmAppsCampusMdusZhsz/routes")
};

/** 模块路径映射：用于「路径 -> 模块」匹配 */
export const pathToMdu: { path: string; mdu: string }[] = [
	{ path: "/ai/", mdu: "ai" },
	{ path: "/bbzx/", mdu: "bbzx" },
	{ path: "/bjgl/", mdu: "bjgl" },
	{ path: "/cdgl/", mdu: "cdgl" },
	{ path: "/cjgl/", mdu: "cjgl" },
	{ path: "/daping/", mdu: "daping" },
	{ path: "/fkyy/", mdu: "fkyy" },
	{ path: "/grzx/", mdu: "grzx" },
	{ path: "/home/", mdu: "home" },
	{ path: "/jfzx/", mdu: "jfzx" },
	{ path: "/jsgl/", mdu: "jsgl" },
	{ path: "/kcb/", mdu: "kcb" },
	{ path: "/kcgl/", mdu: "kcgl" },
	{ path: "/kqgl/", mdu: "kqgl" },
	{ path: "/ksgl/", mdu: "ksgl" },
	{ path: "/login/", mdu: "login" },
	{ path: "/mjgl/", mdu: "mjgl" },
	{ path: "/msg/", mdu: "msg" },
	{ path: "/nhjc/", mdu: "nhjc" },
	{ path: "/parent/", mdu: "parent" },
	{ path: "/qjgl/", mdu: "qjgl" },
	{ path: "/rzgl/", mdu: "rzgl" },
	{ path: "/ssbx/", mdu: "ssbx" },
	{ path: "/ssgl/", mdu: "ssgl" },
	{ path: "/tsjy/", mdu: "tsjy" },
	{ path: "/tzgg/", mdu: "tzgg" },
	{ path: "/xcgl/", mdu: "xcgl" },
	{ path: "/xfyj/", mdu: "xfyj" },
	{ path: "/xkzx/", mdu: "xkzx" },
	{ path: "/xsgl/", mdu: "xsgl" },
	{ path: "/xtgl/", mdu: "xtgl" },
	{ path: "/ykt/", mdu: "ykt" },
	{ path: "/zctz/", mdu: "zctz" },
	{ path: "/zdgl/", mdu: "zdgl" },
	{ path: "/zhsz/", mdu: "zhsz" }
];

const loadedMdus = new Set<string>();

/** 加载模块路由并注册到 router */
export async function ensureMduRoutes(mdu: string, router: Router): Promise<boolean> {
	if (loadedMdus.has(mdu)) return true;
	const loader = mduRoutesLoaders[mdu];
	if (!loader) return false;
	const mod = await loader();
	const list = mod?.default || [];
	(list as any[]).forEach(route => router.addRoute(route));
	loadedMdus.add(mdu);
	return true;
}

/** 静态路由：根路径重定向 */
export default [
	{
		path: "/",
		redirect: "/home/",
		meta: { isOpen: true }
	}
];
