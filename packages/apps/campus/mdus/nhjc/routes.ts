export default [
	{
		name: "nhjcIndex",
		path: "/nhjc/",
		component: () => import("./views/Index/index.vue"),
		meta: {
			title: "nhjcIndex",
			zhTitle: "能耗监测",
			group: "校园生活",
			icon: "chart",
			sort: 46
		}
	}
];
