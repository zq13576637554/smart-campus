export default [
	{
		name: "xcglIndex",
		path: "/xcgl/",
		component: () => import("./views/Index/index.vue"),
		meta: {
			title: "xcglIndex",
			zhTitle: "校车管理",
			group: "校园生活",
			icon: "files",
			sort: 45
		}
	}
];
