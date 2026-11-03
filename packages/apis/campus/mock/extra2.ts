/**
 * @file 业务纵深演示数据（B4 起）
 * @desc 综合素质评价 / 宿舍报修 / 消费预警 / 访客 / 缴费 / 资产 / 图书馆 / 校车 / 能耗
 */
import { dayjs } from "lmUtils/time";

let seed = 913;
const rnd = () => {
	seed = (seed * 9301 + 49297) % 233280;
	return seed / 233280;
};
const int = (min: number, max: number) => Math.floor(rnd() * (max - min + 1)) + min;
const pick = <T>(arr: T[]): T => arr[Math.floor(rnd() * arr.length)];
const today = dayjs();

/* ---------------- B4 综合素质评价 ---------------- */
export interface Evaluation {
	id: string;
	studentNo: string;
	studentName: string;
	className: string;
	grade: string;
	moral: number;
	academic: number;
	physical: number;
	art: number;
	total: number;
	level: string;
	records: number;
}

export interface EvalRecord {
	id: string;
	studentNo: string;
	type: string;
	score: number;
	reason: string;
	time: string;
	operator: string;
	category: string;
}

const EVAL_REASONS = [
	["ADD", 2, "拾金不昧", "品德"],
	["ADD", 3, "校级竞赛一等奖", "学业"],
	["ADD", 1, "志愿服务 4 小时", "实践"],
	["SUB", -2, "迟到累计 3 次", "纪律"],
	["ADD", 2, "运动会团体项目获奖", "体育"],
	["ADD", 1, "艺术节参演", "艺术"],
	["SUB", -1, "宿舍卫生扣分", "卫生"],
	["ADD", 3, "期末考试成绩进步 20 名", "学业"]
];

const levelOf = (total: number) => (total >= 92 ? "A" : total >= 85 ? "B" : total >= 75 ? "C" : "D");

export const evaluations: Evaluation[] = [];
export const evalRecords: EvalRecord[] = [];

export function initEvaluations(students: { studentNo: string; name: string; className: string; grade: string }[]) {
	students.slice(0, 60).forEach((stu, i) => {
		const moral = int(18, 30);
		const academic = int(20, 30);
		const physical = int(15, 20);
		const art = int(12, 20);
		const total = Math.min(100, moral + academic + physical + art);
		const count = int(2, 5);
		for (let k = 0; k < count; k++) {
			const [type, score, reason, category] = pick(EVAL_REASONS);
			evalRecords.push({
				id: `EV${String(evalRecords.length + 1).padStart(5, "0")}`,
				studentNo: stu.studentNo,
				type: type as string,
				score: Number(score),
				reason: reason as string,
				category: category as string,
				time: today.subtract(int(1, 90), "day").format("YYYY-MM-DD HH:mm:ss"),
				operator: pick(["班主任 王老师", "德育处", "年级组"])
			});
		}
		evaluations.push({
			id: `E${String(i + 1).padStart(4, "0")}`,
			studentNo: stu.studentNo,
			studentName: stu.name,
			className: stu.className,
			grade: stu.grade,
			moral,
			academic,
			physical,
			art,
			total,
			level: levelOf(total),
			records: count
		});
	});
}

/* ---------------- B5 宿舍报修 ---------------- */
export interface RepairOrder {
	id: string;
	dorm: string;
	reporter: string;
	phone: string;
	type: string;
	description: string;
	createTime: string;
	status: string;
	handler: string;
	finishTime: string;
	level: string;
}

const REPAIR_TYPES = ["空调", "热水器", "门锁", "照明", "水管", "网络", "家具", "其他"];
const REPAIR_DESC: Record<string, string[]> = {
	空调: ["制冷效果差，出风有异味", "空调外机噪音大", "遥控器失灵"],
	热水器: ["热水不热，水温只有 30 度", "热水器漏水", "插电后无反应"],
	门锁: ["门锁卡顿打不开", "钥匙断在锁孔里", "门锁主板无响应"],
	照明: ["灯管闪烁", "卫生间灯不亮", "开关失灵"],
	水管: ["水龙头漏水", "下水道堵塞", "水管接口渗水"],
	网络: ["宿舍网络断连", "网口松动", "WiFi 信号弱"],
	家具: ["床板松动", "书桌抽屉脱落", "衣柜门掉落"],
	其他: ["需要更换垃圾桶", "窗纱破损", "墙面脱落"]
};

