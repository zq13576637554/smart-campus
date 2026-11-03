export default [
	{
		name: "tsjyIndex",
		path: "/tsjy/",
		component: () => import("./views/Index/index.vue"),
		meta: {
			title: "tsjyIndex",
			zhTitle: "图书馆",
			group: "校园生活",
			icon: "document",
			sort: 39
		}
	}
];
