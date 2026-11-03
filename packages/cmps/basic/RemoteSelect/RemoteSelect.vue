<!-- 远程搜索下拉 -->
<template>
	<ElSelect
		:model-value="modelValue"
		:placeholder="placeholder || '请输入关键字搜索'"
		:clearable="clearable"
		:disabled="disabled"
		:filterable="true"
		:remote="true"
		:remote-method="onSearch"
		:loading="loading"
		style="width: 100%"
		@update:model-value="onChange"
		@visible-change="onVisibleChange"
	>
		<ElOption v-for="opt in options" :key="opt.value" :label="opt.label" :value="opt.value" />
	</ElSelect>
</template>

<script setup lang="ts">
import { ref, watch } from "vue";
import { ElOption, ElSelect } from "lmLibs/element-plus";

const props = withDefaults(
	defineProps<{
		modelValue?: any;
		/** 远程接口：(params) => Promise<{content|records}> */
		service?: (params: Record<string, any>) => Promise<any>;
		/** 默认查询参数 */
		defaultParams?: Record<string, any>;
		/** 关键字字段名 */
		searchKey?: string;
		/** 返回字段映射 */
		propMap?: { label: string; value: string };
		/** 初始化是否立即拉取 */
		init?: boolean;
		limitCount?: number;
		placeholder?: string;
		clearable?: boolean;
		disabled?: boolean;
	}>(),
	{
		modelValue: "",
		service: undefined,
		defaultParams: () => ({}),
		searchKey: "keyword",
		propMap: () => ({ label: "label", value: "value" }),
		init: true,
		limitCount: 50,
		placeholder: "",
		clearable: true,
		disabled: false
	}
);

const emit = defineEmits<{ (e: "update:modelValue", val: any): void }>();

const options = ref<any[]>([]);
const loading = ref(false);
let loadedOnce = false;

const query = async (keyword = "") => {
	if (!props.service) return;
	loading.value = true;
	try {
		const res = await props.service({ ...props.defaultParams, [props.searchKey]: keyword });
		const list = Array.isArray(res) ? res : res?.content || res?.records || res?.list || [];
		options.value = list.slice(0, props.limitCount).map((item: any) => ({
			label: item[props.propMap.label],
			value: item[props.propMap.value],
			raw: item
		}));
		loadedOnce = true;
	} catch {
		options.value = [];
	} finally {
		loading.value = false;
	}
};

/** 防抖搜索 */
let timer: any;
const onSearch = (keyword: string) => {
	clearTimeout(timer);
	timer = setTimeout(() => query(keyword), 250);
};

const onVisibleChange = (visible: boolean) => {
	if (visible && !loadedOnce && props.init) query("");
};

const onChange = (val: any) => emit("update:modelValue", val);

watch(
	() => props.init,
	val => {
		if (val) query("");
	},
	{ immediate: true }
);
</script>
