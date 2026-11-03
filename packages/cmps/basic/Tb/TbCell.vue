<script lang="ts">
import { defineComponent, h } from "vue";

/**
 * 单元格渲染器
 * @desc 统一把 tdFn 的调用收敛到一个组件里，保证列渲染器可复用
 */
export default defineComponent({
	name: "TbCell",
	props: {
		col: { type: Object, required: true },
		row: { type: Object, required: true },
		index: { type: Number, default: 0 },
		tb: { type: Object, default: () => ({}) },
		emitEvent: { type: Function, default: () => {} },
		dictLabel: { type: Function, default: undefined },
		dictType: { type: Function, default: undefined }
	},
	setup(props) {
		return () => {
			const { col, row, index, tb, emitEvent, dictLabel, dictType } = props;
			const value = row?.[col.prop];
			if (typeof col.tdFn === "function") {
				return col.tdFn(h, {
					data: { row, $index: index, column: col },
					col,
					emit: emitEvent,
					tb,
					dictLabel,
					dictType
				});
			}
			if (typeof col.formatValue === "function") {
				return h("span", String(col.formatValue(row) ?? "--"));
			}
			if (value === 0) return h("span", "0");
			return h("span", value === undefined || value === null || value === "" ? "--" : String(value));
		};
	}
});
</script>
