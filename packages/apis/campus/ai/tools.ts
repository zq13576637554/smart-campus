/**
 * @file 模型可调用的只读工具定义
 * @desc OpenAI function-calling 格式；name 必须与 mock/copilot.ts 的 runTool 支持的工具一致。
 *       全部只读，不含任何写操作。
 */
export interface ToolSchema {
	type: "function";
	function: {
		name: string;
		description: string;
		parameters: {
			type: "object";
			properties: Record<string, any>;
			required?: string[];
		};
	};
}

const classNameParam = {
	type: "string",
	description: "班级名称，如「高一(1)班」；不传表示全部班级"
};

export const AI_TOOLS: ToolSchema[] = [
	{
		type: "function",
		function: {
			name: "queryStudents",
			description: "查询学生名单与人数统计，可按班级或年级过滤",
			parameters: {
				type: "object",
				properties: {
					className: classNameParam,
					grade: { type: "string", description: "年级，如「高一」「高二」「高三」" }
				}
			}
		}
	},
	{
		type: "function",
		function: {
			name: "queryAttendance",
			description: "统计考勤情况：出勤率、迟到、缺勤，并给出异常人员 TOP",
			parameters: {
				type: "object",
				properties: {
					className: classNameParam,
					days: { type: "number", description: "统计最近多少天，默认 30" }
				}
			}
		}
	},
	{
		type: "function",
		function: {
			name: "queryScores",
			description: "统计成绩：平均分、及格率、优秀率与学科对比",
			parameters: {
				type: "object",
				properties: { className: classNameParam }
			}
		}
	},
	{
		type: "function",
		function: {
			name: "queryLeave",
			description: "查询请假记录与待审批数量",
			parameters: { type: "object", properties: {} }
		}
	},
	{
		type: "function",
		function: {
			name: "queryCards",
			description: "查询一卡通余额、当日交易与余额不足名单",
			parameters: {
				type: "object",
				properties: {
					threshold: { type: "number", description: "余额阈值（元），默认 20" }
				}
			}
		}
	},
	{
		type: "function",
		function: {
			name: "queryRepairs",
			description: "查询宿舍报修工单状态与待接单列表",
			parameters: { type: "object", properties: {} }
		}
	},
	{
		type: "function",
		function: {
			name: "queryEvaluations",
			description: "查询综合素质评价的等级分布与平均分",
			parameters: { type: "object", properties: {} }
		}
	}
];

export const AI_TOOL_NAMES = AI_TOOLS.map(t => t.function.name);
