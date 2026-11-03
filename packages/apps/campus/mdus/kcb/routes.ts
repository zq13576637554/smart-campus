export default [
	{
		name: "kcbIndex",
		path: "/kcb/",
		component: () => import("./views/Index/index.vue"),
		meta: {
			title: "kcbIndex",
			zhTitle: "课表管理",
			group: "教学管理",
			icon: "schedule",
			sort: 21
		}
	}
];
