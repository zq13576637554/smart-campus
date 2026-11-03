<!-- 个人中心 -->
<template>
	<div class="profile-page">
		<!-- 左：名片 -->
		<aside class="profile-page__card">
			<div class="profile-page__avatar">{{ (profile.nickName || "管").slice(0, 1) }}</div>
			<div class="profile-page__name">{{ profile.nickName || "--" }}</div>
			<div class="profile-page__post">{{ profile.postName || "—" }} · {{ profile.deptName || "—" }}</div>
			<div class="profile-page__tags">
				<NTag type="primary" fill>{{ profile.roleCode || "—" }}</NTag>
				<NTag :type="profile.superAdmin ? 'danger' : 'info'" fill>{{ profile.superAdmin ? "超级管理员" : "普通用户" }}</NTag>
			</div>

			<div class="profile-page__meta">
				<div class="profile-page__meta-item">
					<span>登录账号</span>
					<strong>{{ profile.userName || "--" }}</strong>
				</div>
				<div class="profile-page__meta-item">
					<span>手机号</span>
					<strong>{{ profile.phone || "--" }}</strong>
				</div>
				<div class="profile-page__meta-item">
					<span>邮箱</span>
					<strong>{{ profile.email || "--" }}</strong>
				</div>
				<div class="profile-page__meta-item">
					<span>权限码</span>
					<strong>{{ authCount }} 项</strong>
				</div>
			</div>
		</aside>

		<!-- 右：设置 -->
		<section class="profile-page__main">
			<ElTabs v-model="activeTab">
				<ElTabPane label="基本资料" name="base">
					<Form ref="baseFormRef" :items="baseItems" :form-data="baseData" :show-footer="false" label-width="90px" />
					<div class="profile-page__footer">
						<ElButton type="primary" :loading="saving" @click="saveBase">保存资料</ElButton>
					</div>
				</ElTabPane>

				<ElTabPane label="修改密码" name="password">
					<Form ref="pwdFormRef" :items="pwdItems" :form-data="pwdData" :show-footer="false" label-width="90px" />
					<div class="profile-page__footer">
						<ElButton type="primary" :loading="saving" @click="savePassword">修改密码</ElButton>
					</div>
				</ElTabPane>

				<ElTabPane label="偏好设置" name="pref">
					<Form :items="prefItems" :form-data="prefData" :show-footer="false" label-width="110px" />
					<div class="profile-page__footer">
						<ElButton type="primary" @click="savePref">保存偏好</ElButton>
					</div>
				</ElTabPane>
			</ElTabs>
		</section>
	</div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from "vue";
import { ElButton, ElMessage, ElTabPane, ElTabs } from "lmLibs/element-plus";
import NTag from "lmCmpsBasic/NTag";
import Form from "lmCmpsBasic/Form";
import type { FormItem } from "lmCmpsBasic/Form/types";
import { Input, Select, Radios } from "lmIreposF";
import { $passwordPost, $profileGet, $profileSavePost } from "lmApisCampus/api/system";
import { sync } from "lmUtils/promise";
import { useAppStore } from "lmStore/modules/app";
import { getAuthCodes } from "lmUtils/auth";

const appStore = useAppStore();

const activeTab = ref("base");
const profile = ref<Record<string, any>>({});
const saving = ref(false);
const baseFormRef = ref();
const pwdFormRef = ref();

const authCount = computed(() => getAuthCodes().length);

const baseData = reactive<Record<string, any>>({ nickName: "", phone: "", email: "", deptName: "" });
const pwdData = reactive<Record<string, any>>({ oldPassword: "", newPassword: "", confirmPassword: "" });
const prefData = reactive<Record<string, any>>(
	JSON.parse(localStorage.getItem("CAMPUS_PREF") || '{"density":"default","defaultPage":"/home/","theme":"light"}')
);

const baseItems: FormItem[] = [
	Input({ label: "昵称", prop: "nickName", rules: [{ required: true, message: "请输入昵称", trigger: "blur" }] }),
	Input({ label: "手机号", prop: "phone", yours: { maxlength: 11 } }),
	Input({ label: "邮箱", prop: "email" }),
	Input({ label: "所属部门", prop: "deptName" })
];

