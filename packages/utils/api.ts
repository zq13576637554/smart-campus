import axios, { AxiosInstance, InternalAxiosRequestConfig } from "axios";
import QS from "qs";

import { REQUEST_TIMEOUT, STORAGE_TOKEN_KEY, STORAGE_MENU_LIST } from "./consts";

/** 统一响应结构（后端约定） */
export interface Base<T = any> {
	status: boolean | number;
	result: T;
	msg: string;
	info?: string;
	code?: number;
	[k: string]: any;
}

/** 自定义配置项扩展 */
export interface RequestOptions {
	/** 是否携带当前菜单 id（后端做数据权限时使用） */
	withMenu?: boolean;
	/** 跳过全局错误拦截 */
	notInterceptError?: boolean;
}

declare module "axios" {
	export interface AxiosRequestConfig extends RequestOptions {}
}

const LOGIN_REQ_URL = "/auth/login";

/** axios 实例：开发环境经 vite 代理到 /api，生产环境同源 */
export const service: AxiosInstance = axios.create({
	baseURL: import.meta.env.DEV ? "/api/" : "/api/",
	timeout: REQUEST_TIMEOUT,
	withCredentials: true
});

service.interceptors.request.use((config: InternalAxiosRequestConfig) => {
	if (config.headers?.["Content-Type"]?.toString().includes("application/x-www-form-urlencoded") && config.data) {
		config.data = QS.stringify(config.data);
	}

	if (config.url?.includes(LOGIN_REQ_URL)) return config;

	const raw = window.localStorage.getItem(STORAGE_TOKEN_KEY);
	if (!raw) return config;

	let value: any = null;
	try {
		value = JSON.parse(raw);
	} catch {
		return config;
	}
	if (!value?.token) return config;

	if (!config.headers.Authorization) {
		config.headers.Authorization = `${value.tokenHead || "Bearer "}${value.token}`;
	}

	if (config.withMenu) {
		const menuList = JSON.parse(localStorage.getItem(STORAGE_MENU_LIST) || "[]");
		const seg = location.pathname.split("/").filter(Boolean)[0] || "";
		const flat = flatMenus(menuList);
		const menuId = flat.find(x => x.path === `/${seg}/` || x.path === `/${seg}`)?.id;
		if (menuId) {
			const target: any = config.method === "get" ? config.params || (config.params = {}) : config.data || (config.data = {});
			if (target && typeof target === "object" && !(target instanceof FormData)) target.menuId = menuId;
		}
	}

	return config;
});

const flatMenus = (list: any[]): any[] =>
	(list || []).reduce((all: any[], cur: any) => [...all, cur, ...(cur?.childList ? flatMenus(cur.childList) : [])], []);

export const request = service;
export const downloadTimeout = 120000;

/** 读取响应头（兼容 AxiosHeaders 实例与普通对象） */
export function getResponseHeader(headers: Record<string, any> | undefined, key: string) {
	if (!headers) return undefined;
	const lowerKey = key.toLowerCase();
	if (typeof headers.get === "function") return headers.get(key) ?? headers.get(lowerKey) ?? undefined;
	const hit = Object.keys(headers).find(headerKey => headerKey.toLowerCase() === lowerKey);
	return hit ? headers[hit] : undefined;
}
