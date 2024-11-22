# 元数据

尽管在 `tsconfig.json` 中已经启用了元数据。

但还是要引入 `reflect-metadata` 这个库。

```ts
// 入口文件 main.ts
import 'reflect-metadata'
```

此外，还需要声明一些 `token` 作为绑定的元数据的 `key`。

```ts
// token.ts
export const TokenConfig = {
  Controller: "__Controller__",       // 标识控制器
  Router: "__Router__",               // 标识路由
  RouterMethod: "__Router_Method__",  // 标识请求方法
  Moudle: "__Module__",               // 标识模块
  Params: "__Params__",               // 标识请求参数
  Injectable: "__INJECTABLE__",       // 标识可注入
  HttpStatus: "__HTTP_STATUS__"       // 标识 http 状态码
} as const satisfies Record<string, `__${string}__`>
```
