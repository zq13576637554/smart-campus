import { expect, test, type Page } from "@playwright/test";

/**
 * 智慧校园 E2E 主链路
 * @desc 覆盖：登录鉴权、核心模块可访问、审批闭环、导入校验、主题与校区切换
 */

const login = async (page: Page) => {
	await page.goto("/login/");
	await page.fill('input[placeholder="请输入账号"]', "admin");
	await page.fill('input[placeholder="请输入密码"]', "123456");
	await page.click('button:has-text("登 录")');
	await page.waitForURL("**/home/**", { timeout: 20_000 });
	await page.waitForTimeout(1200);
};

test.describe("智慧校园主链路", () => {
	test("未登录访问受保护页面会跳转登录页", async ({ page }) => {
		await page.goto("/xsgl/");
		await expect(page).toHaveURL(/\/login\//);
		await expect(page.locator(".login-page__card")).toBeVisible();
	});

	test("登录后进入首页并加载驾驶舱数据", async ({ page }) => {
		await login(page);
		await expect(page.locator(".home-page__banner")).toContainText("系统管理员");
		await expect(page.locator(".n-summary-card__item")).toHaveCount(6);
		await expect(page.locator(".biz-menu")).toBeVisible();
	});

	test("核心模块可访问且列表有数据", async ({ page }) => {
		await login(page);

		const modules: [string, string][] = [
			["/xsgl/", "学生档案"],
			["/jsgl/", "教职工管理"],
			["/kqgl/", "考勤明细"],
			["/cjgl/", "成绩明细"],
			["/ssgl/", "宿舍房间"],
			["/ykt/", "交易流水"],
			["/qjgl/", "请假申请"],
			["/ssbx/", "报修工单"],
			["/jfzx/", "缴费账单"],
			["/bbzx/", "学生花名册"]
		];

		for (const [path, title] of modules) {
			await page.goto(path);
			await page.waitForTimeout(1000);
			await expect(page.locator(".n-tb__title, .report-page__title").first()).toContainText(title);
			// 普通列表用 el-table，报表中心的大结果集走虚拟滚动
			const rowCount = await page.locator(".el-table__row, .n-virtual-list__row").count();
			expect(rowCount, `${path} 应该有数据`).toBeGreaterThan(0);
		}
	});

	test("请假审批闭环：发起申请 → 审批通过", async ({ page }) => {
		await login(page);
		await page.goto("/qjgl/");
		await page.waitForTimeout(1000);

		// 1. 发起一条新申请（日期取默认值，只填必填项）
		await page.click('button:has-text("发起请假")');
		const applyDialog = page.locator(".el-dialog", { hasText: "发起请假申请" });
		await expect(applyDialog).toBeVisible();
		await applyDialog.locator('input[placeholder="请输入学生姓名"]').fill("E2E测试生");
		await applyDialog.locator("textarea").fill("E2E 自动化测试请假事由");
		await applyDialog.locator(".el-dialog__footer button:has-text('确定')").click();
		await expect(applyDialog).toBeHidden();
		await page.waitForTimeout(1200);

		// 2. 新申请出现在列表首行且为待审批
		const firstRow = page.locator(".el-table__row").first();
		await expect(firstRow).toContainText("E2E测试生");
		await expect(firstRow).toContainText("待审批");

		// 3. 审批通过（严格限定到审批弹窗，避免命中残留弹窗）
		await firstRow.locator(".action-group button:has-text('审批')").click();
		const approveDialog = page.locator(".el-dialog", { hasText: "审批请假申请" });
		await expect(approveDialog).toBeVisible();
		await approveDialog.locator(".el-dialog__footer button:has-text('确定')").click();
		await expect(approveDialog).toBeHidden();
		await page.waitForTimeout(1400);

		await expect(page.locator(".el-table__row").first()).toContainText("已通过");
	});

	test("批量导入：CSV 解析并只导入有效行", async ({ page }) => {
		await login(page);
		await page.goto("/xsgl/import/");
		await page.waitForTimeout(800);

		const csv = [
			"姓名,学号,性别,班级,手机号,宿舍,床位",
			"E2E同学,202699888,男,高一(1)班,13800009999,A 栋101,1号床",
			"错误同学,202400001,女,高一(2)班,123,,"
		].join("\n");

		await page.setInputFiles('input[type="file"]', {
			name: "e2e-import.csv",
			mimeType: "text/csv",
			buffer: Buffer.from(csv, "utf-8")
		});

		await page.waitForTimeout(900);
		await expect(page.locator(".import-page__summary")).toContainText("校验失败");
		await expect(page.locator(".import-page__errors").first()).toContainText("手机号格式不正确");

		await page.click('button:has-text("导入有效数据")');
		await page.waitForTimeout(1000);
		await expect(page.locator(".import-page__result-title")).toContainText("成功 1 条");
	});

	test("全部 37 条路由可访问，且无控制台错误", async ({ page }) => {
		// CI runner 比本机慢，这条用例要遍历全部路由，放宽超时
		test.setTimeout(180_000);

		const errors: string[] = [];
		page.on("pageerror", e => errors.push(`pageerror: ${e.message}`));
		page.on("console", m => {
			const text = m.text();
			if (m.type() === "error") errors.push(`console: ${text.slice(0, 160)}`);
			if (m.type() === "warning" && /Failed to resolve component|Failed to mount/.test(text)) {
				errors.push(`component: ${text.slice(0, 160)}`);
			}
		});

		await login(page);

		const PAGES = [
			"/home/", "/dbzx/", "/xsgl/", "/jsgl/", "/bjgl/", "/kcgl/", "/kcb/", "/kqgl/", "/cjgl/",
			"/ksgl/", "/xkzx/", "/ssgl/", "/ykt/", "/mjgl/", "/tzgg/", "/qjgl/", "/ssbx/",
			"/fkyy/", "/jfzx/", "/xfyj/", "/tsjy/", "/xcgl/", "/nhjc/", "/zhsz/", "/ai/",
			"/daping/", "/bbzx/", "/xtgl/", "/cdgl/", "/zdgl/", "/msg/", "/rzgl/", "/zctz/",
			"/dzzx/", "/dzzx/import/", "/grzx/", "/parent/"
		];

		const blank: string[] = [];
		for (const path of PAGES) {
			await page.goto(path);
			await page.waitForTimeout(550);
			const length = (await page.locator("body").innerText()).trim().length;
			if (length < 20) blank.push(path);
		}

		expect(blank, "以下路由渲染为空").toEqual([]);
		expect(errors, "控制台不应有错误").toEqual([]);
	});

	test("AI：Copilot 工具路由与报表解读", async ({ page }) => {
		await login(page);

		await page.goto("/ai/");
		await page.waitForTimeout(900);
		await page.locator("textarea").fill("本周考勤怎么样");
		await page.locator("textarea").press("Enter");
		await page.waitForTimeout(1600);

		await expect(page.locator(".ai-page__tool").last()).toContainText("queryAttendance");
		await expect(page.locator(".ai-page__card").first()).toBeVisible();
		await expect(page.locator(".ai-page__metric").first()).toBeVisible();

		await page.goto("/bbzx/");
		await page.waitForTimeout(1600);
		await page.click('button:has-text("AI 解读")');
		await expect(page.locator(".report-insight__summary")).toBeVisible();
		await expect(page.locator(".report-insight__suggestions li").first()).toBeVisible();
	});

	test("暗色模式与校区切换生效", async ({ page }) => {
		await login(page);

		await page.locator(".tool-header__action").first().click();
		await page.waitForTimeout(700);
		expect(await page.evaluate(() => document.documentElement.classList.contains("dark"))).toBeTruthy();

		await page.locator(".tool-header__action").first().click();
		await page.waitForTimeout(500);
		expect(await page.evaluate(() => document.documentElement.classList.contains("dark"))).toBeFalsy();

		await page.locator(".tool-header__campus").click();
		await page.locator(".el-dropdown-menu__item:has-text('东湖校区')").click();
		await page.waitForTimeout(1500);
		await expect(page.locator(".tool-header__campus")).toContainText("东湖校区");
		await expect(page.locator(".n-summary-card__item").first()).toContainText("160");
	});
});
