<!-- 登录页 -->
<template>
	<div class="login-page">
		<div class="login-page__bg">
			<span class="login-page__blob login-page__blob--1"></span>
			<span class="login-page__blob login-page__blob--2"></span>
			<span class="login-page__blob login-page__blob--3"></span>
		</div>

		<div class="login-page__inner">
			<!-- 左侧品牌区 -->
			<div class="login-page__brand">
				<div class="login-page__logo">
					<svg viewBox="0 0 32 32" width="34" height="34">
						<path d="M16 4l12 6.4-12 6.4L4 10.4 16 4z" fill="#fff" />
						<path d="M16 20.4l8-4.3v5.1c0 3.2-3.6 5.8-8 5.8s-8-2.6-8-5.8v-5.1l8 4.3z" fill="#fff" opacity=".78" />
					</svg>
					<span>智慧校园</span>
				</div>

				<h1 class="login-page__slogan">让校园的每一处<br />都被智慧照亮</h1>
				<p class="login-page__desc">
					统一身份认证 · 学情大数据 · 智能考勤 · 一码通行<br />
					为学校提供一体化的数字校园底座
				</p>

				<div class="login-page__stats">
					<div class="login-page__stat">
						<strong>12,860</strong>
						<span>在校师生</span>
					</div>
					<div class="login-page__stat">
						<strong>99.9%</strong>
						<span>系统可用率</span>
					</div>
					<div class="login-page__stat">
						<strong>26</strong>
						<span>智能物联设备</span>
					</div>
				</div>
			</div>

			<!-- 右侧登录卡片 -->
			<div class="login-page__card">
				<div class="login-page__card-head">
					<h2>欢迎回来</h2>
					<p>请使用校园统一账号登录管理平台</p>
				</div>

				<ElForm ref="formRef" :model="form" :rules="rules" size="large" @keyup.enter="onLogin">
					<ElFormItem prop="userName">
						<ElInput v-model="form.userName" placeholder="请输入账号" clearable>
							<template #prefix>
								<ElIcon><User /></ElIcon>
							</template>
						</ElInput>
					</ElFormItem>

					<ElFormItem prop="password">
						<ElInput v-model="form.password" type="password" placeholder="请输入密码" show-password>
							<template #prefix>
								<ElIcon><Lock /></ElIcon>
							</template>
						</ElInput>
					</ElFormItem>

					<div class="login-page__row">
						<ElCheckbox v-model="remember">记住账号</ElCheckbox>
						<span class="login-page__link">忘记密码？</span>
					</div>

					<ElButton type="primary" class="login-page__submit" :loading="loading" @click="onLogin">
						{{ loading ? "登录中..." : "登 录" }}
					</ElButton>
				</ElForm>

				<div class="login-page__demo">
					<span class="login-page__demo-title">演示账号</span>
					<div class="login-page__demo-list">
						<div
							v-for="acc in demoAccounts"
							:key="acc.userName"
							class="login-page__demo-item"
							@click="fillAccount(acc)"
						>
							<strong>{{ acc.nickName }}</strong>
							<span>{{ acc.userName }} / 123456</span>
						</div>
					</div>
				</div>

				<div class="login-page__footer">© 2026 智慧校园管理平台 · 建议使用 Chrome / Edge 浏览器</div>
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
import { reactive, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { ElButton, ElCheckbox, ElForm, ElFormItem, ElIcon, ElInput, ElMessage, ElMessageBox } from "lmLibs/element-plus";
import type { FormInstance, FormRules } from "lmLibs/element-plus";
import { Lock, User } from "@element-plus/icons-vue";
import { useAppStore } from "lmStore/modules/app";
import { useDict } from "lmHooks/tools/useDict";
import { $enumsByTypeGet, $loginPost, $menusGet } from "lmApisCampus/api/auth";
import { LOCAL_DICTS } from "lmApisCampus/enums";
import { setAuthCodes } from "lmUtils/auth";

const router = useRouter();
const route = useRoute();
const appStore = useAppStore();
const { initDict } = useDict();

const formRef = ref<FormInstance>();
const loading = ref(false);
const remember = ref(true);

const form = reactive({
	userName: localStorage.getItem("CAMPUS_LAST_USER") || "admin",
	password: "123456"
});

const rules: FormRules = {
	userName: [{ required: true, message: "请输入账号", trigger: "blur" }],
	password: [{ required: true, message: "请输入密码", trigger: "blur" }]
};

const demoAccounts = [
	{ userName: "admin", nickName: "系统管理员" },
	{ userName: "principal", nickName: "校领导" },
	{ userName: "master01", nickName: "班主任" }
];

const fillAccount = (acc: { userName: string }) => {
	form.userName = acc.userName;
	form.password = "123456";
};

const onLogin = async () => {
	const valid = await formRef.value?.validate().catch(() => false);
	if (!valid) return;

	loading.value = true;
	try {
		const res: any = await $loginPost({ userName: form.userName, password: form.password });
		appStore.setTokenInfo({ token: res.token, tokenHead: res.tokenHead, expiresIn: res.expiresIn });
		appStore.setUserInfo(res.userInfo);
		setAuthCodes(res.userInfo?.authCodes || []);
		appStore.setTenantData({ title: "智慧校园", productName: "智慧校园管理平台" });
		appStore.setSystemConfig({ theme: "light", noticeCount: 6 });

		const menus = await $menusGet().catch(() => []);
		appStore.setMenus(menus as any);

		// 字典初始化（已缓存则跳过）
		await initDict({ api: $enumsByTypeGet, localDict: LOCAL_DICTS, timeout: 3600 });

		if (remember.value) localStorage.setItem("CAMPUS_LAST_USER", form.userName);
		else localStorage.removeItem("CAMPUS_LAST_USER");

		const redirect = (route.query.redirect as string) || "/home/";
		await router.replace(redirect);
		ElMessage.success(`欢迎回来，${res.userInfo?.nickName || res.userInfo?.userName}`);
	} catch (e: any) {
		ElMessageBox.alert(e?.message || "登录失败", "登录失败", { type: "error" });
	} finally {
		loading.value = false;
	}
};
</script>

<style lang="less">
.login-page {
	position: relative;
	display: flex;
	align-items: center;
	justify-content: center;
	width: 100%;
	min-height: 100vh;
	background: radial-gradient(1200px 600px at 10% 10%, #10316b 0%, #0a1b3d 45%, #050d1f 100%);
	overflow: hidden;

	&__bg {
		position: absolute;
		inset: 0;
		pointer-events: none;
	}

	&__blob {
		position: absolute;
		border-radius: 50%;
		filter: blur(80px);
		opacity: 0.5;

		&--1 {
			width: 420px;
			height: 420px;
			left: -80px;
			top: -120px;
			background: #165dff;
		}

		&--2 {
			width: 360px;
			height: 360px;
			right: 8%;
			bottom: -140px;
			background: #0fc6c2;
		}

		&--3 {
			width: 260px;
			height: 260px;
			right: 32%;
			top: 8%;
			background: #722ed1;
			opacity: 0.32;
		}
	}

	&__inner {
		position: relative;
		z-index: 1;
		display: flex;
		align-items: center;
		gap: 80px;
		width: 100%;
		max-width: 1180px;
		padding: 40px;
	}

	&__brand {
		flex: 1;
		color: #fff;
	}

	&__logo {
		display: flex;
		align-items: center;
		gap: 10px;
		font-size: 20px;
		font-weight: 700;
		letter-spacing: 2px;
	}

	&__slogan {
		margin: 40px 0 18px;
		font-size: 44px;
		line-height: 1.28;
		font-weight: 700;
		letter-spacing: 1px;
		background: linear-gradient(92deg, #fff 20%, #8bb4ff 100%);
		-webkit-background-clip: text;
		background-clip: text;
		color: transparent;
	}

	&__desc {
		font-size: 14px;
		line-height: 1.9;
		color: rgba(255, 255, 255, 0.62);
	}

	&__stats {
		display: flex;
		gap: 40px;
		margin-top: 48px;
	}

	&__stat {
		display: flex;
		flex-direction: column;

		strong {
			font-size: 26px;
			font-weight: 700;
			color: #fff;
		}

		span {
			margin-top: 2px;
			font-size: 12px;
			color: rgba(255, 255, 255, 0.5);
		}
	}

	&__card {
		flex: 0 0 400px;
		padding: 36px 34px 22px;
		background: rgba(255, 255, 255, 0.98);
		border-radius: 16px;
		box-shadow: 0 24px 60px rgba(0, 0, 0, 0.35);

		&-head {
			margin-bottom: 26px;

			h2 {
				margin: 0 0 6px;
				font-size: 24px;
				color: #1d2129;
			}

			p {
				margin: 0;
				font-size: 13px;
				color: #86909c;
			}
		}
	}

	&__row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin: -6px 0 18px;
	}

	&__link {
		font-size: 13px;
		color: #165dff;
		cursor: pointer;
	}

	&__submit {
		width: 100%;
		height: 44px;
		font-size: 15px;
		letter-spacing: 4px;
		border-radius: 8px;
		background: linear-gradient(90deg, #165dff, #4080ff);
		border: none;
	}

	&__demo {
		margin-top: 24px;
		padding-top: 16px;
		border-top: 1px dashed #e5e6eb;

		&-title {
			font-size: 12px;
			color: #86909c;
		}

		&-list {
			display: grid;
			grid-template-columns: repeat(3, 1fr);
			gap: 8px;
			margin-top: 10px;
		}

		&-item {
			display: flex;
			flex-direction: column;
			padding: 8px 10px;
			border: 1px solid #f2f3f5;
			border-radius: 6px;
			cursor: pointer;
			transition: all 0.15s;

			&:hover {
				border-color: #165dff;
				background: #f2f7ff;
			}

			strong {
				font-size: 12px;
				color: #1d2129;
			}

			span {
				margin-top: 2px;
				font-size: 11px;
				color: #86909c;
			}
		}
	}

	&__footer {
		margin-top: 18px;
		font-size: 11px;
		color: #c9cdd4;
		text-align: center;
	}

	@media (max-width: 1024px) {
		&__brand {
			display: none;
		}

		&__inner {
			justify-content: center;
		}
	}
}
</style>