export const repairOrders: RepairOrder[] = Array.from({ length: 32 }, (_, i) => {
	const type = pick(REPAIR_TYPES);
	const status = i < 4 ? "PENDING" : i < 8 ? "PROCESSING" : i < 12 ? "DONE" : pick(["DONE", "DONE", "PENDING", "PROCESSING"]);
	return {
		id: `RP${String(i + 1).padStart(5, "0")}`,
		dorm: `${pick(["A 栋", "B 栋", "C 栋", "D 栋"])}${int(1, 6)}${String(int(1, 20)).padStart(2, "0")}`,
		reporter: pick(["李同学", "王同学", "张同学", "刘同学", "陈同学", "赵同学"]),
		phone: `13${int(1, 9)}${String(int(10000000, 99999999))}`,
		type,
		description: pick(REPAIR_DESC[type]),
		createTime: today.subtract(int(0, 20), "day").add(int(8, 20), "hour").format("YYYY-MM-DD HH:mm:ss"),
		status,
		handler: status === "PENDING" ? "" : pick(["维修组-老周", "维修组-小陈", "维修组-老李"]),
		finishTime: status === "DONE" ? today.subtract(int(0, 10), "day").format("YYYY-MM-DD HH:mm:ss") : "",
		level: rnd() > 0.85 ? "URGENT" : "NORMAL"
	};
});

/* ---------------- B6 消费异常预警 ---------------- */
export interface ConsumeAlert {
	id: string;
	studentNo: string;
	studentName: string;
	cardNo: string;
	rule: string;
	level: string;
	amount: number;
	count: number;
	time: string;
	status: string;
	remark: string;
}

const ALERT_RULES = [
	["FREQUENT", "短时高频消费", "HIGH", 5],
	["NIGHT", "夜间异常消费", "MEDIUM", 1],
	["AMOUNT", "单笔大额消费", "MEDIUM", 1],
	["LOW_BALANCE", "余额不足提醒", "LOW", 1],
	["LOCATION", "异地消费", "HIGH", 1]
] as const;

export const consumeAlerts: ConsumeAlert[] = Array.from({ length: 28 }, (_, i) => {
	const [rule, ruleName, level, count] = ALERT_RULES[i % ALERT_RULES.length];
	return {
		id: `CA${String(i + 1).padStart(5, "0")}`,
		studentNo: `2024${String(int(1, 399)).padStart(5, "0")}`,
		studentName: pick(["余志强", "姜浩然", "邹诗涵", "沈思远", "陈嘉宁", "邓皓轩", "沈子墨", "万梦琪"]),
		cardNo: `62${String(int(1000000000, 9999999999))}`,
		rule: ruleName,
		level,
		amount: Number((int(20, 600) + rnd()).toFixed(2)),
		count,
		time: today.subtract(int(0, 10), "day").format("YYYY-MM-DD HH:mm:ss"),
		status: i < 6 ? "PENDING" : i < 10 ? "PROCESSING" : "HANDLED",
		remark: i < 6 ? "" : "已通知班主任核实"
	};
});

/* ---------------- B7 访客预约 ---------------- */
export interface Visitor {
	id: string;
	name: string;
	phone: string;
	company: string;
	visitTarget: string;
	reason: string;
	visitTime: string;
	duration: string;
	status: string;
	checkInTime: string;
	code: string;
	personCount: number;
}

