<!-- 间距 -->
<template>
	<div class="n-gap" :style="{ height: `${height}px`, background: background }"></div>
</template>

<script setup lang="ts">
withDefaults(defineProps<{ height?: number; background?: string }>(), { height: 12, background: "transparent" });
</script>
