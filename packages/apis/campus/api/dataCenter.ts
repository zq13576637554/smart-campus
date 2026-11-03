import http from "../http";

export interface DataColumn {
	label: string;
	prop: string;
	required?: boolean;
}

export interface ImportType {
	key: string;
	label: string;
	module: string;
	icon: string;
	available: boolean;
	route?: string;
	columns: DataColumn[];
	count: number;
}

export interface ExportType {
	key: string;
	label: string;
	module: string;
	icon: string;
	columns: DataColumn[];
	count: number;
}

export interface ExportLog {
	id: string;
	fileName: string;
	typeKey: string;
	typeLabel: string;
	total: number;
	operator: string;
	time: string;
	status: string;
}

/** 支持的数据类型 */
export const $dataTypesGet = (): Promise<{ imports: ImportType[]; exports: ExportType[] }> =>
	http.get("/data/types");

/** 组装导出数据 */
export const $dataExportPost = (data: { key: string }): Promise<{
	columns: DataColumn[];
	rows: Record<string, any>[];
	fileName: string;
}> => http.post("/data/export", data);

/** 导出记录 */
export const $dataExportLogsGet = (): Promise<ExportLog[]> => http.get("/data/export-logs");

/** 追加一条导出记录 */
export const $dataExportLogPost = (data: Partial<ExportLog>): Promise<ExportLog> =>
	http.post("/data/export-log", data);
