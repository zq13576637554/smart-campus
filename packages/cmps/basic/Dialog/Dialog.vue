<!-- 弹窗 -->
<template>
	<ElDialog
		:model-value="modelValue"
		:title="title"
		:width="width"
		:close-on-click-modal="false"
		:destroy-on-close="destroyOnClose"
		append-to-body
		class="n-dialog"
		@update:model-value="val => $emit('update:modelValue', val)"
		@closed="$emit('closed')"
	>
		<div class="n-dialog__body">
			<slot></slot>
		</div>
		<template v-if="showFooter" #footer>
			<slot name="footer">
				<ElButton @click="onCancel">{{ cancelText }}</ElButton>
				<ElButton type="primary" :loading="loading" @click="$emit('ok')">{{ okText }}</ElButton>
			</slot>
		</template>
	</ElDialog>
</template>

<script setup lang="ts">
import { ElButton, ElDialog } from "lmLibs/element-plus";

withDefaults(
	defineProps<{
		modelValue: boolean;
		title?: string;
		width?: string;
		loading?: boolean;
		showFooter?: boolean;
		okText?: string;
		cancelText?: string;
		destroyOnClose?: boolean;
	}>(),
	{
		title: "",
		width: "640px",
		loading: false,
		showFooter: true,
		okText: "确定",
		cancelText: "取消",
		destroyOnClose: true
	}
);

const emit = defineEmits<{
	(e: "update:modelValue", val: boolean): void;
	(e: "ok"): void;
	(e: "cancel"): void;
	(e: "closed"): void;
}>();

const onCancel = () => {
	emit("cancel");
	emit("update:modelValue", false);
};
</script>

<style lang="less">
.n-dialog {
	border-radius: 10px;

	&__body {
		max-height: 66vh;
		overflow: auto;
		padding-right: 4px;
	}
}
</style>
