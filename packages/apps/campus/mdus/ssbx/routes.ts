export default [
	{
		name: "ssbxIndex",
		path: "/ssbx/",
		component: () => import("./views/Index/index.vue"),
		meta: {
			title: "ssbxIndex",
			zhTitle: "宿舍报修",
			group: "校园生活",
			icon: "files",
			sort: 35
		}
	}
];
