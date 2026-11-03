import http from "../http";

/* ---------------- 教职工 ---------------- */
export const $teacherPagePost = (data: Record<string, any>): Promise<{ content: any[]; total: number }> =>
	http.post("/teacher/page", data);

export const $teacherSavePost = (data: Record<string, any>): Promise<boolean> => http.post("/teacher/save", data);

export const $teacherDeletePost = (data: { id: string }): Promise<boolean> => http.post("/teacher/delete", data);

export const $teacherStatisticsGet = (): Promise<any> => http.get("/teacher/statistics");

/* ---------------- 宿舍 ---------------- */
export const $dormPagePost = (data: Record<string, any>): Promise<{ content: any[]; total: number }> =>
	http.post("/dorm/page", data);

export const $dormStatisticsGet = (): Promise<any> => http.get("/dorm/statistics");

export const $dormSavePost = (data: Record<string, any>): Promise<boolean> => http.post("/dorm/save", data);

/* ---------------- 一卡通 ---------------- */
export const $cardPagePost = (data: Record<string, any>): Promise<{ content: any[]; total: number }> =>
	http.post("/card/page", data);

export const $cardTxPagePost = (data: Record<string, any>): Promise<{ content: any[]; total: number }> =>
	http.post("/card/tx/page", data);

export const $cardRechargePost = (data: { id?: string; cardNo?: string; amount: number }): Promise<any> =>
	http.post("/card/recharge", data);

export const $cardStatisticsGet = (): Promise<any> => http.get("/card/statistics");

/* ---------------- 门禁 ---------------- */
export const $accessPagePost = (data: Record<string, any>): Promise<{ content: any[]; total: number }> =>
	http.post("/access/page", data);

export const $accessStatisticsGet = (): Promise<any> => http.get("/access/statistics");

export const $accessDevicesGet = (): Promise<any[]> => http.get("/access/devices");
