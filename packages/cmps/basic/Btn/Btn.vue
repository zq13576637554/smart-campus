<!-- 按钮：内置权限判断 -->
<template>
	<ElButton v-if="visible" v-bind="$attrs" :loading="loading" :type="type" :plain="plain" :size="size">
		<slot />
	</ElButton>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { ElButton } from "lmLibs/element-plus";
import { hasAuth } from "lmUtils/auth";

const props = withDefaults(
	defineProps<{
		/** 权限码，为空则始终显示 */
		auth?: string | string[];
		type?: "" | "primary" | "success" | "warning" | "danger" | "info" | "text";
		plain?: boolean;
		size?: "large" | "default" | "small";
		loading?: boolean;
		/** 强制隐藏 */
		hidden?: boolean;
	}>(),
	{ auth: "", type: "", plain: false, size: "default", loading: false, hidden: false }
);

defineOptions({ inheritAttrs: true });

const visible = computed(() => !props.hidden && hasAuth(props.auth));
</script>
