<!-- AI 校园助手：对话 / 知识库 / 学情报告 -->
<template>
	<div class="ai-page">
		<!-- 左侧能力面板 -->
		<aside class="ai-page__aside">
			<div class="ai-page__brand">
				<div class="ai-page__brand-icon"><NIcon name="ai" :size="20" /></div>
				<div>
					<div class="ai-page__brand-title">校园数据助手</div>
					<div class="ai-page__brand-sub">基于全校数据实时分析</div>
				</div>
			</div>

			<div class="ai-page__section-title">我能做什么</div>
			<div class="ai-page__abilities">
				<div v-for="item in abilities" :key="item.title" class="ai-page__ability">
					<NIcon :name="item.icon" :size="16" />
					<div>
						<div class="ai-page__ability-title">{{ item.title }}</div>
						<div class="ai-page__ability-desc">{{ item.desc }}</div>
					</div>
				</div>
			</div>

			<div class="ai-page__section-title">试试这样问</div>
			<div class="ai-page__suggests">
				<div v-for="q in suggests" :key="q" class="ai-page__suggest" @click="askFromSuggest(q)">{{ q }}</div>
			</div>
		</aside>

		<!-- 右侧主区 -->
		<section class="ai-page__main">
			<ElTabs v-model="tab" class="ai-page__tabs">
				<!-- 对话 -->
				<ElTabPane label="智能对话" name="chat">
					<div class="ai-page__chat">
						<div class="ai-page__engine">
							<span class="ai-page__engine-dot" :class="{ 'is-live': isModelEnabled }"></span>
							<span>{{ PROVIDER_LABEL[providerName] }}</span>
							<span v-if="!isModelEnabled" class="ai-page__engine-tip">
								配置 VITE_AI_PROVIDER 可接入真实模型，当前由规则引擎回答
							</span>
						</div>

						<div ref="scrollRef" class="ai-page__messages">
							<div v-for="(msg, index) in messages" :key="index" class="ai-page__message" :class="`is-${msg.role}`">
								<div class="ai-page__avatar" :class="`is-${msg.role}`">
									{{ msg.role === "assistant" ? "AI" : "我" }}
								</div>
								<div class="ai-page__bubble">
									<div v-if="msg.tool" class="ai-page__tool">已调用工具 · {{ msg.tool }}</div>
									<div v-else-if="msg.byModel || msg.streaming" class="ai-page__tool is-model">
										模型回答 · {{ providerModel }}
										<span v-if="msg.streaming" class="ai-page__cursor"></span>
									</div>
									<div v-if="msg.loading" class="ai-page__typing"><span></span><span></span><span></span></div>
									<div v-else class="ai-page__content" v-html="render(msg.content)"></div>

									<!-- 工具返回的结构化卡片 -->
									<div v-if="msg.cards?.length" class="ai-page__cards">
										<div v-for="(card, ci) in msg.cards" :key="ci" class="ai-page__card">
											<div class="ai-page__card-title">{{ card.title }}</div>

											<div v-if="card.type === 'metrics'" class="ai-page__card-metrics">
												<div v-for="m in card.metrics" :key="m.label" class="ai-page__metric">
													<strong>{{ m.value }}<em>{{ m.unit }}</em></strong>
													<span>{{ m.label }}</span>
												</div>
											</div>

											<div v-else class="ai-page__card-table-wrap">
												<table class="ai-page__card-table">
													<thead>
														<tr>
															<th v-for="c in card.columns" :key="c.prop">{{ c.label }}</th>
														</tr>
													</thead>
													<tbody>
														<tr v-for="(r, ri) in card.rows" :key="ri">
															<td v-for="c in card.columns" :key="c.prop">{{ fmtCell(r[c.prop]) }}</td>
														</tr>
													</tbody>
												</table>
											</div>
										</div>
									</div>

									<div v-if="msg.followUps?.length" class="ai-page__followups">
										<span v-for="f in msg.followUps" :key="f" @click="askFromSuggest(f)">{{ f }}</span>
									</div>

									<div v-if="msg.references?.length" class="ai-page__refs">
										<span class="ai-page__refs-label">数据来源</span>
										<NTag v-for="ref in msg.references" :key="ref" type="info">{{ ref }}</NTag>
									</div>
									<div v-if="msg.time" class="ai-page__time">{{ msg.time }}</div>
								</div>
							</div>
						</div>

						<div class="ai-page__input">
							<ElInput
								v-model="question"
								type="textarea"
								:rows="2"
								resize="none"
								placeholder="问问关于学生、考勤、成绩、后勤的任何问题…（Enter 发送，Shift+Enter 换行）"
								@keydown.enter.prevent="onEnter"
							/>
							<ElButton v-if="isStreaming" class="ai-page__stop" @click="stopGenerating">
								<ElIcon><VideoPause /></ElIcon>
								停止
							</ElButton>
							<ElButton v-else type="primary" :loading="loading" :disabled="!question.trim()" @click="send()">
								<ElIcon><Promotion /></ElIcon>
								发送
							</ElButton>
						</div>
					</div>
				</ElTabPane>

				<!-- 知识库 -->
				<ElTabPane label="知识库" name="kb">
					<div class="ai-page__kb">
						<div class="ai-page__kb-search">
							<ElInput v-model="keyword" placeholder="搜索制度、流程、常见问题，如「请假」「一卡通挂失」" clearable @keyup.enter="searchKb" @clear="searchKb">
								<template #prefix><ElIcon><Search /></ElIcon></template>
							</ElInput>
							<ElButton type="primary" @click="searchKb">
								<ElIcon><Search /></ElIcon>
								检索
							</ElButton>
						</div>

						<div class="ai-page__kb-hint">共 {{ kbDocs.length }} 条知识 · 关键词命中 {{ kbResults.length }} 条</div>

						<div class="ai-page__kb-list" v-loading="kbLoading">
							<div v-for="doc in (kbResults.length ? kbResults : kbDocs)" :key="doc.id" class="ai-page__kb-item">
								<div class="ai-page__kb-head">
									<NTag type="primary" fill>{{ doc.category }}</NTag>
									<span class="ai-page__kb-title">{{ doc.title }}</span>
									<span v-if="doc.score" class="ai-page__kb-score">匹配度 {{ doc.score }}</span>
								</div>
								<div class="ai-page__kb-content">{{ doc.content }}</div>
								<div class="ai-page__kb-foot">
									<div class="ai-page__kb-tags">
										<NTag v-for="t in doc.tags" :key="t" type="info">{{ t }}</NTag>
									</div>
									<ElButton link type="primary" @click="askFromDoc(doc)">用这条知识提问</ElButton>
								</div>
							</div>
							<Empty v-if="!kbResults.length && keyword" text="没有匹配的知识条目" :padding="30" />
						</div>
					</div>
				</ElTabPane>

				<!-- 学情报告 -->
				<ElTabPane label="学情报告" name="report">
					<div class="ai-page__report">
						<div class="ai-page__report-bar">
							<span>选择学生</span>
							<ElSelect v-model="reportStudent" filterable style="width: 260px" placeholder="输入姓名或学号搜索">
								<ElOption v-for="s in studentOptions" :key="s.value" :label="s.label" :value="s.value" />
							</ElSelect>
							<ElButton type="primary" :loading="reportLoading" :disabled="!reportStudent" @click="generateReport">
								<ElIcon><MagicStick /></ElIcon>
								生成报告
							</ElButton>
							<ElButton v-if="report" @click="exportReport">导出报告</ElButton>
						</div>

						<div v-if="report" class="ai-page__report-body">
							<div class="ai-page__report-head">
								<div>
									<div class="ai-page__report-name">{{ report.student.name }}</div>
									<div class="ai-page__report-meta">
										{{ report.student.studentNo }} · {{ report.student.className }} · {{ report.student.grade }}
									</div>
								</div>
								<div class="ai-page__report-time">生成于 {{ report.generatedAt }}</div>
							</div>

							<div class="ai-page__report-metrics">
								<div v-for="m in report.metrics" :key="m.label" class="ai-page__report-metric">
									<span>{{ m.label }}</span>
									<strong>{{ m.value }}<em>{{ m.unit }}</em></strong>
								</div>
							</div>

							<div v-for="sec in report.sections" :key="sec.title" class="ai-page__report-section">
								<div class="ai-page__report-section-title">{{ sec.title }}</div>
								<div class="ai-page__report-section-content">{{ sec.content }}</div>
							</div>
						</div>

						<Empty v-else text="选择学生后点击「生成报告」，AI 将结合成绩、考勤与综合素质生成学情分析" :padding="50" />
					</div>
				</ElTabPane>
			</ElTabs>
		</section>
	</div>
