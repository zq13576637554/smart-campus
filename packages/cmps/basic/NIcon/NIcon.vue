<!-- 图标：按名称映射 element-plus 图标，避免各页面重复 import -->
<template>
	<ElIcon v-if="comp" :size="size" :color="color">
		<component :is="comp" />
	</ElIcon>
</template>

<script setup lang="ts">
import { computed } from "vue";
import {
	Avatar,
	Bell,
	Calendar,
	Clock,
	CreditCard,
	DataAnalysis,
	Document,
	Files,
	Grid,
	HomeFilled,
	House,
	Lock,
	MagicStick,
	Medal,
	Menu as MenuIcon,
	Notebook,
	School,
	Setting,
	User,
	UserFilled
} from "@element-plus/icons-vue";
import { ElIcon } from "lmLibs/element-plus";

const props = withDefaults(defineProps<{ name?: string; size?: number | string; color?: string }>(), {
	name: "grid",
	size: 16,
	color: ""
});

const ICON_MAP: Record<string, any> = {
	home: HomeFilled,
	student: User,
	teacher: UserFilled,
	class: School,
	course: Notebook,
	schedule: Calendar,
	attendance: Clock,
	score: Medal,
	dorm: House,
	card: CreditCard,
	access: Lock,
	ai: MagicStick,
	system: Setting,
	notice: Bell,
	chart: DataAnalysis,
	menu: MenuIcon,
	grid: Grid,
	document: Document,
	files: Files,
	avatar: Avatar
};

const comp = computed(() => ICON_MAP[props.name] || ICON_MAP.grid);
</script>
