/**
 * @file schema DSL 引擎
 * @desc 复刻 rs.ict-saas 中 @fy/hook 的「简化配置」语法：
 *
 *   表格列： "标题|字段|渲染器-属性:值:类型-...|表头属性-..."
 *   查询栏： "标题|字段|组件-属性:值:类型"
 *
 * 例如：
 *   "订单状态|status|tag|minWidth:140"
 *   "下单时间|createAt|text|format:date-type:ymdhms-join:2"
 *   "订单号|saleOrderNo|input"
 *   "下单时间|createAt|date-type:datetimerange"
 */
import dayjs from "dayjs";
import { getComProps, isEmpty, isFunction } from "lmUtils";

export const TBDEFAULT = "--";

const dateTypeFormat: Record<string, string> = {
	ym: "YYYY/MM",
	md: "MM/DD",
	ymd: "YYYY/MM/DD",
	ymdhm: "YYYY/MM/DD HH:mm",
	ymdhms: "YYYY/MM/DD HH:mm:ss",
	hms: "HH:mm:ss",
	hm: "HH:mm"
};

const dateJoin: Record<string, string> = { 1: "-", 2: "/" };

/** 参数值类型转换：`:n` 表示数字，"true"/"false" 转布尔 */
export function getArgValue(val?: string, type?: string) {
	if (val === undefined) return val;
	if (type === "n") return Number(val);
	if (val === "false") return false;
	if (val === "true") return true;
	if (val === "'false'") return "false";
	if (val === "'true'") return "true";
	return val;
}

/** "minWidth:110-n:1" => { minWidth: "110", n: 1 } */
export function formatStrToObj(str?: string): Record<string, any> {
	const out: Record<string, any> = {};
	if (!str) return out;
	str.split("-").forEach(arg => {
		if (!arg) return;
		const [key, value, argType] = arg.split(":");
		if (!key) return;
		out[key] = getArgValue(value, argType);
	});
	return out;
}

/** 操作列命令解析："查看:view:auth-/student/form/" => [{text,action,auth,__RtPath}] */
export function formatCmd(str: string) {
	return str.split("-").map(t => {
		const [text, action, str3, str4] = t.split(":");
		let auth: string | undefined;
		let __RtPath: string | undefined;
		if (str3 && str4) {
			auth = str3;
			__RtPath = str4;
		} else if (str3) {
			if (str3.startsWith("/")) __RtPath = str3;
			else auth = str3;
		}
		return { text, action, auth, __RtPath };
	});
}

/** ---------- 单元格值格式化 ---------- */

function formatDateCell(row: any, prop: string, comProps: any) {
	let val = row[prop];
	if (isEmpty(val)) return TBDEFAULT;
	if (comProps.type && dateTypeFormat[comProps.type]) val = dayjs(val).format(dateTypeFormat[comProps.type]);
	if (comProps.join && dateJoin[comProps.join]) {
		val = +comProps.join === 1 ? String(val).replaceAll("/", "-") : String(val).replaceAll("-", "/");
	}
	return val;
}

function formatNumCell(row: any, prop: string, comProps: any) {
	let val = row[prop];
	if (val === undefined || isEmpty(val)) return comProps.default ?? TBDEFAULT;
	if (Number(val) === 0) return 0;
	if (isNaN(Number(val))) return val;
	if (comProps.toFixed && comProps.toFixed > 0) val = +Number(val).toFixed(+comProps.toFixed);
	return val ?? comProps.default ?? TBDEFAULT;
}

function formatArrCell(row: any, prop: string, comProps: any) {
	const val = row[prop];
	if (!Array.isArray(val)) return val || TBDEFAULT;
	if (comProps.key) {
		const keys = String(comProps.key).split("+");
		const res = val
			.map(item => keys.map(k => item?.[k] ?? "").join(" ").trim())
			.filter(Boolean)
			.join(comProps.join || ",");
		return res || TBDEFAULT;
	}
	return val;
}

function formatObjCell(row: any, prop: string, comProps: any) {
	const val = row[prop];
	if (!val || typeof val !== "object") return val || TBDEFAULT;
	if (comProps.key) {
		return String(comProps.key)
			.split("+")
			.map((k: string) => k.split(".").reduce((o: any, key: string) => o?.[key], val))
			.join(comProps.join || "");
	}
	return val;
}

/** 按 format 类型格式化单元格 */
export function formatCellValue(row: Record<string, any>, prop: string, comProps: Record<string, any> = {}) {
	switch (comProps.format) {
		case "array":
			return formatArrCell(row, prop, comProps);
		case "object":
			return formatObjCell(row, prop, comProps);
		case "number":
			return formatNumCell(row, prop, comProps);
		case "date":
			return formatDateCell(row, prop, comProps);
		case "datetimerange": {
			const val = row[prop];
			if (!val?.length) return TBDEFAULT;
			const fmt = dateTypeFormat[comProps.type] || dateTypeFormat.ymd;
			return `${dayjs(val[0]).format(fmt)} ~ ${dayjs(val[1]).format(fmt)}`;
		}
		default:
			return row[prop] || TBDEFAULT;
	}
}

/** ---------- 注册表 ---------- */

export class SchemaRegistry<T = any> {
	private map = new Map<string, T>();

	init(coms: { key: string; com: T }[]) {
		coms.forEach(({ key, com }) => this.map.set(key, com));
		return this;
	}

	register(key: string, com: T) {
		this.map.set(key, com);
		return this;
	}

	get(key: string): T | undefined {
		return this.map.get(key);
	}

