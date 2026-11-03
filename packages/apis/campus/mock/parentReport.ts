/**
 * @file 家长周报生成
 * @desc 基于成绩、考勤、请假、综合素质四类数据生成结构化周报。
 *       规则版实现：接入真实模型后可把 metrics/highlights 作为上下文交给模型润色。
 */
import { dayjs } from "lmUtils/time";

export interface ParentReport {
	student: { name: string; studentNo: string; className: string };
	week: string;
	range: [string, string];
	metrics: { label: string; value: string | number; unit: string; trend?: string }[];
	highlights: { type: "good" | "warn" | "info"; title: string; text: string }[];
	advice: string[];
	summary: string;
}

interface StudentLike {
	name: string;
	studentNo: string;
	className: string;
}

export function buildParentReport(
	student: StudentLike,
	scores: any[],
	attendance: any[],
	leaves: any[],
	evaluation: any
): ParentReport {
	const today = dayjs();
	const start = today.subtract((today.day() + 6) % 7, "day");
	const range: [string, string] = [start.format("YYYY-MM-DD"), today.format("YYYY-MM-DD")];

	const avg = scores.length ? scores.reduce((a, b) => a + b.score, 0) / scores.length : 0;
	const best = scores.slice().sort((a, b) => b.score - a.score)[0];
	const worst = scores.slice().sort((a, b) => a.score - b.score)[0];
	const normal = attendance.filter(a => a.type === "NORMAL").length;
	const absent = attendance.filter(a => a.type === "ABSENT").length;
	const late = attendance.filter(a => a.type === "LATE").length;
	const rate = attendance.length ? Number(((normal / attendance.length) * 100).toFixed(1)) : 100;
	const weekLeaves = leaves.filter(l => l.status !== "REJECTED").length;

	const hasScore = scores.length > 0;
	const metrics = [
		{ label: "综合均分", value: hasScore ? avg.toFixed(1) : "--", unit: "分", trend: hasScore ? (avg >= 85 ? "优秀" : avg >= 70 ? "良好" : "待提升") : "" },
		{ label: "本周出勤", value: rate, unit: "%", trend: rate >= 98 ? "全勤" : rate >= 90 ? "良好" : "偏低" },
		{ label: "迟到/缺勤", value: `${late}/${absent}`, unit: "次", trend: late + absent === 0 ? "无异常" : "需关注" },
		{ label: "请假", value: weekLeaves, unit: "次", trend: weekLeaves === 0 ? "无" : "已备案" }
	];

	const highlights: ParentReport["highlights"] = [];

	if (best && best.score >= 90) {
		highlights.push({ type: "good", title: "优势学科", text: `${best.courseName} 取得 ${best.score} 分，保持得很好。` });
	}
	if (worst && worst.score < 70) {
		highlights.push({
			type: "warn",
			title: "需要关注",
			text: `${worst.courseName} 得分 ${worst.score}，建议本周安排 2 次专项练习，并把错题整理出来。`
		});
	}
	if (absent > 0) {
		highlights.push({ type: "warn", title: "出勤提醒", text: `本周有 ${absent} 次缺勤记录，请与班主任确认是否已补假。` });
	} else if (attendance.length) {
		highlights.push({ type: "good", title: "出勤稳定", text: "本周未出现缺勤，作息保持得很好。" });
	}
	if (evaluation) {
		highlights.push({
			type: "info",
			title: "综合素质",
			text: `德育 ${evaluation.moral} · 学业 ${evaluation.academic} · 体育 ${evaluation.physical} · 艺术 ${evaluation.art}，综合等级 ${evaluation.level}。`
		});
	}
	if (!highlights.length) {
		highlights.push({ type: "info", title: "本周概览", text: "本周暂无异常记录，保持当前节奏即可。" });
	}

	const advice: string[] = [];
	if (worst && worst.score < 70) advice.push(`针对 ${worst.courseName}，建议每天 20 分钟专题练习，周末做一次错题回顾。`);
	advice.push("保持每天固定作息，晚上 22:30 前休息，保证课堂专注度。");
	if (weekLeaves > 0) advice.push("请假返校后请及时与老师沟通补课安排，避免知识点断档。");
	advice.push("每周与孩子做一次 10 分钟的沟通，关注情绪与同伴关系。");

	const summary =
		`${student.name} 同学本周综合表现${rate >= 95 && avg >= 80 ? "稳定" : "基本正常"}：` +
		`出勤率 ${rate}%，${hasScore ? `综合均分 ${avg.toFixed(1)} 分` : "本周暂无新成绩"}，` +
		`${absent + late === 0 ? "无迟到缺勤" : `迟到 ${late} 次、缺勤 ${absent} 次`}。` +
		`${worst && worst.score < 70 ? `${worst.courseName} 是本周薄弱环节，建议重点关注。` : "各科表现均衡。"}`;

	return {
		student,
		week: `${range[0]} ~ ${range[1]}`,
		range,
		metrics,
		highlights,
		advice,
		summary
	};
}
