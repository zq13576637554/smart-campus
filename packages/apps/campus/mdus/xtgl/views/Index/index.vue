<!-- 系统管理：用户 / 角色 -->
<template>
	<div class="page-container system-page">
		<ElTabs v-model="activeTab" class="system-page__tabs">
			<ElTabPane label="用户管理" name="user">
				<NPageBasic
					ref="userPageRef"
					title="系统用户"
					row-key="id"
					:bars="userBars"
					:cols="userCols"
					:api="fetchUser"
					@on-tb-event-watch="onUserAction"
				>
					<template #handle-buttons>
						<ElButton type="primary" @click="openUser()">新增用户</ElButton>
					</template>
				</NPageBasic>
			</ElTabPane>

			<ElTabPane label="角色管理" name="role">
				<NPageBasic
					ref="rolePageRef"
					title="角色列表"
					row-key="id"
					:bars="roleBars"
					:cols="roleCols"
					:api="fetchRole"
					@on-tb-event-watch="onRoleAction"
				>
					<template #handle-buttons>
						<ElButton type="primary" @click="openRole()">新增角色</ElButton>
					</template>
				</NPageBasic>
			</ElTabPane>
		</ElTabs>

		<!-- 用户表单 -->
		<Dialog v-model="userVisible" :title="userData.id ? '编辑用户' : '新增用户'" :loading="submitting" width="620px" @ok="onSaveUser">
			<Form ref="userFormRef" :items="userItems" :form-data="userData" :show-footer="false" label-width="90px" />
		</Dialog>

		<!-- 角色表单 -->
		<Dialog v-model="roleVisible" :title="roleData.id ? '编辑角色' : '新增角色'" :loading="submitting" width="560px" @ok="onSaveRole">
			<Form ref="roleFormRef" :items="roleItems" :form-data="roleData" :show-footer="false" label-width="90px" />
		</Dialog>
	</div>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from "vue";
import { ElButton, ElMessage, ElMessageBox, ElTabPane, ElTabs } from "lmLibs/element-plus";
import NPageBasic from "lmCmpsBiz/NPageBasic";
import Dialog from "lmCmpsBasic/Dialog";
import Form from "lmCmpsBasic/Form";
import type { FormItem } from "lmCmpsBasic/Form/types";
import { Input, Select } from "lmIreposF";
import { useSimpleCols } from "lmHooks/tools/useCols";
import { useSimpleBars } from "lmHooks/tools/useBars";
import {
	$systemRolePagePost,
	$systemRoleSavePost,
	$systemUserDeletePost,
	$systemUserPagePost,
	$systemUserSavePost
} from "lmApisCampus/api/system";
import { sync } from "lmUtils/promise";
import { dayjs } from "lmUtils/time";

const userPageRef = ref();
const rolePageRef = ref();
const userFormRef = ref();
const roleFormRef = ref();
const activeTab = ref("user");
const userVisible = ref(false);
const roleVisible = ref(false);
const submitting = ref(false);

/* ---------------- 用户 ---------------- */
const userBars = computed(() =>
	useSimpleBars([
		"账号|userName|input",
		"姓名|nickName|input",
		{
			bar: "状态|status|enum-type:USER_STATUS",
			config: { itemValue: "" }
		}
	])
);

const userCols = computed(() =>
	useSimpleCols([
		"idx",
		"账号|userName|text|minWidth:120",
		"姓名|nickName|minWidth:110",
		"所属部门|deptName|minWidth:140",
		"角色|roleName|minWidth:120",
		"手机号|phone|minWidth:130",
		{
			col: "状态|status|tag|minWidth:90",
			setComProps: { dictType: "USER_STATUS" }
		},
		"最近登录|lastLogin|minWidth:170",
		{ col: "actions|编辑:edit-删除:delete", setComProps: { fixed: "right", minWidth: 120 } }
	])
);

const userData = reactive<Record<string, any>>({
	id: "",
	userName: "",
	nickName: "",
	phone: "",
	deptName: "",
	roleCode: "TEACHER",
	roleName: "科任教师",
	status: "ENABLED"
});

const ROLE_OPTIONS = [
	{ label: "超级管理员", value: "SUPER_ADMIN" },
	{ label: "校领导", value: "PRINCIPAL" },
	{ label: "班主任", value: "MASTER" },
	{ label: "科任教师", value: "TEACHER" },
	{ label: "宿舍管理员", value: "WARDEN" },
	{ label: "安保人员", value: "GUARD" }
];

const userItems = computed<FormItem[]>(() => [
	Input({ label: "账号", prop: "userName", rules: [{ required: true, message: "请输入账号", trigger: "blur" }] }),
	Input({ label: "姓名", prop: "nickName", rules: [{ required: true, message: "请输入姓名", trigger: "blur" }] }),
	Input({ label: "手机号", prop: "phone", yours: { maxlength: 11 } }),
	Input({ label: "所属部门", prop: "deptName" }),
	Select({
		label: "角色",
		prop: "roleCode",
		options: ROLE_OPTIONS,
		rules: [{ required: true, message: "请选择角色", trigger: "change" }],
		yours: {
			onChange: (val: string) => {
				userData.roleName = ROLE_OPTIONS.find(r => r.value === val)?.label || "";
			}
		}
	}),
	Select({ label: "状态", prop: "status", type: "enumSelect", dictType: "USER_STATUS" })
]);

