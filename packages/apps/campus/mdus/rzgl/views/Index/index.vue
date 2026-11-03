<!-- 操作日志 -->
<template>
	<NPageBasic
		ref="pageRef"
		class="campus-rzgl-index"
		title="操作日志"
		row-key="id"
		:bars="bars"
		:cols="cols"
		:api="fetchData"
		:is-show-more-filter="true"
	>
		<template #handle-buttons>
			<ElButton type="info" plain @click="onExport">导出日志</ElButton>
		</template>
	</NPageBasic>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { ElButton, ElMessage } from "lmLibs/element-plus";
import NPageBasic from "lmCmpsBiz/NPageBasic";
import { useSimpleCols } from "lmHooks/tools/useCols";
import { useSimpleBars } from "lmHooks/tools/useBars";
import { $systemLogPagePost } from "lmApisCampus/api/system";
import { exportCsv } from "lmUtils/download";

const pageRef = ref();

const MODULES = ["认证中心", "学生档案", "请假审批", "通知公告", "一卡通", "考试成绩"];

const bars = computed(() =>
	useSimpleBars([
		"操作人|nickName|input",
		"账号|userName|input",
		{
			bar: "业务模块|module|select",
			config: { props: { options: MODULES.map(m => ({ label: m, value: m })) } }
		},
		{
			bar: "执行结果|result|select",
			config: {
				props: {
					options: [
						{ label: "成功", value: "成功" },
						{ label: "失败", value: "失败" }
					]
				}
			}
		},
		{
			bar: "操作时间|time|date-type:daterange-startKey:startTime-endKey:endTime",
			config: { props: { format: "YYYY/MM/DD", valueFormat: "YYYY-MM-DD" } }
		}
	])
);

const cols = computed(() =>
	useSimpleCols([
		"idx",
		"操作人|nickName|text|minWidth:110",
		"账号|userName|minWidth:120",
		"操作动作|action|minWidth:150",
		{
			col: "业务模块|module|tag|minWidth:120",
			setComProps: (row: any) => ({ type: row.module === "认证中心" ? "info" : "primary", text: row.module })
		},
		{
			col: "结果|result|tag|minWidth:90",
			setComProps: (row: any) => ({ type: row.result === "成功" ? "success" : "danger", text: row.result })
		},
		"IP 地址|ip|minWidth:130",
		"操作时间|time|minWidth:170",
		"详情|detail|minWidth:260"
	])
);

const fetchData = (params: Record<string, any>) => $systemLogPagePost(params);

const onExport = () => {
	const rows = pageRef.value?.getTbRef?.()?.getTableData?.() || [];
	exportCsv(
		rows,
		[
			{ label: "操作人", prop: "nickName" },
			{ label: "账号", prop: "userName" },
			{ label: "动作", prop: "action" },
			{ label: "模块", prop: "module" },
			{ label: "结果", prop: "result" },
			{ label: "IP", prop: "ip" },
			{ label: "时间", prop: "time" }
		],
		"操作日志"
	);
	ElMessage.success(`已导出 ${rows.length} 条日志`);
};
</script>
