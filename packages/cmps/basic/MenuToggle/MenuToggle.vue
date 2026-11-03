<!-- 侧边栏折叠按钮 -->
<template>
	<div class="menu-toggle" @click="toggle">
		<ElIcon :size="18">
			<component :is="isCollapse ? Expand : Fold" />
		</ElIcon>
	</div>
</template>

<script setup lang="ts">
import { Expand, Fold } from "@element-plus/icons-vue";
import { ElIcon } from "lmLibs/element-plus";

defineProps<{ isCollapse?: boolean }>();
const emit = defineEmits<{ (e: "toggle"): void }>();

const toggle = () => emit("toggle");
</script>

<style lang="less">
.menu-toggle {
	display: flex;
	align-items: center;
	justify-content: center;
	width: 34px;
	height: 34px;
	border-radius: 6px;
	color: #4e5969;
	cursor: pointer;
	transition: background 0.2s;

	&:hover {
		background: #f2f3f5;
	}
}
</style>
