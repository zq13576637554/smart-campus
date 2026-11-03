/** 多选列 */
export default function select(config: Record<string, any> = {}) {
	return {
		label: "选择",
		prop: "__select__",
		type: "selection",
		width: 48,
		align: "center",
		headerAlign: "center",
		...config
	};
}
