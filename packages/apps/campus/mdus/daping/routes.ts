export default [
	{
		name: "dapingIndex",
		path: "/daping/",
		component: () => import("./views/Index/index.vue"),
		meta: {
			title: "dapingIndex",
			zhTitle: "数据大屏",
			group: "智能中枢",
			icon: "chart",
			sort: 41,
			/** 全屏页面：不套应用外壳 */
			fullscreen: true,
			closeKeepAlive: true
		}
	}
];