/* ---------------- 角色 ---------------- */
const roleBars = computed(() =>
	useSimpleBars([
		"角色名称|roleName|input",
		{
			bar: "状态|status|enum-type:USER_STATUS",
			config: { itemValue: "" }
		}
	])
);

const roleCols = computed(() =>
	useSimpleCols([
		"idx",
		"角色名称|roleName|text|minWidth:130",
		"角色编码|roleCode|minWidth:140",
		"描述|description|minWidth:240",
		{ col: "关联用户|userCount|text|minWidth:100-format:number" },
		{ col: "菜单权限|menuCount|text|minWidth:100-format:number" },
		{
			col: "状态|status|tag|minWidth:90",
			setComProps: { dictType: "USER_STATUS" }
		},
		{ col: "actions|编辑:edit", setComProps: { fixed: "right", minWidth: 100 } }
	])
);

const roleData = reactive<Record<string, any>>({
	id: "",
	roleName: "",
	roleCode: "",
	description: "",
	status: "ENABLED"
});

const roleItems = computed<FormItem[]>(() => [
	Input({ label: "角色名称", prop: "roleName", rules: [{ required: true, message: "请输入角色名称", trigger: "blur" }] }),
	Input({ label: "角色编码", prop: "roleCode", rules: [{ required: true, message: "请输入角色编码", trigger: "blur" }] }),
	Input({ label: "描述", prop: "description", type: "textarea", colProps: { span: 24 }, yours: { rows: 3 } }),
	Select({ label: "状态", prop: "status", type: "enumSelect", dictType: "USER_STATUS" })
]);

const fetchUser = (params: Record<string, any>) => $systemUserPagePost(params);
const fetchRole = (params: Record<string, any>) => $systemRolePagePost(params);

const openUser = (row?: any) => {
	Object.assign(userData, {
		id: row?.id || "",
		userName: row?.userName || "",
		nickName: row?.nickName || "",
		phone: row?.phone || "",
		deptName: row?.deptName || "",
		roleCode: row?.roleCode || "TEACHER",
		roleName: row?.roleName || "科任教师",
		status: row?.status || "ENABLED"
	});
	userVisible.value = true;
};

const onSaveUser = async () => {
	const valid = await userFormRef.value?.__validForm?.();
	if (!valid) return;
	submitting.value = true;
	try {
		const [err] = await sync($systemUserSavePost({ ...userData, lastLogin: userData.lastLogin || dayjs().format("YYYY-MM-DD HH:mm:ss") }));
		if (err) return;
		ElMessage.success("保存成功");
		userVisible.value = false;
		userPageRef.value.doSearch(true, "search");
	} finally {
		submitting.value = false;
	}
};

const onUserAction = async ({ key, data }: any) => {
	const row = data?.data?.row;
	if (key === "edit") return openUser(row);
	if (key === "delete") {
		const ok = await ElMessageBox.confirm(`确认删除用户「${row.nickName}」吗？`, "删除确认", { type: "warning" }).catch(() => false);
		if (!ok) return;
		const [err] = await sync($systemUserDeletePost({ id: row.id }));
		if (!err) {
			ElMessage.success("删除成功");
			userPageRef.value.doSearch(true, "search");
		}
	}
};

const openRole = (row?: any) => {
	Object.assign(roleData, {
		id: row?.id || "",
		roleName: row?.roleName || "",
		roleCode: row?.roleCode || "",
		description: row?.description || "",
		status: row?.status || "ENABLED"
	});
	roleVisible.value = true;
};

const onSaveRole = async () => {
	const valid = await roleFormRef.value?.__validForm?.();
	if (!valid) return;
	submitting.value = true;
	try {
		const [err] = await sync($systemRoleSavePost({ ...roleData }));
		if (err) return;
		ElMessage.success("保存成功");
		roleVisible.value = false;
		rolePageRef.value.doSearch(true, "search");
	} finally {
		submitting.value = false;
	}
};

const onRoleAction = ({ key, data }: any) => {
	if (key === "edit") openRole(data?.data?.row);
};
</script>

<style lang="less">
.system-page {
	&__tabs {
		height: 100%;
		display: flex;
		flex-direction: column;

		:deep(.el-tabs__header) {
			margin-bottom: 12px;
			padding: 0 12px;
			background: var(--sc-card);
			border-radius: 8px;
		}

		:deep(.el-tabs__content) {
			flex: 1;
			min-height: 0;
		}

		:deep(.el-tab-pane) {
			height: 100%;
			display: flex;
		}
	}
}
</style>