export const visitors: Visitor[] = Array.from({ length: 26 }, (_, i) => {
	const status = i < 5 ? "APPROVED" : i < 8 ? "PENDING" : i < 12 ? "VISITED" : "EXPIRED";
	return {
		id: `VS${String(i + 1).padStart(5, "0")}`,
		name: pick(["李先生", "王女士", "张先生", "刘女士", "陈先生", "赵女士"]),
		phone: `13${int(1, 9)}${String(int(10000000, 99999999))}`,
		company: pick(["市教育局", "华为技术", "新华书店", "家长", "设备供应商", "兄弟学校"]),
		visitTarget: pick(["张校长", "教务处", "学生处", "信息中心", "后勤集团"]),
		reason: pick(["工作交流", "设备维保", "家长会", "参观学习", "送货", "洽谈合作"]),
		visitTime: today.subtract(int(-3, 10), "day").format("YYYY-MM-DD") + ` ${String(int(8, 17)).padStart(2, "0")}:00`,
		duration: `${int(1, 4)} 小时`,
		status,
		checkInTime: status === "VISITED" ? today.subtract(int(0, 5), "day").format("YYYY-MM-DD HH:mm:ss") : "",
		code: `VC${String(int(100000, 999999))}`,
		personCount: int(1, 4)
	};
});

/* ---------------- B8 缴费中心 ---------------- */
export interface Bill {
	id: string;
	studentNo: string;
	studentName: string;
	className: string;
	feeType: string;
	period: string;
	amount: number;
	paid: number;
	status: string;
	dueDate: string;
	payTime: string;
}

const FEE_TYPES = ["学费", "住宿费", "教材费", "校服费", "课后服务费", "餐费"];

export const bills: Bill[] = Array.from({ length: 60 }, (_, i) => {
	const amount = pick([800, 1200, 1600, 2400, 3200]);
	const status = i < 18 ? "UNPAID" : i < 24 ? "PARTIAL" : "PAID";
	const paid = status === "PAID" ? amount : status === "PARTIAL" ? Math.round(amount * 0.5) : 0;
	return {
		id: `BL${String(i + 1).padStart(5, "0")}`,
		studentNo: `2024${String(int(1, 399)).padStart(5, "0")}`,
		studentName: pick(["钟明轩", "汤汐月", "武泽宇", "严嘉宁", "邹晨阳", "钟梦琪", "孟晨阳", "陈天赐"]),
		className: `${pick(["高一", "高二", "高三"])}(${int(1, 4)})班`,
		feeType: pick(FEE_TYPES),
		period: "2025-2026 学年第一学期",
		amount,
		paid,
		status,
		dueDate: today.add(int(-10, 20), "day").format("YYYY-MM-DD"),
		payTime: status === "PAID" ? today.subtract(int(1, 30), "day").format("YYYY-MM-DD HH:mm:ss") : ""
	};
});

/* ---------------- B9 资产台账 ---------------- */
export interface Asset {
	id: string;
	code: string;
	name: string;
	category: string;
	location: string;
	owner: string;
	price: number;
	purchaseDate: string;
	status: string;
	warranty: string;
}

const ASSET_NAMES: [string, string][] = [
	["多媒体教学一体机", "教学设备"],
	["学生课桌", "家具"],
	["实验台", "实验设备"],
	["台式电脑", "IT 设备"],
	["打印机", "办公设备"],
	["空调", "电器"],
	["投影仪", "教学设备"],
	["监控摄像头", "安防设备"],
	["图书架", "家具"],
	["体育器材", "体育设备"]
];

export const assets: Asset[] = Array.from({ length: 48 }, (_, i) => {
	const [name, category] = ASSET_NAMES[i % ASSET_NAMES.length];
	return {
		id: `AS${String(i + 1).padStart(5, "0")}`,
		code: `ZC${2020 + int(0, 5)}${String(i + 1).padStart(4, "0")}`,
		name,
		category,
		location: `${pick(["教学楼", "实验楼", "图书馆", "体育馆", "行政楼"])}${int(1, 5)}0${int(1, 9)}`,
		owner: pick(["教务处", "信息中心", "后勤集团", "图书馆", "体育组"]),
		price: pick([1200, 2400, 3600, 5800, 12000, 24000]),
		purchaseDate: today.subtract(int(60, 1200), "day").format("YYYY-MM-DD"),
		status: i < 30 ? "IN_USE" : i < 38 ? "IDLE" : i < 44 ? "REPAIR" : "SCRAPPED",
		warranty: today.subtract(int(-200, 600), "day").format("YYYY-MM-DD")
	};
});

