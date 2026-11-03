/**
 * @file Copilot 只读工具路由
 * @desc 把自然语言问题路由到「只读查询工具」，返回结论 + 结构化卡片。
 *       安全边界：本文件只做查询聚合，不提供任何写操作；接入真实模型时，
 *       这里的 tool 定义即为 function-calling 的工具清单。
 */
import { dayjs } from "lmUtils/time";
import { db } from "./db";
import { leaves } from "./extra";
import { evaluations, repairOrders } from "./extra2";

export interface CopilotMetric {
	label: string;
	value: string | number;
	unit?: string;
}

export interface CopilotCard {
	type: "metrics" | "table";
	title: string;
	metrics?: CopilotMetric[];
	columns?: { label: string; prop: string }[];
	rows?: Record<string, any>[];
}

export interface CopilotResult {
	intent: string;
	tool: string;
	params: Record<string, any>;
	reply: string;
	cards: CopilotCard[];
	followUps: string[];
}

/** 从问题里抽取班级 / 姓名 / 时间等参数 */
function extractParams(question: string) {
	const className = db.classes.map(c => c.className).find(name => question.includes(name));
	const grade = ["高一", "高二", "高三"].find(g => question.includes(g));
	const recent = question.match(/最近\s*(\d+)\s*天/);
	const days = recent ? Number(recent[1]) : 30;
	const lowThreshold = question.match(/低于\s*(\d+)\s*元/);
	return {
		className,
		grade,
		days,
		threshold: lowThreshold ? Number(lowThreshold[1]) : 20
	};
}

