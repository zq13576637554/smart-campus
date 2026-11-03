<!-- 空状态 -->
<template>
	<div class="n-empty" :style="{ padding: `${padding}px 0` }">
		<svg class="n-empty__img" viewBox="0 0 120 90" width="120" height="90">
			<ellipse cx="60" cy="78" rx="42" ry="7" fill="#f2f3f5" />
			<rect x="30" y="24" width="60" height="42" rx="6" fill="#fff" stroke="#e5e6eb" stroke-width="2" />
			<path d="M30 40h60" stroke="#e5e6eb" stroke-width="2" />
			<circle cx="40" cy="32" r="2.5" fill="#c9cdd4" />
			<circle cx="48" cy="32" r="2.5" fill="#c9cdd4" />
			<path d="M48 56h24" stroke="#c9cdd4" stroke-width="3" stroke-linecap="round" />
			<path d="M54 64h12" stroke="#e5e6eb" stroke-width="3" stroke-linecap="round" />
		</svg>
		<p class="n-empty__text">{{ text }}</p>
		<slot></slot>
	</div>
</template>

<script setup lang="ts">
withDefaults(defineProps<{ text?: string; padding?: number }>(), { text: "暂无数据", padding: 40 });
</script>

<style lang="less">
.n-empty {
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	color: #86909c;

	&__img {
		opacity: 0.9;
	}

	&__text {
		margin: 8px 0 12px;
		font-size: 13px;
	}
}
</style>
