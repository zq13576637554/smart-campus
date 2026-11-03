<!-- 操作按钮组：超过 maxBtnNum 时折叠到「更多」 -->
<template>
	<div class="action-group">
		<ElButton
			v-for="cmd in visibleCmds"
			:key="cmd.action"
			:link="link"
			:type="(cmd.type as any) || (cmd.action === 'delete' ? 'danger' : 'primary')"
			size="small"
			@click.stop="$emit('click', cmd)"
		>
			{{ cmd.text }}
		</ElButton>
		<ElDropdown v-if="moreCmds.length" trigger="click" @command="onCommand">
			<ElButton link type="primary" size="small">更多<ElIcon><ArrowDown /></ElIcon></ElButton>
			<template #dropdown>
				<ElDropdownMenu>
					<ElDropdownItem v-for="cmd in moreCmds" :key="cmd.action" :command="cmd">
						{{ cmd.text }}
					</ElDropdownItem>
				</ElDropdownMenu>
			</template>
		</ElDropdown>
	</div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { ArrowDown } from "@element-plus/icons-vue";
import { ElButton, ElDropdown, ElDropdownItem, ElDropdownMenu, ElIcon } from "lmLibs/element-plus";
import { hasAuth } from "lmUtils/auth";

interface Cmd {
	text: string;
	action: string;
	auth?: string;
	type?: string;
	viewFn?: (row: any) => boolean;
	[key: string]: any;
}

const props = withDefaults(
	defineProps<{
		cmds?: Cmd[];
		maxBtnNum?: number;
		link?: boolean;
	}>(),
	{ cmds: () => [], maxBtnNum: 3, link: true }
);

const emit = defineEmits<{ (e: "click", cmd: Cmd): void }>();

/** 权限过滤：指令无法作用于动态列表，这里在渲染前过滤 */
const authCmds = computed(() => (props.cmds || []).filter(c => hasAuth(c.auth)));
const visibleCmds = computed(() => authCmds.value.slice(0, props.maxBtnNum));
const moreCmds = computed(() => authCmds.value.slice(props.maxBtnNum));

const onCommand = (cmd: Cmd) => emit("click", cmd);
</script>

<style lang="less">
.action-group {
	display: flex;
	align-items: center;
	flex-wrap: nowrap;
	gap: 4px;

	.el-button {
		padding: 0;
		font-size: 13px;
	}
}
</style>
