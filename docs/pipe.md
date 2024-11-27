# 管道

简单来说就是充当将数据从 A 传递到 B 的一个媒介。

而我们可以在这个传递过程中，对数据进行一些处理。

以下是一个简单的将数据转换为数字的管道。

```ts
export class TransformInt extends Pipe<number, string | Object> {

  constructor(
    private readonly property: string
  ) {
    super()
  }

  public transform(value: string | Object): number {
    let val = ''

    if (typeof value === 'string') val = value
    else if (this.property in value) {
      val = value[this.property]
    }

    const num = Number(val)
    if (!Number.isNaN(num)) {
      return num
    }

    return -1
  }
}

```

## 定义基类

定义一个抽象类 `Pipe` 后续的所有管道都将基于它。

```ts
export abstract class Pipe<R = unknown, V = unknown> {
  public abstract transform(value: V): R
}
```

## 改造装饰器

管道是充当数据传递的媒介用的。在我们这个项目中，它将应用在我们的路由参数处理阶段。

```ts
export interface ParamsInfo {
  property: string
  index: number
  type: RequestParam
  proto: { new(): unknown }
  pipes: Pipe[]
}

export type Params = (property?: string | Pipe, ...pipes: Pipe[]) => ParameterDecorator

type GenerateParam = (type: RequestParam) => Params

const GenerateParam: GenerateParam = (type) => (property?: string | Pipe, ...pipes: Pipe[]) => (target, key, index) => {
  const data: ParamsInfo[] = Reflect.getMetadata(TokenConfig.Params, target, key) ?? []
  const proto = Reflect.getMetadata("design:paramtypes", target, key)[index]
  const isPipe = typeof property !== 'string'

  if (isPipe) {
    pipes.push(property)
  }

  data.push({ type, index, property: isPipe ? '' : property, proto, pipes })
  Reflect.defineMetadata(TokenConfig.Params, data, target, key)
}
```

## 改造路由处理

改造 `Router.getParams`。

```ts
  private getParams(
    req: express.Request,
    res: express.Response,
    next: express.NextFunction,
    params: ParamsInfo[] = [],
  ) {
    const p = new Array(Math.max.apply(Math, [0].concat(params.map((v) => v.index)))).fill(
      undefined,
    )

    // 由原先的 switch 改为了一个字典
    // 原先的步骤是在获取对应请求参数的同时自动获取 property 对应值
    // 现在移除了这个步骤，将其移到了后面
    const param = {
      [RequestParam.REQUEST]: req,
      [RequestParam.RESPONSE]: res,
      [RequestParam.NEXT]: next,
      [RequestParam.BODY]: req.body,
      [RequestParam.QUERY]: req.query,
      [RequestParam.PARAMS]: req.params,
      [RequestParam.HEADERS]: req.headers,
    }

    if (params.length) {
      // 取出管道
      for (const { type, index, property, proto, pipes } of params) {
        const has = hasValidator(proto)

        if (type in param) {
          p[index] = param[type]
        }

        if (has) {
          if (typeof p[index] === 'object') {
            if (has) {
              p[index] = assignmentObject(proto, p[index])
            }
            else if (property) {
              p[index] = p[index][property]
            }
          }

          const [pass, reason] = parseDTO(p[index])
          if (!pass) {
            throw new BadRequestException(reason)
          }
        }

        // 通过 reduce 对值进行处理
        p[index] = pipes.reduce((value, pipe) => pipe.transform(value), p[index])
      }
    }
    return p
  }
```

## 检查生效

我们新增路由来查看是否生效。

首先在 `UserController` 中增加一个 `searchUser` 方法。

```ts
// ...
  @Get('search')
  public async searchUser(@Query(new TransformInt('id')) id: number) {
    return { id, type: typeof id }
  }
// ...
```

