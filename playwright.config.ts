import { defineConfig } from "@playwright/test";

/**
 * E2E 配置
 * @desc 默认复用本机 Edge（无需下载浏览器）；设置 PW_CHANNEL="" 则使用 Playwright 自带 Chromium（CI 用）
 */
const channel = process.env.PW_CHANNEL ?? "msedge";
const useChannel = channel || undefined;

export default defineConfig({
	testDir: "./e2e",
	timeout: 60_000,
	expect: { timeout: 10_000 },
	fullyParallel: false,
	workers: 1,
	reporter: process.env.CI ? [["list"], ["html", { open: "never" }]] : [["list"]],
	use: {
		baseURL: "http://127.0.0.1:8080",
		viewport: { width: 1600, height: 950 },
		screenshot: "only-on-failure",
		trace: "off",
		...(useChannel ? { channel: useChannel } : {})
	},
	projects: [{ name: useChannel ? "edge" : "chromium" }],
	webServer: {
		command: "pnpm dev",
		url: "http://127.0.0.1:8080/login/",
		reuseExistingServer: true,
		timeout: 120_000
	}
});