</template>

<script setup lang="ts">
import { nextTick, onMounted, ref } from "vue";
import { ElButton, ElIcon, ElInput, ElOption, ElSelect, ElTabPane, ElTabs } from "lmLibs/element-plus";
import { MagicStick, Promotion, Search, VideoPause } from "@element-plus/icons-vue";
import NIcon from "lmCmpsBasic/NIcon";
import NTag from "lmCmpsBasic/NTag";
import Empty from "lmCmpsBasic/Empty";
import { $aiChatPost } from "lmApisCampus/api/dashboard";
import { $aiAuditPost, $aiCopilotPost, $aiKnowledgeListGet, $aiKnowledgeSearchGet, $aiReportPost } from "lmApisCampus/api/ai";
import { CAMPUS_SYSTEM_PROMPT, chatWithModel, chatWithModelStream, isModelEnabled, PROVIDER_LABEL, providerModel, providerName } from "lmApisCampus/ai/provider";
import { $studentPagePost } from "lmApisCampus/api/academic";
import { useAppStore } from "lmStore/modules/app";
import { sync } from "lmUtils/promise";
import { dayjs } from "lmUtils/time";
import { downloadText } from "lmUtils/download";

interface Message {
	role: "user" | "assistant";
	content: string;
	time?: string;
	loading?: boolean;
	references?: string[];
	tool?: string;
	byModel?: boolean;
	streaming?: boolean;
	cards?: any[];
	followUps?: string[];
}

