/** 表单项配置 */
export interface FormItem {
	label?: string;
	prop: string;
	/** 渲染类型：input | textarea | number | select | enumSelect | radios | switch | date | daterange | datetime | upload | remoteSelect | treeSelect | cascader | text | title | gap | slot */
	type?: string;
	/** 栅格占位 */
	colProps?: { span?: number; offset?: number };
	/** 校验规则 */
	rules?: any[];
	/** 透传给组件的属性 */
	yours?: Record<string, any>;
	/** 下拉/单选选项 */
	options?: { label: string; value: any; [k: string]: any }[];
	/** 字典类型（enumSelect 使用） */
	dictType?: string;
	/** 表单行 class */
	formClass?: string;
	/** 字段说明 */
	tips?: string;
	/** 是否隐藏 */
	hidden?: boolean | ((form: Record<string, any>) => boolean);
	/** 是否禁用 */
	disabled?: boolean | ((form: Record<string, any>) => boolean);
	/** 默认值 */
	defaultValue?: any;
	/** 自定义插槽名 */
	slot?: string;
	/** 详情模式下的自定义格式化 */
	detailFormat?: (val: any, form: Record<string, any>) => any;
	/** 详情模式独占（编辑时隐藏） */
	detailOnly?: boolean;
	[key: string]: any;
}

export interface FormProps {
	/** 表单项 */
	items?: FormItem[];
	/** 表单数据 */
	formData?: Record<string, any>;
	labelPosition?: "left" | "right" | "top";
	labelWidth?: string;
	/** full：整页；fixed：固定标签宽度 */
	mode?: "full" | "fixed";
	/** 是否独立表单页（显示底部操作栏） */
	isFormPage?: boolean;
	/** 只读详情模式 */
	enableDetailMode?: boolean;
	/** 最大列数（默认按 colProps.span 计算 24 栅格） */
	disabled?: boolean;
	loading?: boolean;
	showFooter?: boolean;
	okText?: string;
	cancelText?: string;
}
