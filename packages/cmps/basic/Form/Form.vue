<!-- 表单：配置驱动，支持整页/弹窗/详情三种形态 -->
<template>
	<div class="n-form" :class="{ 'is-detail': enableDetailMode }">
		<ElForm
			ref="formRef"
			:model="form"
			:label-position="labelPosition"
			:label-width="computedLabelWidth"
			:disabled="disabled"
			:rules="rules"
			:validate-on-rule-change="false"
			@submit.prevent
		>
			<ElRow :gutter="gutter">
				<FormItem
					v-for="(item, index) in visibleItems"
					:key="item.prop || index"
					:item="item"
					:form="form"
					:disabled="disabled"
					:enable-detail-mode="enableDetailMode"
					:label-width="computedLabelWidth"
					@change="onChange"
				>
					<template v-for="name in slotNames" #[name]="scope">
						<slot :name="name" v-bind="scope"></slot>
					</template>
				</FormItem>
			</ElRow>
		</ElForm>

		<div v-if="showFooter" class="n-form__footer">
			<ElButton @click="onReset">{{ cancelText }}</ElButton>
			<ElButton type="primary" :loading="loading" @click="onOk">{{ okText }}</ElButton>
		</div>
	</div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, reactive, ref, watch } from "vue";
import { ElButton, ElForm, ElRow } from "lmLibs/element-plus";
import type { FormInstance, FormRules } from "lmLibs/element-plus";
import FormItem from "./FormItem.vue";
import type { FormItem as FormItemType } from "./types";

const props = withDefaults(
	defineProps<{
		items?: FormItemType[];
		formData?: Record<string, any>;
		labelPosition?: "left" | "right" | "top";
		labelWidth?: string;
		mode?: "full" | "fixed";
		isFormPage?: boolean;
		enableDetailMode?: boolean;
		disabled?: boolean;
		loading?: boolean;
		showFooter?: boolean;
		okText?: string;
		cancelText?: string;
		gutter?: number;
	}>(),
	{
		items: () => [],
		formData: undefined,
		labelPosition: "right",
		labelWidth: "",
		mode: "fixed",
		isFormPage: false,
		enableDetailMode: false,
		disabled: false,
		loading: false,
		showFooter: false,
		okText: "保存",
		cancelText: "取消",
		gutter: 20
	}
);

const emit = defineEmits<{
	(e: "ok", data: Record<string, any>): void;
	(e: "reset"): void;
	(e: "error", errors: any): void;
	(e: "change", payload: { prop: string; value: any }): void;
	(e: "register", instance: any): void;
	(e: "update:formData", data: Record<string, any>): void;
}>();

const formRef = ref<FormInstance>();
const innerForm = reactive<Record<string, any>>({});

const form = computed<Record<string, any>>(() => props.formData || innerForm);
const computedLabelWidth = computed(() => props.labelWidth || (props.mode === "full" ? "auto" : "110px"));

/** 动态插槽名 */
const slotNames = computed(() => props.items.filter(i => i.type === "slot").map(i => i.slot || i.prop));

/** 隐藏项 */
const visibleItems = computed(() =>
	props.items.filter(item => {
		if (props.enableDetailMode && item.type === "gap") return false;
		if (item.detailOnly && !props.enableDetailMode) return false;
		const { hidden } = item;
		return typeof hidden === "function" ? !hidden(form.value) : !hidden;
	})
);

/** 汇总 rules（ElForm 上也可以直接用 ElFormItem 的 rules） */
const rules = computed<FormRules>(() => {
	const map: FormRules = {};
	props.items.forEach(item => {
		if (item.rules?.length && item.prop) map[item.prop] = item.rules;
	});
	return map;
});

const onChange = (payload: { prop: string; value: any }) => {
	form.value[payload.prop] = payload.value;
	emit("change", payload);
	emit("update:formData", form.value);
};

const onOk = async () => {
	const valid = await __validForm();
	if (!valid) return;
	emit("ok", form.value);
};

const __validForm = async (): Promise<boolean> => {
	if (!formRef.value) return true;
	try {
		await formRef.value.validate();
		return true;
	} catch (errors) {
		emit("error", errors);
		return false;
	}
};

const __resetFields = () => {
	formRef.value?.resetFields();
	applyDefaultValues();
	emit("reset");
};

const __setProps = (patch: Record<string, any>) => {
	Object.assign(innerForm, patch);
};

const getFormData = () => form.value;

/** 应用字段默认值 */
const applyDefaultValues = () => {
	props.items.forEach(item => {
		if (item.defaultValue !== undefined && item.prop && (form.value[item.prop] === undefined || form.value[item.prop] === "")) {
			form.value[item.prop] = typeof item.defaultValue === "function" ? item.defaultValue() : item.defaultValue;
		}
	});
};

onMounted(() => {
	applyDefaultValues();
	emit("register", { formRef, __validForm, __resetFields, __setProps, getFormData });
	emit("update:formData", form.value);
});

watch(
	() => props.formData,
	val => {
		if (val) Object.assign(innerForm, val);
	},
	{ deep: false }
);

defineExpose({ __validForm, __resetFields, __setProps, getFormData, formRef });
</script>

<style lang="less">
@import "./index.less";
</style>