const tab = ref("chat");
const appStore = useAppStore();
const isStreaming = ref(false);
let abortCtrl: AbortController | null = null;

/** 停止生成：中断流式请求，保留已输出内容 */
const stopGenerating = () => {
	abortCtrl?.abort();
};
const question = ref("");
const loading = ref(false);
const scrollRef = ref<HTMLElement>();

/* ---------------- 对话 ---------------- */
const messages = ref<Message[]>([
	{
		role: "assistant",
		content:
			"你好，我是智慧校园 AI 助手 👋\n\n我可以帮你快速了解全校运行情况，例如：\n\n- 本周出勤率怎么样？\n- 高三年级成绩分析\n- 宿舍床位使用情况\n- 一卡通消费异常名单\n\n也可以切到「知识库」查制度流程，或在「学情报告」里为学生生成分析。",
		time: dayjs().format("HH:mm")
	}
]);

const abilities = [
	{ icon: "attendance", title: "考勤洞察", desc: "出勤率、异常名单、打卡方式" },
	{ icon: "score", title: "学情分析", desc: "成绩趋势、薄弱学科、班级对比" },
	{ icon: "dorm", title: "后勤运营", desc: "宿舍使用率、能耗与消费" },
	{ icon: "access", title: "安全态势", desc: "门禁异常与设备在线率" }
];

const suggests = ["本周出勤率怎么样？", "高三年级数学成绩分析", "宿舍床位使用情况", "最近门禁有异常吗？", "一卡通消费情况如何？"];

const scrollToBottom = async () => {
	await nextTick();
	const el = scrollRef.value;
	if (el) el.scrollTop = el.scrollHeight;
};

/** 流式输出时合并滚动，避免每个字符都触发一次 layout */
let scrollTimer: number | null = null;
const scheduleScroll = () => {
	if (scrollTimer !== null) return;
	scrollTimer = window.setTimeout(() => {
		scrollTimer = null;
		scrollToBottom();
	}, 60);
};

const onEnter = (e: KeyboardEvent) => {
	if (e.shiftKey) return;
	send();
};