const pwdItems: FormItem[] = [
	Input({ label: "原密码", prop: "oldPassword", type: "input", rules: [{ required: true, message: "请输入原密码", trigger: "blur" }], yours: { type: "password", showPassword: true, placeholder: "演示环境原密码为 123456" } }),
	Input({ label: "新密码", prop: "newPassword", rules: [{ required: true, message: "请输入新密码", trigger: "blur" }, { min: 6, message: "至少 6 位", trigger: "blur" }], yours: { type: "password", showPassword: true } }),
	Input({ label: "确认密码", prop: "confirmPassword", rules: [{ required: true, message: "请再次输入新密码", trigger: "blur" }], yours: { type: "password", showPassword: true } })
];

const prefItems: FormItem[] = [
	Select({
		label: "表格密度",
		prop: "density",
		options: [
			{ label: "标准", value: "default" },
			{ label: "紧凑", value: "compact" },
			{ label: "宽松", value: "loose" }
		]
	}),
	Select({
		label: "默认首页",
		prop: "defaultPage",
		options: [
			{ label: "首页驾驶舱", value: "/home/" },
			{ label: "学生档案", value: "/xsgl/" },
			{ label: "数据大屏", value: "/daping/" }
		]
	}),
	Radios({
		label: "主题",
		prop: "theme",
		options: [
			{ label: "浅色", value: "light" },
			{ label: "深色", value: "dark" }
		]
	})
];

const load = async () => {
	const [err, res] = await sync($profileGet());
	if (!err && res) {
		profile.value = res as any;
		Object.assign(baseData, {
			nickName: (res as any).nickName,
			phone: (res as any).phone,
			email: (res as any).email,
			deptName: (res as any).deptName
		});
	}
};

const saveBase = async () => {
	const valid = await baseFormRef.value?.__validForm?.();
	if (!valid) return;
	saving.value = true;
	try {
		const [err] = await sync($profileSavePost({ ...baseData, userName: profile.value.userName }));
		if (err) return;
		ElMessage.success("资料已保存");
		appStore.setUserInfo({ ...(appStore.getUserInfo || {}), ...baseData });
		await load();
	} finally {
		saving.value = false;
	}
};

const savePassword = async () => {
	const valid = await pwdFormRef.value?.__validForm?.();
	if (!valid) return;
	if (pwdData.newPassword !== pwdData.confirmPassword) {
		ElMessage.warning("两次输入的新密码不一致");
		return;
	}
	saving.value = true;
	try {
		const [err] = await sync($passwordPost({ oldPassword: pwdData.oldPassword, newPassword: pwdData.newPassword }));
		if (err) return;
		ElMessage.success("密码修改成功");
		Object.assign(pwdData, { oldPassword: "", newPassword: "", confirmPassword: "" });
	} finally {
		saving.value = false;
	}
};

const savePref = () => {
	localStorage.setItem("CAMPUS_PREF", JSON.stringify(prefData));
	document.documentElement.classList.toggle("dark", prefData.theme === "dark");
	ElMessage.success("偏好已保存");
};

onMounted(load);
</script>

<style lang="less">
.profile-page {
	display: flex;
	gap: 12px;
	height: 100%;
	min-height: 0;

	&__card {
		flex: 0 0 300px;
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: 28px 20px;
		background: var(--sc-card);
		border-radius: var(--sc-radius-lg);
		box-shadow: var(--sc-shadow-1);
	}

	&__avatar {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 72px;
		height: 72px;
		border-radius: 20px;
		background: linear-gradient(135deg, #165dff, #4080ff);
		box-shadow: 0 8px 20px rgba(22, 93, 255, 0.3);
		color: #fff;
		font-size: 28px;
		font-weight: 600;
	}

	&__name {
		margin-top: 14px;
		font-size: 18px;
		font-weight: 600;
		color: var(--sc-text-1);
	}

	&__post {
		margin-top: 4px;
		font-size: 12.5px;
		color: var(--sc-text-3);
	}

	&__tags {
		display: flex;
		gap: 6px;
		margin-top: 10px;
	}

	&__meta {
		width: 100%;
		margin-top: 22px;
		padding-top: 16px;
		border-top: 1px solid var(--sc-border);

		&-item {
			display: flex;
			align-items: center;
			justify-content: space-between;
			padding: 8px 0;
			font-size: 12.5px;
			color: var(--sc-text-3);

			strong {
				font-weight: 500;
				color: var(--sc-text-1);
			}
		}
	}

	&__main {
		flex: 1;
		min-width: 0;
		background: var(--sc-card);
		border-radius: var(--sc-radius-lg);
		box-shadow: var(--sc-shadow-1);
		padding: 8px 20px 20px;
		overflow: auto;
	}

	&__footer {
		display: flex;
		justify-content: flex-start;
		padding: 8px 0 0 90px;
	}
}
</style>