export function runCopilot(question: string): CopilotResult {
	const q = (question || "").trim();
	const p = extractParams(q);
	const none = { intent: "chat", tool: "", params: {}, reply: "", cards: [] as CopilotCard[], followUps: [] };

	/* ---------- 工具 1：学生名单 ---------- */
	// 放最后：避免「有多少学生请假待审批」被「学生」抢先命中，必须让更具体的业务词优先
	const isSpecific = /请假|审批|考勤|出勤|迟到|缺勤|成绩|分数|均分|一卡通|余额|消费|报修|工单|综合素质|德育/.test(q);
	if (!isSpecific && /学生|名单|花名册|在册/.test(q)) {
		const list = db.students.filter(
			s => (!p.className || s.className === p.className) && (!p.grade || s.grade === p.grade)
		);
		const studying = list.filter(s => s.status === "STUDYING").length;
		return {
			intent: "student.list",
			tool: "queryStudents",
			params: { className: p.className, grade: p.grade },
			reply: `共查询到 **${list.length}** 名学生${p.className ? `（${p.className}）` : p.grade ? `（${p.grade}）` : ""}，其中在读 **${studying}** 人。以下为前 8 条记录。`,
			cards: [
				{
					type: "metrics",
					title: "学生概览",
					metrics: [
						{ label: "学生总数", value: list.length, unit: "人" },
						{ label: "在读", value: studying, unit: "人" },
						{ label: "休学/其他", value: list.length - studying, unit: "人" },
						{ label: "涉及班级", value: new Set(list.map(s => s.className)).size, unit: "个" }
					]
				},
				{
					type: "table",
					title: "学生明细（前 8 条）",
					columns: [
						{ label: "学号", prop: "studentNo" },
						{ label: "姓名", prop: "name" },
						{ label: "班级", prop: "className" },
						{ label: "状态", prop: "statusText" },
						{ label: "宿舍", prop: "dorm" }
					],
					rows: list.slice(0, 8).map(s => ({
						...s,
						statusText: s.status === "STUDYING" ? "在读" : s.status === "SUSPENDED" ? "休学" : s.status === "GRADUATED" ? "毕业" : "退学"
					}))
				}
			],
			followUps: ["看一下这个班的考勤情况", "导出这份名单", "有哪些学生处于休学状态"]
		};
	}

	/* ---------- 工具 2：考勤 ---------- */
	if (/考勤|出勤|迟到|缺勤|打卡/.test(q)) {
		const since = dayjs().subtract(p.days, "day").format("YYYY-MM-DD");
		const list = db.attendances.filter(
			a => a.date >= since && (!p.className || a.className === p.className)
		);
		const normal = list.filter(a => a.type === "NORMAL").length;
		const late = list.filter(a => a.type === "LATE").length;
		const absent = list.filter(a => a.type === "ABSENT").length;
		const rate = list.length ? Number(((normal / list.length) * 100).toFixed(1)) : 100;

		// 缺勤 top
		const counter = new Map<string, { name: string; className: string; count: number }>();
		list
			.filter(a => a.type === "ABSENT" || a.type === "LATE")
			.forEach(a => {
				const key = a.studentNo || a.name;
				const hit = counter.get(key) || { name: a.name, className: a.className, count: 0 };
				hit.count += 1;
				counter.set(key, hit);
			});
		const top = Array.from(counter.values()).sort((a, b) => b.count - a.count).slice(0, 6);

		return {
			intent: "attendance.summary",
			tool: "queryAttendance",
			params: { className: p.className, days: p.days },
			reply: `近 **${p.days} 天**${p.className ? `「${p.className}」` : ""}共 **${list.length}** 条考勤记录，出勤率 **${rate}%**，迟到 ${late} 次、缺勤 ${absent} 次。${absent > 0 ? "缺勤记录已列在下方，建议与班主任核对。" : "整体出勤状况良好。"}`,
			cards: [
				{
					type: "metrics",
					title: "考勤概览",
					metrics: [
						{ label: "出勤率", value: rate, unit: "%" },
						{ label: "迟到", value: late, unit: "次" },
						{ label: "缺勤", value: absent, unit: "次" },
						{ label: "记录数", value: list.length, unit: "条" }
					]
				},
				{
					type: "table",
					title: "异常人员 TOP",
					columns: [
						{ label: "姓名", prop: "name" },
						{ label: "班级", prop: "className" },
						{ label: "异常次数", prop: "count" }
					],
					rows: top
				}
			],
			followUps: ["这些缺勤有没有请假记录", "对比上周考勤", "按打卡方式统计"]
		};
	}

	/* ---------- 工具 3：成绩 ---------- */
	if (/成绩|分数|均分|及格|优秀/.test(q)) {
		const courses = ["语文", "数学", "英语", "物理", "化学"];
		const list = db.scores.filter(s => courses.includes(s.courseName) && (!p.className || s.className === p.className));
		const avg = list.length ? list.reduce((a, b) => a + b.score, 0) / list.length : 0;
		const pass = list.filter(s => s.score >= 60).length;
		const excellent = list.filter(s => s.score >= 90).length;
		const byCourse = courses.map(c => {
			const rows = list.filter(s => s.courseName === c);
			return {
				courseName: c,
				avg: rows.length ? Number((rows.reduce((a, b) => a + b.score, 0) / rows.length).toFixed(1)) : 0,
				passRate: rows.length ? Number(((rows.filter(s => s.score >= 60).length / rows.length) * 100).toFixed(1)) : 0,
				max: rows.length ? Math.max(...rows.map(s => s.score)) : 0
			};
		});
		const worst = byCourse.slice().sort((a, b) => a.avg - b.avg)[0];

		return {
			intent: "score.summary",
			tool: "queryScores",
			params: { className: p.className },
			reply: `本次考试${p.className ? `「${p.className}」` : "全校"}共 **${list.length}** 条成绩，平均分 **${avg.toFixed(1)}**，及格率 **${((pass / (list.length || 1)) * 100).toFixed(1)}%**，优秀率 **${((excellent / (list.length || 1)) * 100).toFixed(1)}%**。最薄弱学科为 **${worst?.courseName}**（均分 ${worst?.avg}），建议安排专项辅导。`,
			cards: [
				{
					type: "metrics",
					title: "成绩概览",
					metrics: [
						{ label: "平均分", value: avg.toFixed(1), unit: "分" },
						{ label: "及格率", value: ((pass / (list.length || 1)) * 100).toFixed(1), unit: "%" },
						{ label: "优秀率", value: ((excellent / (list.length || 1)) * 100).toFixed(1), unit: "%" },
						{ label: "样本数", value: list.length, unit: "条" }
					]
				},
				{
					type: "table",
					title: "学科对比",
					columns: [
						{ label: "学科", prop: "courseName" },
						{ label: "平均分", prop: "avg" },
						{ label: "及格率(%)", prop: "passRate" },
						{ label: "最高分", prop: "max" }
					],
					rows: byCourse
				}
			],
			followUps: ["哪些学生不及格", "生成学情报告", "对比上个学期"]
		};
	}

	/* ---------- 工具 4：请假 ---------- */
	if (/请假|审批|待办/.test(q)) {
		const pending = leaves.filter(l => l.status === "PENDING");
		const total = leaves.length;
		return {
			intent: "leave.summary",
			tool: "queryLeave",
			params: {},
			reply: `当前共 **${total}** 条请假记录，其中 **${pending.length}** 条待审批。${pending.length ? "建议优先处理时长较长的申请。" : "暂无待办。"}`,
			cards: [
				{
					type: "metrics",
					title: "请假概览",
					metrics: [
						{ label: "申请总数", value: total, unit: "条" },
						{ label: "待审批", value: pending.length, unit: "条" },
						{ label: "已通过", value: leaves.filter(l => l.status === "APPROVED").length, unit: "条" },
						{ label: "已驳回", value: leaves.filter(l => l.status === "REJECTED").length, unit: "条" }
					]
				},
				{
					type: "table",
					title: "待审批申请",
					columns: [
						{ label: "姓名", prop: "studentName" },
						{ label: "班级", prop: "className" },
						{ label: "类型", prop: "type" },
						{ label: "天数", prop: "days" },
						{ label: "申请时间", prop: "applyTime" }
					],
					rows: pending
				}
			],
			followUps: ["帮我打开请假审批页", "本周请假最多的是哪个班", "请假对考勤的影响"]
		};
	}

	/* ---------- 工具 5：一卡通 ---------- */
	if (/一卡通|余额|消费|充值/.test(q)) {
		const low = db.cards.filter(c => c.balance < p.threshold);
		const totalBalance = db.cards.reduce((a, b) => a + b.balance, 0);
		const today = db.cardTxes.filter(t => dayjs(t.time).isSame(dayjs(), "day"));
		const todayAmount = today.reduce((a, b) => a + Math.abs(b.amount), 0);

		return {
			intent: "card.summary",
			tool: "queryCards",
			params: { threshold: p.threshold },
			reply: `卡内总余额 **¥${totalBalance.toFixed(2)}**，今日交易 **${today.length}** 笔、金额 **¥${todayAmount.toFixed(2)}**。余额低于 ¥${p.threshold} 的卡片有 **${low.length}** 张，建议推送充值提醒。`,
			cards: [
				{
					type: "metrics",
					title: "一卡通概览",
					metrics: [
						{ label: "总余额", value: totalBalance.toFixed(0), unit: "元" },
						{ label: "今日交易", value: today.length, unit: "笔" },
						{ label: "今日金额", value: todayAmount.toFixed(0), unit: "元" },
						{ label: "余额不足", value: low.length, unit: "张" }
					]
				},
				{
					type: "table",
					title: "余额不足名单",
					columns: [
						{ label: "姓名", prop: "name" },
						{ label: "卡号", prop: "cardNo" },
						{ label: "班级", prop: "className" },
						{ label: "余额(元)", prop: "balance" }
					],
					rows: low.slice(0, 8).map(c => ({ ...c, balance: c.balance.toFixed(2) }))
				}
			],
			followUps: ["最近有哪些异常消费", "导出余额不足名单", "本周充值总额"]
		};
	}

	/* ---------- 工具 6：宿舍报修 ---------- */
	if (/报修|工单|维修/.test(q)) {
		const pending = repairOrders.filter(r => r.status === "PENDING");
		const urgent = repairOrders.filter(r => r.level === "URGENT" && r.status !== "DONE");
		return {
			intent: "repair.summary",
			tool: "queryRepairs",
			params: {},
			reply: `当前共 **${repairOrders.length}** 条报修工单，待接单 **${pending.length}** 条，其中紧急 **${urgent.length}** 条。建议优先派单紧急工单。`,
			cards: [
				{
					type: "metrics",
					title: "报修概览",
					metrics: [
						{ label: "工单总数", value: repairOrders.length, unit: "单" },
						{ label: "待接单", value: pending.length, unit: "单" },
						{ label: "处理中", value: repairOrders.filter(r => r.status === "PROCESSING").length, unit: "单" },
						{ label: "已完成", value: repairOrders.filter(r => r.status === "DONE").length, unit: "单" }
					]
				},
				{
					type: "table",
					title: "待接单工单",
					columns: [
						{ label: "宿舍", prop: "dorm" },
						{ label: "类型", prop: "type" },
						{ label: "描述", prop: "description" },
						{ label: "紧急", prop: "levelText" }
					],
					rows: pending.slice(0, 8).map(r => ({ ...r, levelText: r.level === "URGENT" ? "紧急" : "普通" }))
				}
			],
			followUps: ["紧急工单有哪些", "平均处理时长", "哪个楼栋报修最多"]
		};
	}

	/* ---------- 工具 7：综合素质 ---------- */
	if (/综合素质|德育|评价|积分/.test(q)) {
		const avg = evaluations.reduce((a, b) => a + b.total, 0) / (evaluations.length || 1);
		const levels = ["A", "B", "C", "D"].map(l => ({ level: `${l} 级`, count: evaluations.filter(e => e.level === l).length }));
		return {
			intent: "eval.summary",
			tool: "queryEvaluations",
			params: {},
			reply: `共 **${evaluations.length}** 名学生参评，平均总分 **${avg.toFixed(1)}**。${levels[0].count} 人达 A 级，${levels[3].count} 人为 D 级，建议重点跟进 D 级学生。`,
			cards: [
				{
					type: "metrics",
					title: "评价概览",
					metrics: [
						{ label: "参评人数", value: evaluations.length, unit: "人" },
						{ label: "平均总分", value: avg.toFixed(1), unit: "分" },
						{ label: "A 级", value: levels[0].count, unit: "人" },
						{ label: "D 级", value: levels[3].count, unit: "人" }
					]
				},
				{ type: "table", title: "等级分布", columns: [{ label: "等级", prop: "level" }, { label: "人数", prop: "count" }], rows: levels }
			],
			followUps: ["D 级学生名单", "本月加分最多的学生", "班级平均分对比"]
		};
	}

	return none;
}