const send = async (text?: string) => {
	const content = (text ?? question.value).trim();
	if (!content || loading.value) return;

	const startedAt = Date.now();
	tab.value = "chat";
	messages.value.push({ role: "user", content, time: dayjs().format("HH:mm") });
	question.value = "";
	loading.value = true;
	await scrollToBottom();

	const assistantMsg: Message = { role: "assistant", content: "", loading: true };
	messages.value.push(assistantMsg);
	// 必须拿回数组里的响应式代理：直接改 push 进去的原始对象不会触发重渲染
	const reply = messages.value[messages.value.length - 1];
	await scrollToBottom();

	const [err, res] = await sync($aiCopilotPost({ question: content }));
	reply.loading = false;
	if (err) {
		reply.content = "抱歉，AI 服务暂时不可用，请稍后再试。";
	} else {
		const data = res as any;
		reply.content = data?.reply || data?.answer || "暂时没有找到相关数据。";
		reply.tool = data?.tool || "";
		reply.cards = data?.cards || [];
		reply.followUps = data?.followUps || [];
		reply.references = data?.references || [];
		reply.time = data?.time || dayjs().format("HH:mm");
	}

	// 已接入真实模型：数据类问题用工具结果（准确、快），其余问题交给模型（流式输出）
	if (isModelEnabled && !reply.tool) {
		const history = messages.value
			.filter(m => !m.loading && m.content && m !== reply)
			.slice(-6)
			.map(m => ({ role: m.role as "user" | "assistant", content: m.content }));

		const payload = [{ role: "system" as const, content: CAMPUS_SYSTEM_PROMPT }, ...history];

		reply.byModel = true;
		reply.streaming = true;
		reply.content = "";
		isStreaming.value = true;
		abortCtrl = new AbortController();

		try {
			reply.content = await chatWithModelStream(payload, {
				signal: abortCtrl.signal,
				onDelta: (_d, full) => {
					reply.content = full;
					scheduleScroll();
				}
			});
		} catch (e: any) {
			if (e?.name === "AbortError") {
				// 用户主动停止：保留已生成内容
				reply.content = `${reply.content || ""}\n\n> 已停止生成`;
			} else if (!reply.content) {
				// 完全没拿到内容时退回一次性请求
				try {
					reply.content = await chatWithModel(payload);
				} catch (e2: any) {
					reply.byModel = false;
					reply.content = `抱歉，模型暂时不可用（${e2?.message || "未知错误"}），已回退到本地规则引擎。`;
				}
			} else {
				reply.content += `\n\n> 输出中断：${e?.message || "网络异常"}`;
			}
		} finally {
			abortCtrl = null;
			isStreaming.value = false;
			reply.streaming = false;
		}

		reply.cards = [];
	}
	// 留痕：写入审计日志（失败不阻塞对话）
	$aiAuditPost({
		question: content,
		answer: reply.content,
		source: reply.tool || (reply.byModel ? providerModel : "rule"),
		cost: Date.now() - startedAt,
		success: !err,
		operator: appStore.userInfo?.userName,
		nickName: appStore.userInfo?.nickName
	}).catch(() => {});

	loading.value = false;
	await scrollToBottom();

	// 带卡片的长回复：滚到该条消息顶部，避免结论被挤出可视区
	if (reply.cards?.length) {
		await nextTick();
		const last = scrollRef.value?.querySelector(".ai-page__message:last-child") as HTMLElement | null;
		if (last && scrollRef.value) scrollRef.value.scrollTop = Math.max(0, last.offsetTop - 8);
	}
};

const askFromSuggest = (q: string) => {
	question.value = q;
	send(q);
};

const askFromDoc = (doc: any) => {
	tab.value = "chat";
	question.value = `请说明「${doc.title}」的具体办理流程`;
	send(question.value);
};

/** 表格单元格格式化 */
const fmtCell = (v: any) => (v === undefined || v === null || v === "" ? "--" : String(v));

/* ---------------- 知识库 ---------------- */
const keyword = ref("");
const kbDocs = ref<any[]>([]);
const kbResults = ref<any[]>([]);
const kbLoading = ref(false);

const loadKb = async () => {
	const [err, res] = await sync($aiKnowledgeListGet());
	if (!err) kbDocs.value = (res as any) || [];
};

const searchKb = async () => {
	kbLoading.value = true;
	try {
		const [err, res] = await sync($aiKnowledgeSearchGet({ keyword: keyword.value }));
		kbResults.value = err ? [] : ((res as any) || []);
	} finally {
		kbLoading.value = false;
	}
};

