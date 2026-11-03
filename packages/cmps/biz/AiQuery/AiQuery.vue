<!-- 智能查询：用一句话生成查询条件 -->
<template>
	<Dialog
		:model-value="modelValue"
		title=""
		width="620px"
		:show-footer="false"
		@update:model-value="val => $emit('update:modelValue', val)"
	>
		<div class="ai-query">
			<div class="ai-query__head">
				<div class="ai-query__icon"><NIcon name="ai" :size="20" /></div>
				<div>
					<div class="ai-query__title">智能查询</div>
					<div class="ai-query__sub">用一句话描述，自动生成查询条件</div>
				</div>
			</div>

			<ElInput
				v-model="question"
				type="textarea"
				:rows="3"
				resize="none"
				placeholder="例如：高一(1)班姓张的学生、本周缺勤的考勤记录、未缴费的账单"
				@keydown.enter.exact.prevent="parse"
			/>

			<div class="ai-query__examples">
				<span class="ai-query__examples-label">试试</span>
				<span v-for="ex in examples" :key="ex" class="ai-query__example" @click="useExample(ex)">{{ ex }}</span>
			</div>

			<!-- 解析结果 -->
			<div v-if="result" class="ai-query__result">
				<div class="ai-query__result-head">
					<span>识别结果</span>
					<NTag :type="result.conditions.length ? 'success' : 'info'" fill>{{ Math.round(result.confidence * 100) }}% 匹配</NTag>
				</div>

				<div v-if="result.conditions.length" class="ai-query__conditions">
					<div v-for="(c, i) in result.conditions" :key="i" class="ai-query__condition">
						<span class="ai-query__condition-label">{{ c.label }}</span>
						<span class="ai-query__condition-value">{{ c.text }}</span>
					</div>
				</div>

				<div class="ai-query__explain">{{ result.explain }}</div>
			</div>

			<div class="ai-query__footer">
				<span class="ai-query__tip">规则引擎解析，接入大模型后语义理解会更强</span>
				<div class="ai-query__actions">
					<ElButton @click="close">取消</ElButton>
					<ElButton :loading="parsing" :disabled="!question.trim()" @click="parse">解析</ElButton>
					<ElButton type="primary" :disabled="!result?.conditions.length" @click="apply">应用条件</ElButton>
				</div>
			</div>
		</div>
	</Dialog>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { ElButton, ElInput } from "lmLibs/element-plus";
import NIcon from "lmCmpsBasic/NIcon";
import NTag from "lmCmpsBasic/NTag";
import Dialog from "lmCmpsBasic/Dialog";
import { $aiNl2QueryPost } from "lmApisCampus/api/ai";
import { sync } from "lmUtils/promise";

interface SchemaItem {
	key: string;
	label: string;
	kind: "text" | "select" | "enum" | "date";
	options?: { label: string; value: any }[];
}

interface NlqResult {
	filters: Record<string, any>;
	conditions: { label: string; text: string }[];
	explain: string;
	confidence: number;
}

const props = withDefaults(
	defineProps<{
		modelValue: boolean;
		schema?: SchemaItem[];
	}>(),
	{ schema: () => [] }
);

const emit = defineEmits<{
	(e: "update:modelValue", val: boolean): void;
	(e: "apply", filters: Record<string, any>): void;
}>();

const question = ref("");
const parsing = ref(false);
const result = ref<NlqResult | null>(null);

/** 示例：直接取当前页面的选项词，点一下就能用 */
const examples = computed(() => {
	const opts = props.schema
		.flatMap(s => s.options || [])
		.filter(o => String(o.label).length >= 2)
		.map(o => String(o.label));

	const list: string[] = [];
	if (props.schema.some(s => s.kind === "date")) list.push("本周");
	if (opts[0]) list.push(opts[0]);
	if (opts[1]) list.push(opts[1]);
	if (!list.length) list.push("本周的记录", "最近 7 天的数据");
	return list.slice(0, 3);
});

const useExample = (ex: string) => {
	question.value = ex;
	parse();
};

const parse = async () => {
	if (!question.value.trim() || parsing.value) return;
	parsing.value = true;
	try {
		const [err, res] = await sync($aiNl2QueryPost({ question: question.value, schema: props.schema }));
		if (err) return;
		result.value = res as any;
	} finally {
		parsing.value = false;
	}
};

const apply = () => {
	if (!result.value?.conditions.length) return;
	emit("apply", result.value.filters);
	close();
};

const close = () => {
	emit("update:modelValue", false);
	question.value = "";
	result.value = null;
};
</script>

<style lang="less">
.ai-query {
	&__head {
		display: flex;
		align-items: center;
		gap: 10px;
		margin-bottom: 14px;
	}

	&__icon {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 38px;
		height: 38px;
		border-radius: 10px;
		color: #fff;
		background: linear-gradient(135deg, #722ed1, #165dff);
	}

	&__title {
		font-size: 16px;
		font-weight: 600;
		color: var(--sc-text-1);
	}

	&__sub {
		margin-top: 2px;
		font-size: 12px;
		color: var(--sc-text-3);
	}

	&__examples {
		display: flex;
		align-items: center;
		flex-wrap: wrap;
		gap: 6px;
		margin-top: 10px;

		&-label {
			font-size: 12px;
			color: var(--sc-text-3);
		}
	}

	&__example {
		padding: 3px 8px;
		border-radius: 10px;
		background: var(--sc-bg-sunken);
		font-size: 12px;
		color: var(--sc-text-2);
		cursor: pointer;
		transition: all 0.15s;

		&:hover {
			background: var(--sc-primary-soft);
			color: var(--sc-primary);
		}
	}

	&__result {
		margin-top: 16px;
		padding: 12px 14px;
		border-radius: var(--sc-radius);
		background: var(--sc-bg);
		border: 1px solid var(--sc-border);

		&-head {
			display: flex;
			align-items: center;
			justify-content: space-between;
			margin-bottom: 10px;
			font-size: 13px;
			font-weight: 500;
			color: var(--sc-text-1);
		}
	}

	&__conditions {
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
	}

	&__condition {
		display: inline-flex;
		align-items: center;
		overflow: hidden;
		border-radius: 6px;
		border: 1px solid var(--sc-primary-border);
		font-size: 12px;

		&-label {
			padding: 3px 8px;
			background: var(--sc-primary-soft);
			color: var(--sc-primary);
		}

		&-value {
			padding: 3px 8px;
			color: var(--sc-text-1);
		}
	}

	&__explain {
		margin-top: 10px;
		font-size: 12px;
		line-height: 1.7;
		color: var(--sc-text-3);
	}

	&__footer {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 12px;
		margin-top: 18px;
		padding-top: 14px;
		border-top: 1px solid var(--sc-border);
	}

	&__tip {
		font-size: 11.5px;
		color: var(--sc-text-4);
	}

	&__actions {
		display: flex;
		gap: 8px;
	}
}
</style>