/* ---------------- B10 图书馆 ---------------- */
export interface BookBorrow {
	id: string;
	bookName: string;
	isbn: string;
	author: string;
	borrower: string;
	studentNo: string;
	borrowDate: string;
	dueDate: string;
	returnDate: string;
	status: string;
}

const BOOKS: [string, string][] = [
	["三体", "刘慈欣"],
	["活着", "余华"],
	["平凡的世界", "路遥"],
	["人类简史", "尤瓦尔·赫拉利"],
	["数学之美", "吴军"],
	["时间简史", "霍金"],
	["红楼梦", "曹雪芹"],
	["围城", "钱钟书"],
	["百年孤独", "马尔克斯"],
	["明朝那些事儿", "当年明月"]
];

export const bookBorrows: BookBorrow[] = Array.from({ length: 40 }, (_, i) => {
	const [bookName, author] = BOOKS[i % BOOKS.length];
	const status = i < 22 ? "BORROWED" : i < 28 ? "OVERDUE" : "RETURNED";
	const borrowDate = today.subtract(int(1, 60), "day");
	return {
		id: `BB${String(i + 1).padStart(5, "0")}`,
		bookName,
		isbn: `978${int(1000000000, 9999999999)}`,
		author,
		borrower: pick(["钟明轩", "汤汐月", "武泽宇", "严嘉宁", "邹晨阳", "钟梦琪"]),
		studentNo: `2024${String(int(1, 399)).padStart(5, "0")}`,
		borrowDate: borrowDate.format("YYYY-MM-DD"),
		dueDate: borrowDate.add(30, "day").format("YYYY-MM-DD"),
		returnDate: status === "RETURNED" ? borrowDate.add(int(3, 25), "day").format("YYYY-MM-DD") : "",
		status
	};
});

/* ---------------- B11 校车 ---------------- */
export interface BusRoute {
	id: string;
	routeName: string;
	driver: string;
	plateNo: string;
	capacity: number;
	riders: number;
	startTime: string;
	endTime: string;
	stops: number;
	status: string;
}

const ROUTE_NAMES = ["红谷滩 1 号线", "青山湖 2 号线", "西湖 3 号线", "新建 4 号线", "九龙湖 5 号线", "经开区 6 号线"];

export const busRoutes: BusRoute[] = ROUTE_NAMES.map((routeName, i) => ({
	id: `BUS${String(i + 1).padStart(3, "0")}`,
	routeName,
	driver: pick(["王师傅", "李师傅", "张师傅", "刘师傅"]),
	plateNo: `赣A·${String(int(10000, 99999))}`,
	capacity: 45,
	riders: int(18, 45),
	startTime: "06:40",
	endTime: "19:20",
	stops: int(5, 12),
	status: i === 5 ? "MAINTAIN" : "RUNNING"
}));

/* ---------------- B12 能耗监测 ---------------- */
export interface EnergyRecord {
	id: string;
	building: string;
	type: string;
	value: number;
	unit: string;
	date: string;
	threshold: number;
	status: string;
}

export const energyRecords: EnergyRecord[] = [];
["教学楼", "宿舍 A 栋", "宿舍 B 栋", "图书馆", "体育馆", "实验楼"].forEach((building, bi) => {
	["电", "水"].forEach(type => {
		for (let d = 0; d < 12; d++) {
			const base = type === "电" ? 800 : 60;
			const value = Number((base + rnd() * base * 0.6).toFixed(1));
			const threshold = type === "电" ? 1200 : 90;
			energyRecords.push({
				id: `EN${String(energyRecords.length + 1).padStart(5, "0")}`,
				building,
				type,
				value,
				unit: type === "电" ? "kWh" : "t",
				date: today.subtract(11 - d, "day").format("YYYY-MM-DD"),
				threshold,
				status: value > threshold ? "OVER" : "NORMAL"
			});
		}
	});
	bi;
});

/* ---------------- 通用 ---------------- */
export const SERVICE_WORKERS = ["维修组-老周", "维修组-小陈", "维修组-老李"];

export const todayStr = today.format("YYYY-MM-DD");
