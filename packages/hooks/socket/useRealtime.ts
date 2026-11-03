/**
 * @file 实时事件总线（模拟 WebSocket 推送）
 * @desc 用定时器模拟服务端推送；接入真实 WebSocket 时只需替换 start() 内部实现，
 *       订阅方（RealtimeFeed / 首页 / 大屏）代码不变。
 */
import { dayjs } from "lmUtils/time";

export type RealtimeType = "attendance" | "access" | "alert" | "system" | "approve";

export interface RealtimeEvent {
	id: string;
	type: RealtimeType;
	level: "info" | "warning" | "danger" | "success";
	title: string;
	content: string;
	time: string;
}

type Listener = (event: RealtimeEvent) => void;

const listeners = new Set<Listener>();
const history: RealtimeEvent[] = [];
let timer: ReturnType<typeof setInterval> | null = null;
let seq = 0;

const POOL: Omit<RealtimeEvent, "id" | "time">[] = [
	{ type: "attendance", level: "success", title: "人脸考勤打卡", content: "高一(1)班 钟明轩 于南门闸机完成人脸打卡" },
	{ type: "access", level: "warning", title: "非授权时段通行", content: "B 栋 302 宿舍门禁 22:41 检测到通行，已记录待复核" },
	{ type: "alert", level: "danger", title: "消费异常预警", content: "学生 陈嘉宁 12:03-12:09 连续消费 4 笔，触发高频消费规则" },
	{ type: "approve", level: "info", title: "新的请假申请", content: "高三(4)班 朱博文 提交病假申请，等待班主任审批" },
	{ type: "system", level: "info", title: "设备心跳恢复", content: "图书馆闸机已恢复在线，累计离线 32 分钟" },
	{ type: "attendance", level: "warning", title: "迟到提醒", content: "高二(2)班 黄思远 08:26 打卡，已标记迟到" },
	{ type: "access", level: "success", title: "访客到访", content: "访客 李先生 已登记到访，接待人：张校长" },
	{ type: "alert", level: "warning", title: "能耗超阈值", content: "体育馆今日用电 1350kWh，超出阈值 12%" }
];

const emit = (event: RealtimeEvent) => {
	history.unshift(event);
	if (history.length > 100) history.pop();
	listeners.forEach(fn => fn(event));
};

/** 手动推送一条事件（调试或业务调用） */
export function pushRealtime(data: Omit<RealtimeEvent, "id" | "time">) {
	seq += 1;
	emit({
		...data,
		id: `RT${String(seq).padStart(5, "0")}`,
		time: dayjs().format("HH:mm:ss")
	});
}

/** 订阅 */
export function onRealtime(fn: Listener) {
	listeners.add(fn);
	return () => listeners.delete(fn);
}

export function getHistory() {
	return history;
}

/** 启动模拟推送 */
export function startRealtime(interval = 18000) {
	if (timer) return;
	// 预热几条历史
	[0, 1, 2].forEach(i => {
		const item = POOL[i % POOL.length];
		seq += 1;
		history.push({ ...item, id: `RT${String(seq).padStart(5, "0")}`, time: dayjs().subtract(i * 7, "minute").format("HH:mm:ss") });
	});
	timer = setInterval(() => {
		const item = POOL[Math.floor(Math.random() * POOL.length)];
		pushRealtime(item);
	}, interval);
}

export function stopRealtime() {
	if (timer) {
		clearInterval(timer);
		timer = null;
	}
}

export const REALTIME_TYPE_TEXT: Record<RealtimeType, string> = {
	attendance: "考勤",
	access: "门禁",
	alert: "预警",
	system: "系统",
	approve: "审批"
};
