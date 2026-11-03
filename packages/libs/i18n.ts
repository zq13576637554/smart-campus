/**
 * @file 轻量国际化
 * @desc 覆盖外壳层文案（菜单、页签、面包屑、顶栏）与通用按钮；业务页内文案保持中文。
 *       扩展方式：在 MENU_I18N / TEXT 中补充词条即可。
 */
import { ref } from "vue";

export type Locale = "zh" | "en";

const STORAGE_KEY = "CAMPUS_LOCALE";

/** 菜单标题（按路由 path 索引） */
export const MENU_I18N: Record<string, { zh: string; en: string }> = {
	"/home/": { zh: "首页", en: "Dashboard" },
	"/xsgl/": { zh: "学生档案", en: "Students" },
	"/bjgl/": { zh: "班级管理", en: "Classes" },
	"/jsgl/": { zh: "教职工管理", en: "Staff" },
	"/kcgl/": { zh: "课程管理", en: "Courses" },
	"/kcb/": { zh: "课表管理", en: "Timetable" },
	"/cjgl/": { zh: "学业成绩", en: "Grades" },
	"/kqgl/": { zh: "智能考勤", en: "Attendance" },
	"/ksgl/": { zh: "考试管理", en: "Exams" },
	"/xkzx/": { zh: "选课中心", en: "Enrollment" },
	"/ssgl/": { zh: "智慧宿舍", en: "Dormitory" },
	"/ykt/": { zh: "校园一卡通", en: "Campus Card" },
	"/mjgl/": { zh: "门禁安防", en: "Access Control" },
	"/tzgg/": { zh: "通知公告", en: "Notices" },
	"/qjgl/": { zh: "请假审批", en: "Leave Approval" },
	"/ssbx/": { zh: "宿舍报修", en: "Repairs" },
	"/fkyy/": { zh: "访客预约", en: "Visitors" },
	"/jfzx/": { zh: "缴费中心", en: "Payments" },
	"/xfyj/": { zh: "消费预警", en: "Spend Alerts" },
	"/tsjy/": { zh: "图书馆", en: "Library" },
	"/xcgl/": { zh: "校车管理", en: "School Bus" },
	"/nhjc/": { zh: "能耗监测", en: "Energy" },
	"/zhsz/": { zh: "综合素质评价", en: "Evaluation" },
	"/ai/": { zh: "AI 校园助手", en: "AI Assistant" },
	"/daping/": { zh: "数据大屏", en: "Data Wall" },
	"/bbzx/": { zh: "报表中心", en: "Reports" },
	"/xtgl/": { zh: "系统管理", en: "System" },
	"/cdgl/": { zh: "菜单权限", en: "Menu & Auth" },
	"/zdgl/": { zh: "数据字典", en: "Dictionary" },
	"/msg/": { zh: "消息中心", en: "Messages" },
	"/rzgl/": { zh: "操作日志", en: "Audit Logs" },
	"/zctz/": { zh: "资产台账", en: "Assets" },
	"/grzx/": { zh: "个人中心", en: "Profile" },
	"/parent/": { zh: "家长端", en: "Parent" }
};

/** 菜单分组 */
export const GROUP_I18N: Record<string, { zh: string; en: string }> = {
	工作台: { zh: "工作台", en: "Workspace" },
	学籍管理: { zh: "学籍管理", en: "Student Records" },
	教学管理: { zh: "教学管理", en: "Teaching" },
	校园生活: { zh: "校园生活", en: "Campus Life" },
	智能中枢: { zh: "智能中枢", en: "Intelligence" },
	系统设置: { zh: "系统设置", en: "Settings" },
	其他: { zh: "其他", en: "Others" }
};

/** 通用文案 */
export const TEXT: Record<string, { zh: string; en: string }> = {
	首页: { zh: "首页", en: "Home" },
	登录: { zh: "登录", en: "Sign in" },
	查询: { zh: "查询", en: "Search" },
	重置: { zh: "重置", en: "Reset" },
	新增: { zh: "新增", en: "Create" },
	编辑: { zh: "编辑", en: "Edit" },
	删除: { zh: "删除", en: "Delete" },
	导出: { zh: "导出", en: "Export" },
	操作: { zh: "操作", en: "Actions" },
	全屏: { zh: "全屏", en: "Fullscreen" },
	通知: { zh: "通知", en: "Notifications" },
	个人中心: { zh: "个人中心", en: "Profile" },
	修改密码: { zh: "修改密码", en: "Change password" },
	退出登录: { zh: "退出登录", en: "Sign out" },
	切换到深色: { zh: "切换到深色", en: "Switch to dark" },
	切换到浅色: { zh: "切换到浅色", en: "Switch to light" }
};

const stored = (() => {
	try {
		const v = localStorage.getItem(STORAGE_KEY);
		return v === "en" || v === "zh" ? v : "zh";
	} catch {
		return "zh";
	}
})();

export const locale = ref<Locale>(stored);
document.documentElement.lang = locale.value === "zh" ? "zh-CN" : "en";

export function setLocale(next: Locale) {
	locale.value = next;
	localStorage.setItem(STORAGE_KEY, next);
	document.documentElement.lang = next === "zh" ? "zh-CN" : "en";
}

/** 通用文案翻译 */
export function t(key: string): string {
	return TEXT[key]?.[locale.value] ?? key;
}

/** 菜单/路由标题翻译 */
export function tm(path: string, fallback?: string): string {
	const hit = MENU_I18N[path];
	if (hit) return hit[locale.value];
	return fallback || path;
}

/** 分组名翻译 */
export function tg(group: string): string {
	return GROUP_I18N[group]?.[locale.value] ?? group;
}

export function useLocale() {
	return { locale, setLocale, t, tm, tg };
}
