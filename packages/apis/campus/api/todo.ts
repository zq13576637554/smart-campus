import http from "../http";

export type TodoCategory = "leave" | "repair" | "visitor" | "bill";

/** 待办清单（可按类别筛选） */
export const $todoListPost = (data?: { category?: TodoCategory }): Promise<any> =>
	http.post("/todo/list", data || {});
