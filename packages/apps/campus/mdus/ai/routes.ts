export default [
	{
		name: "aiIndex",
		path: "/ai/",
		component: () => import("./views/Index/index.vue"),
		meta: {
			title: "aiIndex",
			zhTitle: "AI 校园助手",
			group: "智能中枢",
			icon: "ai",
			sort: 50
		}
	}
];
