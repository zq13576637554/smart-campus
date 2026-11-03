<!-- 普通下拉（options / data 两种数据源） -->
<template>
	<ElSelect
		:model-value="modelValue"
		:placeholder="placeholder || '请选择'"
		:clearable="clearable"
		:filterable="filterable"
		:multiple="multiple"
		:disabled="disabled"
		style="width: 100%"
		v-bind="$attrs"
		@update:model-value="val => $emit('update:modelValue', val)"
	>
		<ElOption v-for="opt in list" :key="opt.value" :label="opt.label" :value="opt.value" />
	</ElSelect>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { ElOption, ElSelect } from "lmLibs/element-plus";

const props = withDefaults(
	defineProps<{
		modelValue?: any;
		options?: { label: string; value: any }[];
		data?: { label: string; value: any }[];
		placeholder?: string;
		clearable?: boolean;
		filterable?: boolean;
		multiple?: boolean;
		disabled?: boolean;
	}>(),
	{ modelValue: "", options: () => [], data: () => [], placeholder: "", clearable: true, filterable: true, multiple: false, disabled: false }
);

defineEmits<{ (e: "update:modelValue", val: any): void }>();

const list = computed(() => props.options?.length ? props.options : props.data || []);
</script>