	keys() {
		return Array.from(this.map.keys());
	}
}

export const colRegistry = new SchemaRegistry<(config?: any) => any>();
export const barRegistry = new SchemaRegistry<any>();

/** ---------- 表格列 --- */

export type SimpleCol =
	| string
	| {
			col: string;
			setComProps?: Record<string, any> | ((row: Record<string, any>) => any);
			tdFn?: (...args: any[]) => any;
			renderHeader?: (...args: any[]) => any;
			[key: string]: any;
	  };

export function useSimpleCols(simpleCols: any[]): any[] {
	const list = (simpleCols || []).map(simpleCol => {
		if (!simpleCol) return simpleCol;

		let col: string;
		let comPropsInfo: any;
		let tdFn: any;
		let renderHeader: any;

		if (typeof simpleCol === "string") {
			col = simpleCol;
		} else if (simpleCol?.col) {
			col = simpleCol.col;
			comPropsInfo = simpleCol.setComProps;
			tdFn = simpleCol.tdFn;
			renderHeader = simpleCol.renderHeader;
		} else {
			return simpleCol;
		}

		const colArr = col.split("|");
		const [label, prop, comTypeStr = "text", thAttrString = ""] = colArr;
		const [comType, ...args] = comTypeStr.split("-");
		const comProps = formatStrToObj(args.join("-"));
		const thAttr = formatStrToObj(thAttrString);

		// 序号列： "idx" / "idx|120"
		if (label.toLowerCase() === "idx") {
			const idxCom = colRegistry.get("idx");
			return idxCom?.({ ...(prop ? formatStrToObj(prop) : {}) });
		}

		// 多选列： "select" / "select|selectable:true"
		if (label.toLowerCase() === "select") {
			const selectCom = colRegistry.get("select");
			const thr = prop ? formatStrToObj(prop) : {};
			return selectCom?.({ ...(getComProps(comPropsInfo) || {}), ...thr });
		}

		// 操作列： "actions|查看:view:auth-编辑:edit"
		if (label.toLowerCase() === "actions") {
			let setComProps = comPropsInfo;
			if (prop) {
				const lastStr = colArr[colArr.length - 1];
				const lastObj = formatStrToObj(lastStr);
				setComProps = { cmds: formatCmd(prop), ...(setComProps || {}), ...lastObj };
			}
			const actionsCom = colRegistry.get("actions");
			return actionsCom?.(getComProps(setComProps));
		}

		if (!prop) return undefined;

		const Component = colRegistry.get(comType) || colRegistry.get("text");
		if (!Component) return undefined;

		if (comType === "text" && comProps.format) {
			comPropsInfo = {
				...(comPropsInfo || {}),
				formatValue: (row: Record<string, any>) => formatCellValue(row, prop, comProps)
			};
		}
		const comAttr: Record<string, any> = {
			label,
			prop,
			tdFn,
			renderHeader,
			...thAttr,
			...comPropsInfo,
			setComProps: comPropsInfo
		};

		// enum 列：字典类型由渲染器参数传入（"状态|status|enum-type:STUDENT_STATUS"）
		if (comType === "enum" && (comProps.type || comProps.dictType)) {
			comAttr.dictType = comProps.type || comProps.dictType;
		}

		if (comAttr.sortable && !comAttr.sortMethod) {
			comAttr.sortMethod = (a: any, b: any) => {
				const aVal = a?.[prop];
				const bVal = b?.[prop];
				const isANum = !isNaN(Number(aVal));
				const isBNum = !isNaN(Number(bVal));
				if (isANum && !isBNum) return -1;
				if (!isANum && isBNum) return 1;
				if (isANum && isBNum) return Number(aVal) - Number(bVal);
				return String(aVal ?? "").localeCompare(String(bVal ?? ""));
			};
		}

		!tdFn && delete comAttr.tdFn;
		return Component(comAttr);
	});

	return list.filter(Boolean);
}

/** ---------- 查询栏 ---------- */

export interface ParsedBar {
	label: string;
	key: string;
	type: string;
	props: Record<string, any>;
	config: Record<string, any>;
}

/** 解析查询条件： "客户名称|customerName|input" 或 { bar, config } */
export function parseBar(simpleBar: string | { bar: string; config?: Record<string, any> }): ParsedBar {
	const item = typeof simpleBar === "string" ? { bar: simpleBar, config: {} } : simpleBar;
	const [label = "", key = "", types = "input"] = (item.bar || "").split("|");
	const [type, ...args] = types.split("-");
	const props = formatStrToObj(args.join("-"));
	const { props: rProps, ...otherConfig } = item.config || {};
	return {
		label,
		key,
		type,
		props: { ...props, ...(rProps || {}) },
		config: otherConfig
	};
}

export function useSimpleBars(
	simpleBars: string | (string | { bar: string; config?: Record<string, any> })[],
	factories: Record<string, (key: string, label: string, config: any) => any>,
	resolveComponent: (type: string) => any
): any[] {
	const bars = typeof simpleBars === "string" ? simpleBars.split(",") : Array.isArray(simpleBars) ? simpleBars : [];
	return bars.map(simpleBar => {
		const { label, key, type, props, config } = parseBar(simpleBar);
		const factory = factories[type];
		if (factory) return factory(key, label, { props, ...config });
		const com = resolveComponent(type);
		return {
			...config,
			type: com || type,
			key,
			label,
			itemValue: config?.itemValue,
			props: { placeholder: `请选择${label}`, ...props }
		};
	});
}