/* ---------------- 学情报告 ---------------- */
const studentOptions = ref<{ label: string; value: string }[]>([]);
const reportStudent = ref("");
const reportLoading = ref(false);
const report = ref<any>(null);

const loadStudents = async () => {
	const [err, res] = await sync($studentPagePost({ pageNumber: 1, pageSize: 200 }));
	if (err) return;
	studentOptions.value = (res as any).content.map((s: any) => ({
		label: `${s.name}（${s.studentNo}）`,
		value: s.studentNo
	}));
};

const generateReport = async () => {
	reportLoading.value = true;
	try {
		const [err, res] = await sync($aiReportPost({ studentNo: reportStudent.value }));
		if (!err) report.value = res;
	} finally {
		reportLoading.value = false;
	}
};

const exportReport = () => {
	if (!report.value) return;
	const r = report.value;
	const text = [
		`学情报告 · ${r.student.name}（${r.student.studentNo}）`,
		`班级：${r.student.className}  生成时间：${r.generatedAt}`,
		"",
		"【关键指标】",
		...r.metrics.map((m: any) => `${m.label}：${m.value}${m.unit}`),
		"",
		...r.sections.map((s: any) => `【${s.title}】\n${s.content}\n`)
	].join("\n");
	downloadText(text, `${r.student.name}-学情报告.txt`);
};

/** 轻量 markdown 渲染（列表 / 加粗 / 表格） */
const render = (raw = "") => {
	const escape = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
	const lines = escape(raw).split("\n");
	const out: string[] = [];
	let inList = false;
	let inTable = false;

	const closeList = () => {
		if (inList) {
			out.push("</ul>");
			inList = false;
		}
	};
	const closeTable = () => {
		if (inTable) {
			out.push("</tbody></table></div>");
			inTable = false;
		}
	};

	lines.forEach(line => {
		const text = line.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");

		if (/^\|.*\|$/.test(text)) {
			const cells = text.split("|").filter(c => c.trim() !== "");
			if (/^[-:\s|]+$/.test(text.replace(/\|/g, ""))) return;
			if (!inTable) {
				closeList();
				out.push('<div class="ai-table"><table><tbody>');
				inTable = true;
				out.push(`<tr>${cells.map(c => `<th>${c.trim()}</th>`).join("")}</tr>`);
			} else {
				out.push(`<tr>${cells.map(c => `<td>${c.trim()}</td>`).join("")}</tr>`);
			}
			return;
		}
		closeTable();

		if (/^[-*]\s+/.test(text)) {
			if (!inList) {
				out.push("<ul>");
				inList = true;
			}
			out.push(`<li>${text.replace(/^[-*]\s+/, "")}</li>`);
			return;
		}
		closeList();

		if (!text.trim()) {
			out.push("<br/>");
			return;
		}
		out.push(`<p>${text}</p>`);
	});

	closeList();
	closeTable();
	return out.join("");
};

onMounted(() => {
	loadKb();
	loadStudents();
});
</script>

