import http from "../http";

/* ---------------- 通知公告 ---------------- */
export const $noticePagePost = (data: Record<string, any>): Promise<{ content: any[]; total: number }> =>
	http.post("/notice/page", data);

export const $noticeDetailGet = (params: { id: string }): Promise<any> => http.get("/notice/detail", { params });

export const $noticeSavePost = (data: Record<string, any>): Promise<boolean> => http.post("/notice/save", data);

export const $noticeDeletePost = (data: { id: string }): Promise<boolean> => http.post("/notice/delete", data);

/* ---------------- 用户 ---------------- */
export const $systemUserPagePost = (data: Record<string, any>): Promise<{ content: any[]; total: number }> =>
	http.post("/system/user/page", data);

export const $systemUserSavePost = (data: Record<string, any>): Promise<boolean> =>
	http.post("/system/user/save", data);

export const $systemUserDeletePost = (data: { id: string }): Promise<boolean> =>
	http.post("/system/user/delete", data);

/* ---------------- 角色 ---------------- */
export const $systemRolePagePost = (data: Record<string, any>): Promise<{ content: any[]; total: number }> =>
	http.post("/system/role/page", data);

export const $systemRoleSavePost = (data: Record<string, any>): Promise<boolean> =>
	http.post("/system/role/save", data);

/** 角色已授权的菜单 id */
export const $systemRoleMenusGet = (params: { id: string }): Promise<string[]> =>
	http.get("/system/role/menus", { params });

/** 保存角色授权 */
export const $systemRoleAuthPost = (data: { id: string; menuIds: string[] }): Promise<boolean> =>
	http.post("/system/role/auth", data);

/* ---------------- 数据字典 ---------------- */
export interface DictTypeItem {
	id: string;
	type: string;
	name: string;
	remark: string;
	builtin: boolean;
	items: { label: string; value: string; type?: string; sort?: number }[];
}

export const $dictTypesGet = (): Promise<DictTypeItem[]> => http.get("/system/dict/types");

export const $dictTypeSavePost = (data: Record<string, any>): Promise<boolean> =>
	http.post("/system/dict/type/save", data);

export const $dictTypeDeletePost = (data: { id: string }): Promise<boolean> =>
	http.post("/system/dict/type/delete", data);

export const $dictItemSavePost = (data: Record<string, any>): Promise<boolean> =>
	http.post("/system/dict/item/save", data);

export const $dictItemDeletePost = (data: { type: string; id: string }): Promise<boolean> =>
	http.post("/system/dict/item/delete", data);

/* ---------------- 菜单权限 ---------------- */
export interface MenuTreeNode {
	id: string;
	parentId: string | null;
	title: string;
	name: string;
	path: string;
	icon?: string;
	group?: string;
	sort?: number;
	type: "group" | "menu" | "button";
	auth?: string;
	visible: boolean;
	children?: MenuTreeNode[];
}

export const $menuTreeGet = (): Promise<MenuTreeNode[]> => http.get("/system/menu/tree");

export const $menuSavePost = (data: Record<string, any>): Promise<boolean> => http.post("/system/menu/save", data);

export const $menuDeletePost = (data: { id: string }): Promise<boolean> => http.post("/system/menu/delete", data);

/* ---------------- 消息中心 ---------------- */
export const $messagePagePost = (data: Record<string, any>): Promise<{ content: any[]; total: number }> =>
	http.post("/message/page", data);

export const $messageReadPost = (data: { id: string }): Promise<boolean> => http.post("/message/read", data);

export const $messageReadAllPost = (): Promise<boolean> => http.post("/message/readAll");

export const $messageUnreadGet = (): Promise<{ count: number; important: number }> =>
	http.get("/message/unreadCount");

/* ---------------- 个人中心 ---------------- */
export const $profileGet = (): Promise<Record<string, any>> => http.get("/user/profile");

export const $profileSavePost = (data: Record<string, any>): Promise<boolean> => http.post("/user/profile/save", data);

export const $passwordPost = (data: { oldPassword: string; newPassword: string }): Promise<boolean> =>
	http.post("/user/password", data);

/* ---------------- 请假审批 ---------------- */
export const $leavePagePost = (data: Record<string, any>): Promise<{ content: any[]; total: number }> =>
	http.post("/leave/page", data);

export const $leaveApplyPost = (data: Record<string, any>): Promise<boolean> => http.post("/leave/apply", data);

export const $leaveApprovePost = (data: Record<string, any>): Promise<boolean> => http.post("/leave/approve", data);

export const $leaveTodoCountGet = (): Promise<{ count: number }> => http.get("/leave/todoCount");

/* ---------------- 审计日志 ---------------- */
export const $systemLogPagePost = (data: Record<string, any>): Promise<{ content: any[]; total: number }> =>
	http.post("/system/log/page", data);
