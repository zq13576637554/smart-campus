/**
 * @file 后端入口
 * @desc 复用前端 mock 的路由表与业务处理函数，打包成 Node 可执行的 bundle。
 *       这样"真后端"和"mock"共用同一份业务逻辑，不会出现两套实现漂移。
 */
export { mockRoutes } from "lmApisCampus/mock/router";
