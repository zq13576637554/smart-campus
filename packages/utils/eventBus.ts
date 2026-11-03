type Handler = (...args: any[]) => void;

/** 轻量事件总线 */
class EventBus {
	private map: Map<string, Handler[]> = new Map();

	on(event: string, handler: Handler) {
		const list = this.map.get(event) || [];
		list.push(handler);
		this.map.set(event, list);
		return () => this.off(event, handler);
	}

	once(event: string, handler: Handler) {
		const wrap = (...args: any[]) => {
			handler(...args);
			this.off(event, wrap);
		};
		return this.on(event, wrap);
	}

	off(event: string, handler?: Handler) {
		if (!handler) {
			this.map.delete(event);
			return;
		}
		const list = this.map.get(event) || [];
		this.map.set(
			event,
			list.filter(h => h !== handler)
		);
	}

	emit(event: string, ...args: any[]) {
		(this.map.get(event) || []).forEach(h => h(...args));
	}

	clear() {
		this.map.clear();
	}
}

const eventBus = new EventBus();

export default eventBus;

/**
 * 页面返回事件
 * @desc 列表页 onActivated 时监听编辑/新增页回传的刷新事件
 */
const BACK_EVENT = "back-page-do-event";

export function backPageDoEvent(cb: (msg: { type: string; [k: string]: any }) => void) {
	return eventBus.on(BACK_EVENT, cb);
}

export function emitBackPageEvent(msg: { type: string; [k: string]: any }) {
	eventBus.emit(BACK_EVENT, msg);
}