访问 [本地地址](http://localhost:3000/user/search?id=123) 可以发现传递的 id 123 被自动转换成了数字。

而如果传递的是非数字，则会被自动转换为 -1 。

## 拆分 DTO 验证

我们的 DTO 验证目前是自动集成在路由内部的。

这并不是很好，增加了包的体积和使用者的负担。

因此我们需要将它拆分出来，作为一个可选的包。

### 重新修改 `Router.getParams`

将 DTO 的验证逻辑全部移除。

```ts
private getParams(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction,
  params: ParamsInfo[] = [],
) {
  const p = new Array(Math.max.apply(Math, [0].concat(params.map((v) => v.index)))).fill(
    undefined,
  )

  const param = {
    [RequestParam.REQUEST]: req,
    [RequestParam.RESPONSE]: res,
    [RequestParam.NEXT]: next,
    [RequestParam.BODY]: req.body,
    [RequestParam.QUERY]: req.query,
    [RequestParam.PARAMS]: req.params,
    [RequestParam.HEADERS]: req.headers,
  }

  if (params.length) {
    for (const { type, index, property, proto, pipes } of params) {

      if (type in param) {
        p[index] = param[type]
      }

      if (typeof p[index] === 'object' && property) {
        p[index] = p[index][property]
      }

      p[index] = pipes.reduce((value, pipe) => pipe.transform(value, proto), p[index])
    }
  }
  return p
}
```

### 新增 DTO 管道

需要注意的是，因为需要判断 DTO 类，因此这里将参数的类型原型传入了。

```ts
// 同步修改 Pipe 基类
export abstract class Pipe<R = unknown, V = unknown> {
  public abstract transform(value: V, proto: Constructor): R
}
```

```ts
export class DTOPipe extends Pipe<Object, Object> {
  public transform(value: Object, proto: Constructor): Object {
    const has = hasValidator(proto)
    let data = value

    if (has) {
      if (typeof value === 'object') {
        if (has) {
          data = assignmentObject(proto, value)
        }
      }

      const [pass, reason] = parseDTO(data)
      if (!pass) {
        throw new BadRequestException(reason)
      }
    }

    return data
  }
}
```

引入 DTO 的验证管道。

```ts
@Post("info")
public async getUserInfo(@Body(new DTOPipe()) userInfo: UserInfoDTO) {
  return {
    userInfo,
  }
}
```

完成以上步骤后，我们就完成了将 DTO 包拆分出来这一操作了。

## 全局管道

以 DTO 校验为例，在项目中我们会经常进行校验参数。

如果一个个的去增加管道，那么会显得非常繁琐。

这时，我们就可以将这个管道给提升到全局去。让框架来帮助我们将管道给应用到各个路由。

### 控制器局部管道

众所周知，互联网其实是一个巨大的局域网。

因此，若想实现全局管道，我们就需要首先实现局部的管道。

我们将实现一个装饰器，它会将我们的管道给应用在控制器级别。
即会给控制器的所有路由都应用传入的管道。

```ts
export type UsePipe = (...pipes: Pipe[]) => ClassDecorator
export const UsePipe: UsePipe = (...pipes) => target => {
  const oldPipes: Pipe[] = Reflect.getMetadata(TokenConfig.RouterPipe, target) || []
  Reflect.defineMetadata(TokenConfig.RouterPipe, oldPipes.concat(pipes), target)
}
```

### 改造 `Router`

```ts
class Router {
  public bindRouter(entity: Object) {
    // ...
    // 取出局部管道
    const basePipes = (Reflect.getMetadata(TokenConfig.RouterPipe, this.controller) || []) as Array<Pipe>

    // ...
    const p = this.getParams(req, res, next, params, basePipes)
    // ...
  }

  private getParams(
    req: express.Request,
    res: express.Response,
    next: express.NextFunction,
    params: ParamsInfo[] = [],
    basePipes: Pipe[] = []
  ) {
    // ...
    // 在此处将控制器级别的管道和路由本身的管道一起使用
    // 将优先处理控制器级别管道
    p[index] = basePipes.concat(pipes).reduce((value, pipe) => pipe.transform(value, proto), p[index])
    // ...
  }
}
```
