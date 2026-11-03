import { service } from "lmUtils/api";
import { mockAdapter } from "./mock";

/**
 * 接口实例
 * @desc 演示环境默认启用本地 mock（拦截在 axios adapter 层），
 *      接入真实后端时把 VITE_USE_MOCK 设为 false 即可，业务代码零改动。
 */
export const http = service;

const useMock = import.meta.env.VITE_USE_MOCK !== "false";

if (useMock) {
	service.defaults.adapter = mockAdapter as any;
}

export default http;
