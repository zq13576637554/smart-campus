export default [
	{
		name: "qjglIndex",
		path: "/qjgl/",
		component: () => import("./views/Index/index.vue"),
		meta: {
			title: "qjglIndex",
			zhTitle: "请假审批",
			group: "校园生活",
			icon: "calendar",
			sort: 34
		}
	}
];
