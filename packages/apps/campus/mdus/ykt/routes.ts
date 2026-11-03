export default [
	{
		name: "yktIndex",
		path: "/ykt/",
		component: () => import("./views/Index/index.vue"),
		meta: {
			title: "yktIndex",
			zhTitle: "校园一卡通",
			group: "校园生活",
			icon: "card",
			sort: 31
		}
	}
];
