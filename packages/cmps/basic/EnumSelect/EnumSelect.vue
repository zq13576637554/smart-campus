<!-- 字典下拉：根据 dictType 自动加载选项 -->
<template>
	<ElSelect
		:model-value="modelValue"
		:disabled="disabled"
		:placeholder="placeholder || `请选择${label}`"
		:clearable="clearable"
		:multiple="multiple"
		:filterable="filterable"
		style="width: 100%"
		v-bind="$attrs"
		@update:model-value="val => $emit('update:modelValue', val)"
	>
		<ElOption v-for="opt in options" :key="opt.value" :label="opt.label" :value="opt.value">
			<span class="enum-select__option">
				<span class="enum-select__dot" :class="`is-${opt.type || 'info'}`"></span>
				{{ opt.label }}
			</span>
		</ElOption>
	</ElSelect>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { ElOption, ElSelect } from "lmLibs/element-plus";
import { useDict } from "lmHooks/tools/useDict";
import type { DictItem } from "lmStore/modules/dict";

const props = withDefaults(
	defineProps<{
		modelValue?: any;
		dictType?: string;
		label?: string;
		placeholder?: string;
		clearable?: boolean;
		disabled?: boolean;
		multiple?: boolean;
		filterable?: boolean;
		/** 直接传入选项（优先于字典） */
		data?: DictItem[];
	}>(),
	{ modelValue: "", dictType: "", label: "", placeholder: "", clearable: true, disabled: false, multiple: false, filterable: true, data: undefined }
);

defineEmits<{ (e: "update:modelValue", val: any): void }>();

const { dictOptions } = useDict();
const options = computed<DictItem[]>(() => props.data || (props.dictType ? dictOptions(props.dictType) : []));
</script>

<style lang="less">
.enum-select {
	&__option {
		display: inline-flex;
		align-items: center;
		gap: 6px;
	}

	&__dot {
		width: 6px;
		height: 6px;
		border-radius: 50%;
		background: #86909c;

		&.is-success {
			background: #00b42a;
		}

		&.is-warning {
			background: #ff7d00;
		}

		&.is-danger {
			background: #f53f3f;
		}

		&.is-primary {
			background: #165dff;
		}
	}
}
</style>
