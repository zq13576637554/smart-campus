<!-- 标签 -->
<template>
	<span :class="cls">
		<slot />
	</span>
</template>

<script setup lang="ts">
import { computed } from "vue";

const props = withDefaults(
	defineProps<{
		/** primary | success | warning | danger | info */
		type?: string;
		/** 实心样式 */
		fill?: boolean;
		size?: "default" | "small" | "large";
		round?: boolean;
	}>(),
	{ type: "info", fill: false, size: "small", round: true }
);

const cls = computed(() => [
	"n-tag",
	`n-tag--${props.type}`,
	props.fill ? "is-fill" : "is-plain",
	props.size === "small" ? "is-small" : "",
	props.round ? "is-round" : ""
]);
</script>

<style lang="less">
.n-tag {
	display: inline-flex;
	align-items: center;
	height: 22px;
	padding: 0 8px;
	font-size: 12px;
	line-height: 1;
	white-space: nowrap;
	border-radius: 4px;
	border: 1px solid transparent;

	&.is-round {
		border-radius: 11px;
	}

	&--primary {
		color: #165dff;
		background: #e8f3ff;
		border-color: var(--sc-primary-border);
	}

	&--success {
		color: #00b42a;
		background: #e8ffea;
		border-color: #aff0b5;
	}

	&--warning {
		color: #ff7d00;
		background: var(--sc-warning-soft);
		border-color: #ffcf8b;
	}

	&--danger {
		color: #f53f3f;
		background: #ffece8;
		border-color: #fbaca3;
	}

	&--info {
		color: #4e5969;
		background: #f2f3f5;
		border-color: #e5e6eb;
	}

	&.is-fill {
		border-color: transparent;
	}
}
</style>
