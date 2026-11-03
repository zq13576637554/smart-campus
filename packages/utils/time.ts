import dayjs from "dayjs";
import "dayjs/locale/zh-cn";
import customParseFormat from "dayjs/plugin/customParseFormat";
import duration from "dayjs/plugin/duration";
import isBetween from "dayjs/plugin/isBetween";
import relativeTime from "dayjs/plugin/relativeTime";
import weekday from "dayjs/plugin/weekday";

dayjs.extend(customParseFormat);
dayjs.extend(duration);
dayjs.extend(isBetween);
dayjs.extend(relativeTime);
dayjs.extend(weekday);
dayjs.locale("zh-cn");

export { dayjs };

/** 格式化日期 */
export const formatDate = (date?: string | number | Date, fmt = "YYYY-MM-DD HH:mm:ss") =>
	date ? dayjs(date).format(fmt) : "";

/** 仅日期 */
export const formatDay = (date?: string | number | Date) => formatDate(date, "YYYY-MM-DD");

/** 相对时间（3 分钟前） */
export const fromNow = (date?: string | number | Date) => (date ? dayjs(date).fromNow() : "");

/** 今天 00:00 */
export const todayStart = () => dayjs().startOf("day");

/** 本月区间 */
export const monthRange = () => [
	dayjs().startOf("month").format("YYYY-MM-DD"),
	dayjs().endOf("month").format("YYYY-MM-DD")
];

/** 最近 N 天 */
export function lastDays(n = 7): string[] {
	return Array.from({ length: n }, (_, i) => dayjs().subtract(n - 1 - i, "day").format("MM-DD"));
}

/** 星期中文 */
export const weekText = (d: number) => ["周一", "周二", "周三", "周四", "周五", "周六", "周日"][d] || "";

/** 当前学年（9 月切换学年） */
export function currentSchoolYear(): string {
	const now = dayjs();
	const y = now.month() + 1 >= 9 ? now.year() : now.year() - 1;
	return `${y}-${y + 1}`;
}

/** 秒 -> mm:ss */
export const secondsToClock = (sec: number) => `${String(Math.floor(sec / 60)).padStart(2, "0")}:${String(sec % 60).padStart(2, "0")}`;
