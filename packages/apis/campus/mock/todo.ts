/**
 * @file 待办中心聚合
 * @desc 把分散在各业务模块里的"待处理事项"汇总成一份清单：
 *       请假审批、报修派单、访客审核、缴费催缴。
 *       只做只读聚合，真正的处理动作仍回到各自模块完成。
 */
import { dayjs } from "lmUtils/time";

export type TodoCategory = "leave" | "repair" | "visitor" | "bill";

export interface TodoItem {
	id: string;
	category: TodoCategory;
	title: string;
	desc: string;
	meta: string;
	time: string;
	level: "urgent" | "normal";
	route: string;
	action: string;
}

export interface TodoGroup {
	category: TodoCategory;
	label: string;
	icon: string;
	route: string;
	count: number;
	urgent: number;
}

export interface TodoResult {
	generatedAt: string;
	total: number;
	urgentTotal: number;
	groups: TodoGroup[];
	items: TodoItem[];
}

const CATEGORY_META: Record<TodoCategory, { label: string; icon: string; route: string; action: string }> = {
	leave: { label: "请假审批", icon: "score", route: "/qjgl/", action: "去审批" },
	repair: { label: "报修派单", icon: "dorm", route: "/ssbx/", action: "去派单" },
	visitor: { label: "访客审核", icon: "access", route: "/fkyy/", action: "去审核" },
	bill: { label: "缴费催缴", icon: "card", route: "/jfzx/", action: "去催缴" }
};

interface TodoDeps {
	leaves: any[];
	repairs: any[];
	visitors: any[];
	bills: any[];
}

/** 生成待办清单；category 传值时只返回该类 */
export function buildTodo(deps: TodoDeps, category?: TodoCategory): TodoResult {
	const today = dayjs();
	const items: TodoItem[] = [];

	/* 1. 请假待审批：天数越多越紧急 */
	deps.leaves
		.filter(l => l.status === "PENDING")
		.forEach(l => {
			items.push({
				id: l.id,
				category: "leave",
				title: `${l.studentName} 提交${l.type}申请`,
				desc: `${l.startDate} ~ ${l.endDate}，共 ${l.days} 天`,
				meta: `${l.className} · ${l.studentNo}`,
				time: l.applyTime,
				level: Number(l.days) >= 3 ? "urgent" : "normal",
				route: CATEGORY_META.leave.route,
				action: CATEGORY_META.leave.action
			});
		});

	/* 2. 报修待接单：紧急工单优先 */
	deps.repairs
		.filter(r => r.status === "PENDING")
		.forEach(r => {
			items.push({
				id: r.id,
				category: "repair",
				title: `${r.dorm} · ${r.type}`,
				desc: r.description,
				meta: `${r.reporter} 报修`,
				time: r.createTime,
				level: r.level === "URGENT" ? "urgent" : "normal",
				route: CATEGORY_META.repair.route,
				action: CATEGORY_META.repair.action
			});
		});

	/* 3. 访客待审核：当天来访算紧急 */
	deps.visitors
		.filter(v => v.status === "PENDING")
		.forEach(v => {
			const todayVisit = dayjs(v.visitTime).isSame(today, "day");
			items.push({
				id: v.id,
				category: "visitor",
				title: `${v.name} 来访预约`,
				desc: `${v.reason} · 拜访 ${v.visitTarget}`,
				meta: `${v.company} · ${v.personCount} 人`,
				time: v.visitTime,
				level: todayVisit ? "urgent" : "normal",
				route: CATEGORY_META.visitor.route,
				action: CATEGORY_META.visitor.action
			});
		});

	/* 4. 账单待缴：按班级聚合成「催缴单」，避免逐人条目淹没清单 */
	const billGroups = new Map<string, any[]>();
	deps.bills
		.filter(b => b.status !== "PAID")
		.forEach(b => {
			const list = billGroups.get(b.className) || [];
			list.push(b);
			billGroups.set(b.className, list);
		});

	billGroups.forEach((list, className) => {
		const amount = list.reduce((a, b) => a + Number(b.amount), 0);
		const paid = list.reduce((a, b) => a + Number(b.paid), 0);
		const rest = amount - paid;
		const feeTypes = Array.from(new Set(list.map(b => b.feeType)));
		const earliestDue = list.map(b => b.dueDate).sort()[0];
		const overdue = dayjs(earliestDue).isBefore(today, "day");

		items.push({
			id: `bill-${className}`,
			category: "bill",
			title: `${className} 缴费待处理`,
			desc: `${list.length} 笔（${feeTypes.join("、")}）· 应收 ¥${amount.toLocaleString()}，待缴 ¥${rest.toLocaleString()}`,
			meta: `${list.length} 笔账单待缴`,
			time: earliestDue,
			level: overdue ? "urgent" : "normal",
			route: CATEGORY_META.bill.route,
			action: CATEGORY_META.bill.action
		});
	});

	/* 排序：紧急优先，其次按时间倒序 */
	items.sort((a, b) => {
		if (a.level !== b.level) return a.level === "urgent" ? -1 : 1;
		return dayjs(b.time).valueOf() - dayjs(a.time).valueOf();
	});

	const allItems = items;
	const groups = (Object.keys(CATEGORY_META) as TodoCategory[]).map(key => {
		const list = allItems.filter(i => i.category === key);
		return {
			category: key,
			label: CATEGORY_META[key].label,
			icon: CATEGORY_META[key].icon,
			route: CATEGORY_META[key].route,
			count: list.length,
			urgent: list.filter(i => i.level === "urgent").length
		};
	});

	return {
		generatedAt: dayjs().format("YYYY-MM-DD HH:mm:ss"),
		total: allItems.length,
		urgentTotal: allItems.filter(i => i.level === "urgent").length,
		groups,
		items: category ? allItems.filter(i => i.category === category) : allItems
	};
}
