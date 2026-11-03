import http from "../http";

export interface LoginParams {
	userName: string;
	password: string;
	code?: string;
}

export interface LoginResult {
	token: string;
	tokenHead: string;
	expiresIn: number;
	userInfo: Record<string, any>;
}

/** 登录 */
export const $loginPost = (data: LoginParams): Promise<LoginResult> => http.post("/auth/login", data);

/** 当前登录人信息 */
export const $userInfoGet = (): Promise<Record<string, any>> => http.get("/auth/userInfo");

/** 菜单 */
export const $menusGet = (): Promise<any[]> => http.get("/auth/menus");

/** 退出登录 */
export const $logoutPost = (): Promise<boolean> => http.post("/auth/logout");

/** 全部字典 */
export const $enumsByTypeGet = (): Promise<Record<string, any[]>> => http.get("/common/enums");
