import { defineStore } from "pinia";
import {
	STORAGE_APPLICATION_LIST,
	STORAGE_CAMPUS_KEY,
	STORAGE_LOGIN_TYPE,
	STORAGE_MENU_LIST,
	STORAGE_ROLE_KEY,
	STORAGE_SYSTEM_CONFIG,
	STORAGE_TENANT_KEY,
	STORAGE_TOKEN_KEY,
	STORAGE_USER_KEY,
	type EnvType
} from "lmUtils/consts";

import { store } from "./setup";

export interface UserInfo {
	userId?: string;
	userName?: string;
	nickName?: string;
	avatar?: string;
	phone?: string;
	email?: string;
	deptName?: string;
	postName?: string;
	roles?: string[];
	authCodes?: string[];
	superAdmin?: boolean;
	[k: string]: any;
}

export interface TokenInfo {
	token: string;
	tokenHead?: string;
	expiresIn?: number;
	createTime?: number;
}

export interface MenuItem {
	id?: string;
	name: string;
	title: string;
	path: string;
	icon?: string;
	sort?: number;
	childList?: MenuItem[];
	[k: string]: any;
}

export interface AppStateProps {
	role: string;
	tokenInfo: TokenInfo | null;
	loginType: string;
	userInfo: UserInfo | null;
	menus: MenuItem[];
	env: EnvType;
	tenantData: Record<string, any>;
	applicationList: Record<string, any>;
	productName: string;
	systemConfig: Record<string, any>;
	pathToMdu: { path: string; mdu: string }[];
	/** 当前校区 */
	campus: { id: string; name: string };
}

const getItem = (key: string) => {
	const res = localStorage.getItem(key);
	if (!res) return "";
	try {
		return JSON.parse(res);
	} catch {
		return "";
	}
};

const STORAGE_APP_LIST = "APPLICATION_LIST";

export const defaultAppInfo: AppStateProps = {
	role: "",
	env: "prod",
	tokenInfo: getItem(STORAGE_TOKEN_KEY) || null,
	loginType: getItem(STORAGE_LOGIN_TYPE) || "qiye",
	menus: getItem(STORAGE_MENU_LIST) || [],
	userInfo: getItem(STORAGE_USER_KEY) || null,
	tenantData: getItem(STORAGE_TENANT_KEY) || {},
	applicationList: getItem(STORAGE_APP_LIST) || [],
	productName: "智慧校园",
	systemConfig: getItem(STORAGE_SYSTEM_CONFIG) || {},
	pathToMdu: [],
	campus: getItem(STORAGE_CAMPUS_KEY) || { id: "main", name: "主校区" }
};

export const useAppStore = defineStore({
	id: "app",
	state: (): AppStateProps => defaultAppInfo,
	getters: {
		getSystemConfig(): Record<string, any> {
			return this.systemConfig;
		},
		getPathToMdu(): { path: string; mdu: string }[] {
			return this.pathToMdu || [];
		},
		getTokenInfo(): TokenInfo | null {
			return this.tokenInfo;
		},
		getUserInfo(): UserInfo | null {
			return this.userInfo;
		},
		getLoginType(): string {
			return this.loginType;
		},
		getMenus(): MenuItem[] {
			return this.menus;
		},
		getRole(): string {
			return this.role || "";
		},
		getTenantData(): Record<string, any> {
			return this.tenantData;
		},
		getProductName(): string {
			return this.productName;
		},
		getCampus(): { id: string; name: string } {
			return this.campus || { id: "main", name: "主校区" };
		},
		getApplicationList:
			state =>
			(params: { showInTopNav?: number } = {}) => {
				let arr = state.applicationList.slice();
				if (params.showInTopNav !== undefined) arr = arr.filter((i: any) => i.showInTopNav === params.showInTopNav);
				return arr;
			}
	},
	actions: {
		setTokenInfo(tokenInfo: TokenInfo | null) {
			this.tokenInfo = tokenInfo ? { ...tokenInfo, createTime: Date.now() / 1000 } : null;
		},
		setUserInfo(userInfo: UserInfo | null) {
			this.userInfo = userInfo;
		},
		setMenus(menus: MenuItem[]) {
			this.menus = menus || [];
		},
		setRole(role: string) {
			this.role = role;
		},
		setLoginType(loginType: string) {
			this.loginType = loginType;
		},
		setTenantData(data: Record<string, any>) {
			this.tenantData = data || {};
		},
		setApplicationList(data: Record<string, any>[]) {
			this.applicationList = (data || []).slice().sort((a: any, b: any) => (a.sort || 0) - (b.sort || 0));
		},
		setSystemConfig(cfg: Record<string, any>) {
			this.systemConfig = cfg || {};
		},
		setPathToMdu(list: { path: string; mdu: string }[]) {
			this.pathToMdu = list || [];
		},
		setCampus(campus: { id: string; name: string }) {
			this.campus = campus;
			localStorage.setItem(STORAGE_CAMPUS_KEY, JSON.stringify(campus));
		},
		clear() {
			this.tokenInfo = null;
			this.userInfo = null;
			this.loginType = "";
			this.menus = [];
			this.role = "";
			this.tenantData = {};
			this.applicationList = [];
			this.systemConfig = {};
			this.pathToMdu = [];
		}
	}
});

const appStore = useAppStore(store);

const updateStorage = (key: string, path: keyof AppStateProps) => {
	const obj = appStore[path];
	return obj && !(Array.isArray(obj) && !obj.length) ? localStorage.setItem(key, JSON.stringify(obj)) : localStorage.removeItem(key);
};

appStore.$subscribe(() => {
	updateStorage(STORAGE_TOKEN_KEY, "tokenInfo");
	updateStorage(STORAGE_USER_KEY, "userInfo");
	updateStorage(STORAGE_LOGIN_TYPE, "loginType");
	updateStorage(STORAGE_MENU_LIST, "menus");
	updateStorage(STORAGE_ROLE_KEY, "role");
	updateStorage(STORAGE_TENANT_KEY, "tenantData");
	updateStorage(STORAGE_APP_LIST, "applicationList");
	updateStorage(STORAGE_SYSTEM_CONFIG, "systemConfig");
});

/** 在 setup 之外使用 store */
export const useAppStoreWithOut = () => useAppStore(store);
