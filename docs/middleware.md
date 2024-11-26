# 中间件

本节，我们将实现中间件功能。

以下是一个用于打印请求的中间件例子。

```ts
import { Middleware } from '@expressive/common'
import { Request, Response, NextFunction } from 'express'

export class Logger extends Middleware {
  constructor() {
    super()
    console.log('logger init')
  }

  // 每次发生请求时
  // 都会打印请求的方法，路由 和 请求时间
  public use(req: Request, res: Response, next: NextFunction): void {
    const info = [
      `[${req.method}]`,
      `[${req.url}]`,
      new Date().toLocaleString()
    ].join(' ')

    console.log(info)

    next()
  }
}
```

## 定义基类

定义一个抽象类 `Middleware` ，后续所有的中间件都将基于它。

```ts
import type { NextFunction, Request, Response } from 'express'

export interface MiddlewareContext {
  request: Request
  response: Response
}

export abstract class Middleware {
  public abstract use(req: Request, res: Response, next: NextFunction): void
}
```

## 定义装饰器

我们希望中间件可以应用在控制器和具体路由方法中。

```ts
@UseMiddleware(Logger)
@Controller("user")
export class UserController {
  @UseMiddleware(Auth)
  getUserInfo(){
    // ...
  }
}
```

因此我们需要增加一个装饰器。

```ts
// UseMiddleware 将可以被应用到类或方法上
// 因此返回的将是类装饰器和方法装饰器的联合类型
// 此外，因为可能会需要添加多个中间件
// 因此这里使用剩余参数运算符将参数变成一个数组
export type UseMiddleware = (...middlewares: Constructor<Middleware>[]) => ClassDecorator & MethodDecorator

export const UseMiddleware: UseMiddleware = (...middlewares) => (target: Object, property?: string | symbol) => {
  const old = Reflect.getMetadata(TokenConfig.ModuleMiddleware, target, property) || []
  // 当作用在类上面时
  // 将作为类装饰器被调用
  // 导致 property 为 undefined
  // 简单来说就是 property 未定义就当做没有这个参数了
  // 因此 Reflect.defineMetadata(key, val, target, property)
  // 等于 Reflect.defineMetadata(key, val, target)
  Reflect.defineMetadata(TokenConfig.ModuleMiddleware, [].concat(old, middlewares), target, property)
}
```

## 取出中间件

这一步将修改我们的 `Router` 类。

在 `Router.parseRouterFnData` 中添加取出中间件的逻辑并返回。

```ts
// ...
const middlewares = Reflect.getMetadata(TokenConfig.ModuleMiddleware, entity, name) as Array<Constructor<Middleware>>

return { fn, url, ..., middlewares }
// ...
```

接着在 `Router.bindRouter` 中取出定义在控制器类上的中间件，它们将作用在这个控制器包含的所有路由。

```ts
public bindRouter(entity: Object) {
  const baseUrl = Reflect.getMetadata(TokenConfig.Controller, this.controller)
  const entityMethodNames = this.getMethodList(this.controller)
  // 取出公共中间件
  const baseMiddlewares = (Reflect.getMetadata(TokenConfig.ModuleMiddleware, this.controller) || []) as Array<Constructor<Middleware>>

  for (const name of entityMethodNames) {
    const { fn, url, method, params, statusCode, middlewares: routerMiddlewares = [] } = this.parseRouterFnData(entity, name, baseUrl)

    this.router[HttpRequestName[method]](url,
      // 应用中间件
      baseMiddlewares
        .concat(routerMiddlewares)
        // 每次请求都会重新创建一个中间件的实例
        .map(Middleware => new Middleware().use),
      async (req: Request, res: Response, next: NextFunction) => {
        if (statusCode) res.status(statusCode)
        this.callHandle(() => {
          const p = this.getParams(req, res, next, params)
          return fn.apply(entity, p)
        }).then((data) => {
          res.send(data)
        })
      }
    )
  }

  return this.router
}
```

## 编写中间件

以下是两个简单的中间件示例。

```ts
export class Auth extends Middleware {
  public use(req: Request, res: Response, next: NextFunction): void {
    console.log('need auth')

    if (req.headers) {
      console.log({ token: req.headers.token })
    }

    next()
  }
}

export class Logger extends Middleware {
  constructor() {
    super()
    console.log('logger init')
  }

  public use(req: Request, res: Response, next: NextFunction): void {
    const info = [
      `[${req.method}]`,
      `[${req.url}]`,
      new Date().toLocaleString()
    ].join(' ')

    console.log(info)

    next()
  }
}
```

接着应用中间件。

```ts
@UseMiddleware(Logger)
@Controller("user")
export class UserController {
  constructor(
    private readonly service: UserService,
    private readonly articles: ArticleService,
    private readonly config: ConfigService,
  ) {}

  // ...

  @Get("articles")
  @UseMiddleware(Auth)
  public async getArticles(@Query("name") name: string) {
    return {
      name,
      count: this.articles.count,
      articles: this.articles.countArticles(name),
    }
  }

  // ...
}

```

```sh
# 输出
[GET] [/user/login?name=123] 2024/11/26 15:03:45
[GET] [/user/login?name=123] 2024/11/26 15:03:46
[GET] [/user/login?name=123] 2024/11/26 15:03:46
[GET] [/user/login?name=123] 2024/11/26 15:03:47
[GET] [/user/login?name=123] 2024/11/26 15:03:47
[GET] [/user/version] 2024/11/26 15:03:52
[GET] [/user/articles] 2024/11/26 15:03:55
need auth
{ token: undefined }
```
