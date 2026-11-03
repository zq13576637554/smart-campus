/**
 * @file 表单字段工厂
 * @desc 与 rs.ict-saas 一致：每个字段是一个「工厂函数」，返回可序列化的 FormItem 配置。
 *       Form 组件根据 type 渲染具体组件，业务页面只关心 label / prop / rules / yours。
 */
import type { FormItem } from "lmCmpsBasic/Form/types";

interface FactoryConfig extends Partial<FormItem> {
	label?: string;
	prop?: string;
	/** 透传给底层组件的属性 */
	yours?: Record<string, any>;
	[key: string]: any;
}

/** 生成字段配置骨架 */
function create(type: string, defaults: Partial<FormItem> = {}) {
	return (config: FactoryConfig = {}): FormItem => {
		const { yours = {}, colProps, rules, ...rest } = config;
		return {
			type,
			label: config.label || "",
			prop: config.prop || "",
			colProps: { span: 12, ...(colProps || {}) },
			rules: rules || [],
			yours,
			...defaults,
			...rest,
			// 保证 yours 合并默认值
			...{}
		} as FormItem;
	};
}

/** 单行文本 */
export const Input = create("input", {});
/** 多行文本 */
export const Text = create("textarea", {});
/** 数字输入 */
export const Number_ = create("number", {});
/** 下拉选择 */
export const Select = create("select", {});
/** 枚举/字典下拉 */
export const EnumSelect = create("enumSelect", {});
/** 单选框 */
export const Radios = create("radios", {});
/** 开关 */
export const Switch = create("switch", {});
/** 日期 */
export const Date = create("date", {});
/** 日期区间 */
export const DateRange = create("daterange", {});
/** 上传 */
export const Upload = create("upload", {});
/** 远程搜索选择 */
export const RemoteSelect = create("remoteSelect", {});
/** 树选择 */
export const TreeSelect = create("treeSelect", {});
/** 纯展示文本 */
export const Text2 = create("text", {});
/** 分组标题 */
export const RenderTitle = create("title", {});
/** 占位间隔 */
export const RenderGap = create("gap", {});
/** 自定义插槽 */
export const Slot = create("slot", {});
/** 级联选择 */
export const Cascader = create("cascader", {});

export default {
	Input,
	Text,
	Number_,
	Select,
	EnumSelect,
	Radios,
	Switch,
	Date,
	DateRange,
	Upload,
	RemoteSelect,
	TreeSelect,
	Text2,
	RenderTitle,
	RenderGap,
	Slot,
	Cascader
};
