<template>
	<ElConfigProvider :locale="zhCn">
		<BizApp :logo-title="logoTitle" :is-open-tag-views="true" />
	</ElConfigProvider>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { ElConfigProvider } from "lmLibs/element-plus";
import { zhCn } from "lmLibs/element-plus";
import BizApp from "lmCmpsLayout/BizApp";
import { useAppStore } from "lmStore/modules/app";

const appStore = useAppStore();
const logoTitle = computed(() => appStore.getTenantData?.title || "智慧校园");
</script>
