/**
 * @file 报表 AI 解读
 * @desc 基于报表结果做规则化归因，产出「结论 + 发现 + 建议」。
 *       接大模型时，可把这些结构化发现作为上下文交给模型润色。
 */

export interface InsightFinding {
	level: "good" | "warn" | "danger" | "info";
	text: string;
}

export interface InsightResult {
	summary: string;
	findings: InsightFinding[];
	suggestions: string[];
	metrics: { label: string; value: string | number; unit?: string }[];
}

export function buildReportInsight(reportType: string, rows: Record<string, any>[]): InsightResult {
	if (!rows.length) {
		return { summary: "当前没有数据，无法生成解读。", findings: [], suggestions: ["调整筛选条件后重新运行报表"], metrics: [] };
	}

	if (reportType === "attendance") {
		const rates = rows.map(r => Number(r.rate) || 0);
		const avg = rates.reduce((a, b) => a + b, 0) / rates.length;
		const worst = rows.slice().sort((a, b) => Number(a.rate) - Number(b.rate))[0];
		const best = rows.slice().sort((a, b) => Number(b.rate) - Number(a.rate))[0];
		const absentTotal = rows.reduce((a, b) => a + Number(b.absent || 0), 0);

		const findings: InsightFinding[] = [
			{ level: "info", text: `平均出勤率 ${avg.toFixed(1)}%，最高 ${best.className}（${best.rate}%）` },
			{ level: avg >= 95 ? "good" : "warn", text: `最低为 ${worst.className}（${worst.rate}%），低于平均水平 ${(avg - Number(worst.rate)).toFixed(1)} 个百分点` },
			{ level: absentTotal > 20 ? "danger" : "info", text: `累计缺勤 ${absentTotal} 次，${absentTotal > 20 ? "需重点关注" : "处于可控范围"}` }
		];

		return {
			summary: `本次共统计 ${rows.length} 个班级，整体出勤率 ${avg.toFixed(1)}%。${worst.className} 出勤率偏低，是本周主要短板。`,
			findings,
			suggestions: [
				`与 ${worst.className} 班主任沟通缺勤原因，核对是否有未销假的请假记录`,
				"对缺勤集中时段（如早读）增加一次人脸打卡提醒",
				"将出勤率纳入班级周考核，形成正向激励"
			],
			metrics: [
				{ label: "统计班级", value: rows.length, unit: "个" },
				{ label: "平均出勤率", value: avg.toFixed(1), unit: "%" },
				{ label: "最低班级", value: worst.className },
				{ label: "累计缺勤", value: absentTotal, unit: "次" }
			]
		};
	}

	if (reportType === "score") {
		const weakest = rows.slice().sort((a, b) => Number(a.avg) - Number(b.avg))[0];
		const strongest = rows.slice().sort((a, b) => Number(b.avg) - Number(a.avg))[0];
		const avg = rows.reduce((a, b) => a + Number(b.avg), 0) / rows.length;
		const passAvg = rows.reduce((a, b) => a + Number(b.passRate), 0) / rows.length;

		return {
			summary: `本次共统计 ${rows.length} 个学科，平均分 ${avg.toFixed(1)}，平均及格率 ${passAvg.toFixed(1)}%。${weakest.course} 是薄弱学科。`,
			findings: [
				{ level: "good", text: `优势学科 ${strongest.course}，平均分 ${strongest.avg}，及格率 ${strongest.passRate}%` },
				{ level: "warn", text: `薄弱学科 ${weakest.course}，平均分 ${weakest.avg}，比最高学科低 ${(Number(strongest.avg) - Number(weakest.avg)).toFixed(1)} 分` },
				{ level: passAvg < 90 ? "danger" : "info", text: `平均及格率 ${passAvg.toFixed(1)}%，${passAvg < 90 ? "低于 90% 的警戒线" : "达标"}` }
			],
			suggestions: [
				`针对 ${weakest.course} 开展每周 2 次分层辅导，重点覆盖 60 分以下学生`,
				"组织同学科教师集体备课，统一重难点与作业量",
				"对进步幅度大的学生给予公开表彰，强化正向反馈"
			],
			metrics: [
				{ label: "统计学科", value: rows.length, unit: "个" },
				{ label: "平均分", value: avg.toFixed(1) },
				{ label: "平均及格率", value: passAvg.toFixed(1), unit: "%" },
				{ label: "薄弱学科", value: weakest.course }
			]
		};
	}

	if (reportType === "bill") {
		const total = rows.reduce((a, b) => a + Number(b.total), 0);
		const paid = rows.reduce((a, b) => a + Number(b.paid), 0);
		const unpaid = total - paid;
		const worst = rows.slice().sort((a, b) => Number(b.unpaid) - Number(a.unpaid))[0];

		return {
			summary: `应收合计 ¥${total.toLocaleString()}，已收 ¥${paid.toLocaleString()}，欠费 ¥${unpaid.toLocaleString()}，收缴率 ${((paid / total) * 100).toFixed(1)}%。`,
			findings: [
				{ level: unpaid > 0 ? "warn" : "good", text: `${worst.className} 欠费最多，达 ¥${Number(worst.unpaid).toLocaleString()}` },
				{ level: "info", text: `平均每个班级欠费 ¥${(unpaid / rows.length).toFixed(0)}` }
			],
			suggestions: ["对欠费班级发送缴费提醒，优先联系欠费金额前 3 的班级", "为家庭困难学生开通分期或减免申请通道", "每月生成一次收缴进度看板，纳入班级考核"],
			metrics: [
				{ label: "应收", value: total.toLocaleString(), unit: "元" },
				{ label: "已收", value: paid.toLocaleString(), unit: "元" },
				{ label: "欠费", value: unpaid.toLocaleString(), unit: "元" },
				{ label: "收缴率", value: ((paid / total) * 100).toFixed(1), unit: "%" }
			]
		};
	}

	if (reportType === "roster") {
		const total = rows.length;
		const studying = rows.filter(r => r.statusName === "在读").length;
		const noDorm = rows.filter(r => !r.dorm).length;

		return {
			summary: `本次共导出 ${total} 名学生，其中在读 ${studying} 人。`,
			findings: [
				{ level: "info", text: `在读占比 ${((studying / total) * 100).toFixed(1)}%` },
				{ level: noDorm > 0 ? "warn" : "good", text: noDorm > 0 ? `${noDorm} 名学生未分配宿舍` : "宿舍分配完整" }
			],
			suggestions: ["核对休学/退学学生的学籍异动材料是否齐全", "补充未分配宿舍学生的住宿安排", "导出后可同步至教务处备案"],
			metrics: [
				{ label: "学生总数", value: total, unit: "人" },
				{ label: "在读", value: studying, unit: "人" },
				{ label: "未分配宿舍", value: noDorm, unit: "人" }
			]
		};
	}

	return {
		summary: `共 ${rows.length} 条数据，建议结合明细进一步分析。`,
		findings: [{ level: "info", text: "该报表暂未配置自动解读规则" }],
		suggestions: ["可按班级、时间维度再做一次拆分对比"],
		metrics: [{ label: "记录数", value: rows.length, unit: "条" }]
	};
}
