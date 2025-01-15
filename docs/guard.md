# 路由守卫

本节，我们将实现路由守卫功能。

以下是一个用于进行 token 验证的守卫：

```ts
import { BadRequestException, Guard } from '@expressive/common'
import { Request } from 'express'

export class Auth extends Guard {

  // 发生在每个请求的中间件前
  public canContinue(request: Request): boolean {
    console.log('need auth')

    if (request?.headers?.token !== '123456') {
      throw new BadRequestException('need auth')
    }

    return true
  }
}

```

## 定义基类

定义一个抽象类 `Guard` ，后续所有的中间件都将基于它。

```ts
import type { Request } from 'express'

export abstract class Guard {
  public abstract canContinue(request: Request): boolean
}

```

## 定义装饰器

我们希望守卫可以应用在控制器和具体路由方法中。

```ts
@Controller("user")
@UseGuard(new Auth())
export class UserController {
  @UseGuard(new Auth())
  getProfile(){
    // ...
  }
}
```

因此我们需要增加一个装饰器。

```ts
// 将允许守卫应用于控制器和路由方法上
export type UseGuard = (guard: Guard) => ClassDecorator & MethodDecorator

export const UseGuard: UseGuard = (guard) => (target: Object, property?: string | symbol) => {
  const oldGuards: Guard[] = Reflect.getMetadata(TokenConfig.RouterGuard, target, property) || []
  Reflect.defineMetadata(TokenConfig.RouterGuard, oldGuards.concat(guard), target, property)
}
```

## 取出路由守卫

这一步将修改我们的 `Router` 类。

新增一个 `applyGuard` 方法。

```ts
// ...
  private applyGuard(name: string) {
    const baseGuards = (Reflect.getMetadata(TokenConfig.RouterGuard, this.controller) || []) as Array<Guard>
    const guards = baseGuards.concat((Reflect.getMetadata(TokenConfig.RouterGuard, this.controller, name) || []) as Array<Guard>)

    return (request: Request, response: Response, next: NextFunction) => {
      this.callHandle(() => {
        for (const guard of guards) {
          guard.canContinue(request)
        }
        return true
      })
        .then(data => {
          if (data === true) next()
          else {
            response.send(data)
          }
        })
    }
  }
// ...
```

接着，稍微修改 `Router.bindRouter` 方法。

```ts
// ...
      this.router[HttpRequestName[method]](url,
        // 这中间件之前调用路由守卫
        // 如果守卫验证失败，则会抛出一个错误
        // 错误已经在 applyGuard 中处理了，会直接返回响应
        this.applyGuard(name),
// ...
```

经过以上步骤，就可以完成基本的路由守卫功能了。
