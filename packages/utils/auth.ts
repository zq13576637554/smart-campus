import { STORAGE_AUTH_KEY, STORAGE_TOKEN_KEY, STORAGE_USER_KEY, STORAGE_MENU_LIST } from "./consts";

let cache: Set<string> | null = null;

/** 设置当前登录人的按钮权限码 */
export function setAuthCodes(codes: string[]) {
	cache = new Set(codes || []);
	localStorage.setItem(STORAGE_AUTH_KEY, JSON.stringify(codes || []));
}

/** 读取权限码 */
export function getAuthCodes(): string[] {
	if (cache) return Array.from(cache);
	try {
		const list = JSON.parse(localStorage.getItem(STORAGE_AUTH_KEY) || "[]");
		cache = new Set(list);
		return list;
	} catch {
		cache = new Set();
		return [];
	}
}

/** 是否超级管理员（拥有全部权限） */
export function isSuperAdmin(): boolean {
	try {
		const user = JSON.parse(localStorage.getItem(STORAGE_USER_KEY) || "null");
		return !!user?.superAdmin || (user?.roles || []).includes("SUPER_ADMIN");
	} catch {
		return false;
	}
}

/** 按钮级权限判断：v-auth:code */
export function hasAuth(code?: string | string[]): boolean {
	if (!code) return true;
	if (isSuperAdmin()) return true;
	const codes = getAuthCodes();
	const list = Array.isArray(code) ? code : [code];
	return list.some(c => codes.includes(c) || codes.includes("*"));
}

/** 是否已登录 */
export function isLogin(): boolean {
	try {
		const token = JSON.parse(localStorage.getItem(STORAGE_TOKEN_KEY) || "null");
		return !!token?.token;
	} catch {
		return false;
	}
}

/** 清空登录态缓存 */
export function clearAuthStorage() {
	[STORAGE_TOKEN_KEY, STORAGE_USER_KEY, STORAGE_MENU_LIST, STORAGE_AUTH_KEY].forEach(k => localStorage.removeItem(k));
	cache = null;
}
