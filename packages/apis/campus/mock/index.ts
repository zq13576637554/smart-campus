import type { AxiosAdapter, AxiosResponse } from "axios";
import { mockRoutes } from "./router";

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/** 归一化 url：去掉域名、/api 前缀与查询串 */
const normalize = (url = "") =>
	url
		.split("?")[0]
		.replace(/^https?:\/\/[^/]+/, "")
		.replace(/^\/api/, "");

const parseBody = (data: any) => {
	if (!data) return {};
	if (typeof data === "string") {
		try {
			return JSON.parse(data);
		} catch {
			return {};
		}
	}
	return data;
};

/**
 * mock adapter
 * @desc 在 axios adapter 层拦截请求，因此页面、拦截器、类型都与真实后端一致
 */
export const mockAdapter: AxiosAdapter = async config => {
	await delay(120 + Math.random() * 260);

	const method = (config.method || "get").toUpperCase();
	const url = normalize(config.url);
	const params = method === "GET" ? { ...(config.params || {}) } : parseBody(config.data);

	const route = mockRoutes.find(r =>
		r.method === method && (typeof r.match === "string" ? url.startsWith(r.match) : r.match.test(url))
	);

	let body: any;
	if (route) {
		try {
			body = route.handler({ params, url, method });
		} catch (e: any) {
			body = { status: false, code: 500, msg: `mock 处理异常：${e?.message || e}`, result: null };
		}
	} else {
		body = { status: false, code: 404, msg: `接口不存在：${method} ${url}`, result: null };
		console.warn("[mock] 未匹配到接口", method, url, params);
	}

	return {
		data: body,
		status: 200,
		statusText: "OK",
		headers: {},
		config,
		request: {}
	} as AxiosResponse;
};

export default mockAdapter;
