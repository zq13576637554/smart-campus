/**
 * @file 查询栏简化配置
 * @desc "客户名称|customerName|input" / "状态|status|enum-type:STUDENT_STATUS"
 */
import RemoteSelect from "lmCmpsBasic/RemoteSelect";
import SelectTwo from "lmCmpsBasic/SelectTwo";
import { ElDatePicker, ElInput, ElTreeSelect } from "lmLibs/element-plus";
import { formatStrToObj, useSimpleBars as parseBars } from "lmLibs/schema";

export const barComponents: Record<string, any> = {
	input: ElInput,
	datePicker: ElDatePicker,
	remoteSelect: RemoteSelect,
	selectTwo: SelectTwo,
	treeSelect: ElTreeSelect
};

/** 初始化/追加查询栏组件 */
export function initBarComponent(coms: { key: string; com: any }[]) {
	coms.forEach(({ key, com }) => (barComponents[key] = com));
}

/** 查询组件工厂：返回 { type, key, label, itemValue, props } */
const factories: Record<string, (key: string, label: string, config: any) => any> = {
	input: (key, label, config) => ({
		type: barComponents.input,
		key,
		label,
		itemValue: config?.itemValue,
		props: { placeholder: `请输入${label}`, maxlength: 50, clearable: true, ...(config?.props || {}) }
	}),
	date: (key, label, config) => ({
		type: barComponents.datePicker,
		key,
		label,
		itemValue: config?.itemValue,
		props: {
			type: "datetimerange",
			editable: false,
			format: "YYYY-MM-DD HH:mm",
			valueFormat: "YYYY-MM-DD HH:mm:ss",
			rangeSeparator: "-",
			startPlaceholder: "开始时间",
			endPlaceholder: "结束时间",
			...formatStrToObj(config?.barTypeExt),
			...(config?.props || {})
		}
	}),
	enum: (key, label, config) => ({
		type: "enumSelect",
		key,
		label,
		itemValue: config?.itemValue,
		props: { placeholder: `请选择${label}`, clearable: true, ...(config?.props || {}) }
	}),
	select: (key, label, config) => ({
		type: barComponents.selectTwo,
		key,
		label,
		itemValue: config?.itemValue,
		props: { placeholder: `请选择${label}`, clearable: true, filterable: true, ...(config?.props || {}) }
	}),
	remoteSelect: (key, label, config) => ({
		type: barComponents.remoteSelect,
		key,
		label,
		itemValue: config?.itemValue,
		props: { placeholder: `请选择${label}`, clearable: true, filterable: true, ...(config?.props || {}) }
	}),
	treeSelect: (key, label, config) => ({
		type: barComponents.treeSelect,
		key,
		label,
		itemValue: config?.itemValue,
		props: { placeholder: `请选择${label}`, clearable: true, filterable: true, ...(config?.props || {}) }
	}),
	timeSwitch: (key, label, config) => ({
		type: "timeSwitch",
		key,
		label,
		itemValue: config?.itemValue,
		props: { placeholder: `请选择${label}`, ...(config?.props || {}) }
	})
};

/** 简化查询栏配置 */
export function useSimpleBars(list: any[]) {
	return parseBars(list, factories, type => barComponents[type]);
}

export { formatStrToObj };