/**
 * 工具名 → 合成问题
 * @desc 复用 runCopilot 的解析逻辑：由参数拼一句话，再走同一套规则路由，
 *       避免为 function calling 再写一套参数提取。
 */
const TOOL_QUESTION: Record<string, (args: Record<string, any>) => string> = {
	queryStudents: a => `学生名单 ${a.className || ""} ${a.grade || ""}`,
	queryAttendance: a => `考勤 ${a.className || ""} ${a.days ? `最近${a.days}天` : ""}`,
	queryScores: a => `成绩 ${a.className || ""}`,
	queryLeave: () => `请假`,
	queryCards: a => `一卡通 ${a.threshold ? `低于${a.threshold}元` : ""}`,
	queryRepairs: () => `报修`,
	queryEvaluations: () => `综合素质`
};

/** 按工具名直接执行（供 function calling 使用） */
export function runTool(name: string, args: Record<string, any> = {}): CopilotResult | null {
	const build = TOOL_QUESTION[name];
	if (!build) return null;
	const result = runCopilot(build(args));
	// 校验确实命中目标工具，避免合成问题被别的关键词抢走
	return result.tool === name ? result : null;
}

/** 可被模型调用的工具名清单 */
export const TOOL_NAMES = Object.keys(TOOL_QUESTION);
