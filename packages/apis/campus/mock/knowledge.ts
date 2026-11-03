/**
 * @file AI 知识库与学情报告数据
 */
export interface KnowledgeDoc {
	id: string;
	title: string;
	category: string;
	tags: string[];
	content: string;
	updatedAt: string;
}

export const knowledgeDocs: KnowledgeDoc[] = [
	{
		id: "K001",
		title: "学生请假管理制度",
		category: "学籍管理",
		tags: ["请假", "审批", "考勤", "事假", "病假"],
		content:
			"学生请假须提前在系统提交申请：1-2 天由班主任审批，3-7 天由年级组长审批，7 天以上需报学生处备案。病假需上传医院证明，事假需家长电话确认。审批通过后系统自动同步考勤记录，返校后需销假。",
		updatedAt: "2026-09-01"
	},
	{
		id: "K002",
		title: "学籍异动办理流程",
		category: "学籍管理",
		tags: ["转学", "休学", "复学", "退学", "学籍"],
		content:
			"学籍异动包括转学、休学、复学、退学四类。办理流程：学生提交书面申请 → 班主任签署意见 → 年级组审核 → 教务处审批 → 学籍系统变更。休学一般以一学年为期，复学需提供相关证明。",
		updatedAt: "2026-08-20"
	},
	{
		id: "K003",
		title: "校园一卡通挂失与补办",
		category: "校园生活",
		tags: ["一卡通", "挂失", "补办", "充值", "消费"],
		content:
			"一卡通丢失后请立即在「校园一卡通」中冻结卡片，或到信息中心办理挂失。补办需携带学生证，工本费 15 元，当场制卡。挂失前 24 小时内的异常消费可申请核查。",
		updatedAt: "2026-07-15"
	},
	{
		id: "K004",
		title: "宿舍管理规定",
		category: "校园生活",
		tags: ["宿舍", "报修", "门禁", "卫生", "熄灯"],
		content:
			"宿舍实行门禁管理，22:30 熄灯、23:00 闭楼。严禁使用大功率电器。设施故障请在「宿舍报修」提交工单，紧急情况可直接联系宿管。每周三进行卫生检查，结果计入班级考核。",
		updatedAt: "2026-09-10"
	},
	{
		id: "K005",
		title: "成绩查询与复核办法",
		category: "教学管理",
		tags: ["成绩", "复核", "考试", "分数"],
		content:
			"考试成绩在阅卷完成后 3 个工作日内发布，可在「学业成绩」查看。对成绩有异议的，须在成绩公布后 5 个工作日内提交复核申请，复核范围限于漏评、错登、统分错误，不重新评阅答卷。",
		updatedAt: "2026-06-30"
	},
	{
		id: "K006",
		title: "校园网络接入指南",
		category: "信息服务",
		tags: ["网络", "WiFi", "上网", "账号"],
		content:
			"校园网账号为学号，初始密码为身份证后六位。连接 CSCampus-WiFi 后在认证页面登录。每个账号最多同时在线 3 台设备。网络故障可通过信息中心报修或拨打 8001。",
		updatedAt: "2026-05-12"
	},
	{
		id: "K007",
		title: "图书馆借阅规则",
		category: "校园生活",
		tags: ["图书馆", "借书", "还书", "逾期"],
		content:
			"学生每次可借 5 册，借期 30 天，可续借 1 次。逾期未还将暂停借阅权限并按 0.2 元/天计收滞纳金。工具书、期刊仅限馆内阅览。",
		updatedAt: "2026-04-18"
	},
	{
		id: "K008",
		title: "学费与代收费缴纳说明",
		category: "财务",
		tags: ["缴费", "学费", "住宿费", "退费"],
		content:
			"学费、住宿费按学期缴纳，缴费截止日为开学后 15 日内。可通过「缴费中心」在线支付（微信/支付宝/现金）。因故退学的，按实际在校时间按月计退。",
		updatedAt: "2026-08-01"
	},
	{
		id: "K009",
		title: "校车运行与乘坐须知",
		category: "校园生活",
		tags: ["校车", "接送", "时刻", "安全"],
		content:
			"校车每日 06:40 发车、19:20 末班。学生须提前 5 分钟到站点候车，凭学生证上车。乘车期间系好安全带，严禁将头手伸出窗外。临时调整线路会通过家校通知推送。",
		updatedAt: "2026-09-05"
	},
	{
		id: "K010",
		title: "心理健康服务与预约",
		category: "学生服务",
		tags: ["心理", "咨询", "预约", "健康"],
		content:
			"心理咨询中心位于图书馆 3 楼，提供个体咨询、团体辅导与危机干预。预约方式：心理中心现场预约或在系统提交预约。咨询内容严格保密，紧急情况可拨打 24 小时热线 8002。",
		updatedAt: "2026-03-20"
	}
];

/** 关键词检索（简易 BM25 风格打分） */
export function searchKnowledge(keyword: string) {
	const kw = (keyword || "").trim().toLowerCase();
	if (!kw) return knowledgeDocs.map(d => ({ ...d, score: 0 })).slice(0, 6);
	const terms = kw.split(/\s+/).filter(Boolean);

	return knowledgeDocs
		.map(doc => {
			let score = 0;
			terms.forEach(t => {
				if (doc.title.toLowerCase().includes(t)) score += 6;
				if (doc.tags.some(tag => tag.toLowerCase().includes(t))) score += 4;
				if (doc.category.toLowerCase().includes(t)) score += 2;
				if (doc.content.toLowerCase().includes(t)) score += 1;
			});
			return { ...doc, score };
		})
		.filter(d => d.score > 0)
		.sort((a, b) => b.score - a.score)
		.slice(0, 6);
}
