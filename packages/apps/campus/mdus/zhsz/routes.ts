export default [
	{
		name: "zhszIndex",
		path: "/zhsz/",
		component: () => import("./views/Index/index.vue"),
		meta: {
			title: "zhszIndex",
			zhTitle: "综合素质评价",
			group: "智能中枢",
			icon: "medal",
			sort: 42
		}
	}
];