<style lang="less">
.ai-page {
	display: flex;
	height: 100%;
	gap: 12px;

	&__aside {
		flex: 0 0 300px;
		display: flex;
		flex-direction: column;
		padding: 18px;
		background: var(--sc-card);
		border-radius: var(--sc-radius-lg);
		box-shadow: var(--sc-shadow-1);
		overflow: auto;
	}

	&__brand {
		display: flex;
		align-items: center;
		gap: 10px;
		padding-bottom: 16px;
		border-bottom: 1px solid var(--sc-border);

		&-icon {
			display: flex;
			align-items: center;
			justify-content: center;
			width: 38px;
			height: 38px;
			border-radius: 10px;
			color: #fff;
			background: linear-gradient(135deg, #722ed1, #165dff);
		}

		&-title {
			font-size: 15px;
			font-weight: 600;
			color: var(--sc-text-1);
		}

		&-sub {
			font-size: 11px;
			color: var(--sc-text-3);
		}
	}

	&__section-title {
		margin: 18px 0 10px;
		font-size: 12px;
		color: var(--sc-text-3);
	}

	&__ability {
		display: flex;
		gap: 10px;
		padding: 10px;
		margin-bottom: 8px;
		border-radius: var(--sc-radius);
		background: var(--sc-bg);
		color: var(--sc-primary);

		&-title {
			font-size: 13px;
			color: var(--sc-text-1);
		}

		&-desc {
			margin-top: 2px;
			font-size: 11px;
			color: var(--sc-text-3);
		}
	}

	&__suggest {
		padding: 9px 12px;
		margin-bottom: 8px;
		border: 1px solid var(--sc-border);
		border-radius: var(--sc-radius);
		font-size: 12.5px;
		color: var(--sc-text-2);
		cursor: pointer;
		transition: all 0.15s;

		&:hover {
			border-color: var(--sc-primary);
			color: var(--sc-primary);
			background: var(--sc-hover-soft);
		}
	}

	&__main {
		flex: 1;
		display: flex;
		flex-direction: column;
		min-width: 0;
		background: var(--sc-card);
		border-radius: var(--sc-radius-lg);
		box-shadow: var(--sc-shadow-1);
		padding: 6px 16px 14px;
		overflow: hidden;
	}

	&__tabs {
		height: 100%;
		display: flex;
		flex-direction: column;

		:deep(.el-tabs__content) {
			flex: 1;
			min-height: 0;
		}

		:deep(.el-tab-pane) {
			height: 100%;
			display: flex;
			flex-direction: column;
		}
	}

	&__chat {
		display: flex;
		flex-direction: column;
		height: 100%;
		min-height: 0;
		/* 给右下角的实时浮窗留出空间，避免遮挡输入区 */
		padding-bottom: 56px;
	}

	&__engine {
		display: flex;
		align-items: center;
		gap: 6px;
		padding: 6px 0 10px;
		font-size: 12px;
		color: var(--sc-text-3);

		&-dot {
			width: 6px;
			height: 6px;
			border-radius: 50%;
			background: var(--sc-text-4);

			&.is-live {
				background: var(--sc-success);
				box-shadow: 0 0 0 3px rgba(0, 180, 42, 0.15);
			}
		}

		&-tip {
			color: var(--sc-text-4);
		}
	}

	&__messages {
		flex: 1;
		overflow: auto;
		padding: 4px 4px 12px;
	}

	&__message {
		display: flex;
		gap: 10px;
		margin-bottom: 18px;

		&.is-user {
			flex-direction: row-reverse;

			.ai-page__bubble {
				background: var(--sc-primary);
				color: #fff;
				border-radius: 12px 2px 12px 12px;
			}

			.ai-page__content p,
			.ai-page__content strong {
				color: #fff;
			}
		}
	}

	&__avatar {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 32px;
		height: 32px;
		border-radius: 9px;
		font-size: 12px;
		color: #fff;
		background: #c9cdd4;
		flex: 0 0 32px;

		&.is-assistant {
			background: linear-gradient(135deg, #722ed1, #165dff);
		}
	}

	&__bubble {
		max-width: min(760px, 78%);
		padding: 12px 14px;
		border-radius: 2px 12px 12px 12px;
		background: var(--sc-bg);
		font-size: 13.5px;
		line-height: 1.75;
		color: var(--sc-text-1);
	}

	&__content {
		p {
			margin: 0;
			min-height: 10px;
		}

		ul {
			margin: 4px 0;
			padding-left: 2px;
			list-style: none;
		}

		li {
			position: relative;
			margin: 3px 0;
			padding-left: 14px;

			&::before {
				content: "•";
				position: absolute;
				left: 2px;
				color: var(--sc-primary);
			}
		}

		strong {
			color: var(--sc-primary);
			font-weight: 600;
		}

		.ai-table {
			margin: 8px 0;
			overflow: auto;
			border-radius: 6px;
			border: 1px solid var(--sc-border-strong);
		}

		table {
			width: 100%;
			border-collapse: collapse;
			font-size: 12.5px;
		}

		th,
		td {
			padding: 6px 10px;
			border-bottom: 1px solid var(--sc-border);
			text-align: left;
			color: var(--sc-text-1);
		}

		th {
			background: var(--sc-bg-sunken);
			color: var(--sc-text-2);
			font-weight: 500;
		}
	}

	&__refs {
		display: flex;
		align-items: center;
		flex-wrap: wrap;
		gap: 6px;
		margin-top: 10px;
		padding-top: 8px;
		border-top: 1px dashed var(--sc-border-strong);

		&-label {
			font-size: 11px;
			color: var(--sc-text-3);
		}
	}

	&__time {
		margin-top: 6px;
		font-size: 10.5px;
		color: var(--sc-text-4);
		text-align: right;
	}

	&__tool {
		display: inline-flex;
		align-items: center;
		gap: 4px;
		margin-bottom: 8px;
		padding: 2px 8px;
		border-radius: 10px;
		background: var(--sc-primary-soft);
		color: var(--sc-primary);
		font-size: 11px;
		font-family: Menlo, Consolas, monospace;

		&.is-model {
			background: var(--sc-info-soft);
			color: #722ed1;
		}
	}

	&__cursor {
		display: inline-block;
		width: 5px;
		height: 10px;
		margin-left: 3px;
		border-radius: 1px;
		background: currentColor;
		vertical-align: middle;
		animation: ai-caret 1s steps(2, start) infinite;
	}

	@keyframes ai-caret {
		50% {
			opacity: 0;
		}
	}

	&__cards {
		display: flex;
		flex-direction: column;
		gap: 10px;
		margin-top: 10px;
	}

	&__card {
		border: 1px solid var(--sc-border);
		border-radius: var(--sc-radius);
		background: var(--sc-card);
		overflow: hidden;

		&-title {
			padding: 8px 12px;
			background: var(--sc-bg);
			border-bottom: 1px solid var(--sc-border);
			font-size: 12px;
			font-weight: 500;
			color: var(--sc-text-2);
		}

		&-metrics {
			display: grid;
			grid-template-columns: repeat(auto-fit, minmax(108px, 1fr));
			gap: 1px;
			background: var(--sc-border);
		}

		&-table-wrap {
			max-height: 260px;
			overflow: auto;
		}

		&-table {
			width: 100%;
			border-collapse: collapse;
			font-size: 12.5px;

			th,
			td {
				padding: 7px 12px;
				text-align: left;
				border-bottom: 1px solid var(--sc-border);
				white-space: nowrap;
			}

			th {
				position: sticky;
				top: 0;
				background: var(--sc-bg);
				color: var(--sc-text-3);
				font-weight: 500;
			}

			td {
				color: var(--sc-text-1);
			}
		}
	}

	&__metric {
		padding: 10px 12px;
		background: var(--sc-card);

		strong {
			display: block;
			font-size: 17px;
			font-weight: 700;
			color: var(--sc-text-1);
			font-variant-numeric: tabular-nums;

			em {
				margin-left: 2px;
				font-size: 11px;
				font-style: normal;
				font-weight: 400;
				color: var(--sc-text-3);
			}
		}

		span {
			font-size: 11.5px;
			color: var(--sc-text-3);
		}
	}

	&__followups {
		display: flex;
		flex-wrap: wrap;
		gap: 6px;
		margin-top: 10px;

		span {
			padding: 3px 10px;
			border-radius: 10px;
			border: 1px solid var(--sc-border-strong);
			font-size: 11.5px;
			color: var(--sc-text-2);
			cursor: pointer;
			transition: all 0.15s;

			&:hover {
				color: var(--sc-primary);
				border-color: var(--sc-primary-border);
				background: var(--sc-primary-soft);
			}
		}
	}

	&__typing {
		display: flex;
		gap: 4px;
		padding: 4px 2px;

		span {
			width: 6px;
			height: 6px;
			border-radius: 50%;
			background: var(--sc-text-4);
			animation: ai-blink 1.2s infinite;

			&:nth-child(2) {
				animation-delay: 0.2s;
			}

			&:nth-child(3) {
				animation-delay: 0.4s;
			}
		}
	}

	&__input {
		display: flex;
		align-items: flex-end;
		gap: 10px;
		padding-top: 12px;
		border-top: 1px solid var(--sc-border);

		.el-textarea {
			flex: 1;
		}
	}

	&__stop {
		color: var(--sc-danger);
		border-color: var(--sc-danger-soft);

		&:hover {
			color: var(--sc-danger);
			background: var(--sc-danger-soft);
			border-color: var(--sc-danger);
		}
	}

	/* —— 知识库 —— */
	&__kb {
		display: flex;
		flex-direction: column;
		height: 100%;
		min-height: 0;

		&-search {
			display: flex;
			gap: 10px;
			padding: 4px 0 10px;
		}

		&-hint {
			font-size: 12px;
			color: var(--sc-text-3);
			padding-bottom: 10px;
		}

		&-list {
			flex: 1;
			overflow: auto;
			display: flex;
			flex-direction: column;
			gap: 10px;
		}

		&-item {
			padding: 14px 16px;
			border: 1px solid var(--sc-border);
			border-radius: var(--sc-radius);
			background: var(--sc-card);
			transition: box-shadow 0.2s;

			&:hover {
				box-shadow: var(--sc-shadow-1);
			}
		}

		&-head {
			display: flex;
			align-items: center;
			gap: 8px;
		}

		&-title {
			font-size: 14px;
			font-weight: 600;
			color: var(--sc-text-1);
		}

		&-score {
			margin-left: auto;
			font-size: 11.5px;
			color: var(--sc-primary);
		}

		&-content {
			margin: 8px 0 10px;
			font-size: 12.5px;
			line-height: 1.8;
			color: var(--sc-text-2);
		}

		&-foot {
			display: flex;
			align-items: center;
			justify-content: space-between;
			gap: 10px;
		}

		&-tags {
			display: flex;
			flex-wrap: wrap;
			gap: 6px;
		}
	}

	/* —— 学情报告 —— */
	&__report {
		display: flex;
		flex-direction: column;
		height: 100%;
		min-height: 0;

		&-bar {
			display: flex;
			align-items: center;
			gap: 10px;
			padding: 4px 0 12px;
			font-size: 13px;
			color: var(--sc-text-2);
		}

		&-body {
			flex: 1;
			overflow: auto;
			padding: 18px 22px;
			border-radius: var(--sc-radius);
			background: var(--sc-bg);
			border: 1px solid var(--sc-border);
		}

		&-head {
			display: flex;
			align-items: flex-start;
			justify-content: space-between;
			gap: 12px;
			padding-bottom: 14px;
			border-bottom: 1px solid var(--sc-border);
		}

		&-name {
			font-size: 19px;
			font-weight: 600;
			color: var(--sc-text-1);
		}

		&-meta {
			margin-top: 3px;
			font-size: 12.5px;
			color: var(--sc-text-3);
		}

		&-time {
			font-size: 11.5px;
			color: var(--sc-text-4);
		}

		&-metrics {
			display: grid;
			grid-template-columns: repeat(4, minmax(0, 1fr));
			gap: 12px;
			margin: 16px 0 6px;
		}

		&-metric {
			padding: 12px 14px;
			background: var(--sc-card);
			border: 1px solid var(--sc-border);
			border-radius: var(--sc-radius);

			span {
				display: block;
				font-size: 12px;
				color: var(--sc-text-3);
			}

			strong {
				font-size: 20px;
				color: var(--sc-text-1);

				em {
					margin-left: 2px;
					font-size: 11.5px;
					font-style: normal;
					color: var(--sc-text-3);
				}
			}
		}

		&-section {
			margin-top: 16px;

			&-title {
				position: relative;
				padding-left: 10px;
				margin-bottom: 6px;
				font-size: 13.5px;
				font-weight: 600;
				color: var(--sc-text-1);

				&::before {
					content: "";
					position: absolute;
					left: 0;
					top: 50%;
					transform: translateY(-50%);
					width: 3px;
					height: 12px;
					border-radius: 2px;
					background: var(--sc-primary);
				}
			}

			&-content {
				font-size: 13px;
				line-height: 1.9;
				color: var(--sc-text-2);
				white-space: pre-wrap;
			}
		}
	}
}

@keyframes ai-blink {
	0%,
	80%,
	100% {
		opacity: 0.3;
	}
	40% {
		opacity: 1;
	}
}

@media (max-width: 1100px) {
	.ai-page__aside {
		display: none;
	}

	.ai-page__report-metrics {
		grid-template-columns: repeat(2, minmax(0, 1fr));
	}
}
</style>
