import http from "../http";

/* ---------------- B4 综合素质评价 ---------------- */
export const $evalPagePost = (data: Record<string, any>): Promise<{ content: any[]; total: number }> =>
	http.post("/eval/page", data);

export const $evalRecordsGet = (params: { studentNo: string }): Promise<any[]> =>
	http.get("/eval/records", { params });

export const $evalRecordAddPost = (data: Record<string, any>): Promise<boolean> =>
	http.post("/eval/record/add", data);

export const $evalStatisticsGet = (): Promise<any> => http.get("/eval/statistics");

/* ---------------- B5 宿舍报修 ---------------- */
export const $repairPagePost = (data: Record<string, any>): Promise<{ content: any[]; total: number }> =>
	http.post("/repair/page", data);

export const $repairAssignPost = (data: { id: string; handler: string }): Promise<boolean> =>
	http.post("/repair/assign", data);

/** 新建报修工单 */
export const $repairCreatePost = (data: Record<string, any>): Promise<boolean> =>
	http.post("/repair/create", data);

export const $repairFinishPost = (data: { id: string }): Promise<boolean> => http.post("/repair/finish", data);

export const $repairStatisticsGet = (): Promise<any> => http.get("/repair/statistics");

/* ---------------- B6 消费异常预警 ---------------- */
export const $alertPagePost = (data: Record<string, any>): Promise<{ content: any[]; total: number }> =>
	http.post("/alert/page", data);

export const $alertHandlePost = (data: { id: string; status?: string; remark?: string }): Promise<boolean> =>
	http.post("/alert/handle", data);

export const $alertStatisticsGet = (): Promise<any> => http.get("/alert/statistics");

/* ---------------- B7 访客预约 ---------------- */
export const $visitorPagePost = (data: Record<string, any>): Promise<{ content: any[]; total: number }> =>
	http.post("/visitor/page", data);

export const $visitorApprovePost = (data: { id: string; status?: string }): Promise<boolean> =>
	http.post("/visitor/approve", data);

/** 新增访客预约 */
export const $visitorCreatePost = (data: Record<string, any>): Promise<boolean> =>
	http.post("/visitor/create", data);

export const $visitorCheckinPost = (data: { id: string }): Promise<string> => http.post("/visitor/checkin", data);

export const $visitorStatisticsGet = (): Promise<any> => http.get("/visitor/statistics");

/* ---------------- B8 缴费中心 ---------------- */
export const $billPagePost = (data: Record<string, any>): Promise<{ content: any[]; total: number }> =>
	http.post("/bill/page", data);

export const $billPayPost = (data: { id: string; amount?: number }): Promise<boolean> => http.post("/bill/pay", data);

export const $billStatisticsGet = (): Promise<any> => http.get("/bill/statistics");

/* ---------------- B9 资产台账 ---------------- */
export const $assetPagePost = (data: Record<string, any>): Promise<{ content: any[]; total: number }> =>
	http.post("/asset/page", data);

export const $assetSavePost = (data: Record<string, any>): Promise<boolean> => http.post("/asset/save", data);

export const $assetStatisticsGet = (): Promise<any> => http.get("/asset/statistics");

/* ---------------- B10 图书馆 ---------------- */
export const $bookPagePost = (data: Record<string, any>): Promise<{ content: any[]; total: number }> =>
	http.post("/book/page", data);

export const $bookReturnPost = (data: { id: string }): Promise<boolean> => http.post("/book/return", data);

export const $bookStatisticsGet = (): Promise<any> => http.get("/book/statistics");

/* ---------------- B11 校车 ---------------- */
export const $busListGet = (): Promise<any[]> => http.get("/bus/list");

export const $busSavePost = (data: Record<string, any>): Promise<boolean> => http.post("/bus/save", data);

export const $busStatisticsGet = (): Promise<any> => http.get("/bus/statistics");

/* ---------------- B12 能耗监测 ---------------- */
export const $energyListGet = (params: Record<string, any>): Promise<any[]> => http.get("/energy/list", { params });

export const $energyStatisticsGet = (): Promise<any> => http.get("/energy/statistics");
