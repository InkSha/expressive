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

### 控制器局部管道

以 DTO 校验为例，在项目中我们会经常进行校验参数。

如果一个个的去增加管道，那么会显得非常繁琐。

这时，我们就可以将这个管道给提升到全局去。让框架来帮助我们将管道给应用到各个路由。

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

## 实现全局 `Provider`

完成以上步骤后，我们将得到一个可使用的局部的管道功能。

现在，我们将实现全局的管道功能。

我们选择的全局方案为在根模块定义和声明全局 `provider`。

```ts
@Module({
  imports: [UserModule, ConfigModule],
  providers: [
    // 将在根模块声明全局 providers
    { type: ProviderType.PIPE, provider: DTOPipe },
    { type: ProviderType.MIDDLEWARE, provider: Logger }
  ]
})
export class AppModule {}
```

### 改造模块装饰器

为了传递全局的 `provider`, 我们需要首先改造模块装饰器，以便应用到类型标注。

先声明对应的 `Provider` 类型。

```ts
// ProviderType 暂时仅用于区分类别
// 无其他作用
export enum ProviderType {
  SERVICE = 0,
  PIPE = 2,
  MIDDLEWARE = 4,
  GUARD = 8,
  INTERCEPT = 16,
  FILTER = 32,
}

export type Provider = { type: ProviderType, provider: Constructor }
```

接着修改 `ModuleConfig`。

```ts
export type ModuleConfig = {
  controllers: Constructor[]
  // 可以是 [Serivce], 也可以是 [{ type: ProviderType.Service, provider: Service }]
  providers: (Provider | Constructor)[]
  imports: Constructor[]
  exports: Constructor[]
}
```

然后修改装饰器内部。

```ts
// ...
// 修改 providers 的数据
Reflect.defineMetadata(TokenConfig.ModuleProviders, providers
  .map(provider =>
    // 如果是一个函数 则 代表不是 Provider 类型 而是 Constructor 类型
    // 使用 Provider 包装它
    typeof provider === 'function'
      ? { type: ProviderType.SERVICE, provider }
      : provider
  ), target)
// ...
```

### 将 `providers` 提升全局

我们将默认定义在根模块的 `provider` 将会是全局的。

先将应用在 `UserController` 的中间件和管道移除。因为它们将会被提升为全局。

#### 提取 `providers`

```ts
export class ModuleNode {
  private static _root: ModuleNode | null
  // 由原先的 { providers: Map } 转换为现在的 Map
  // 记得更改对应地方（也可以不更改，包括这里）
  private static _globals = new Map<Constructor, ModuleNode>()

  private node: AppModule
  private children: ModuleNode[] = []

  constructor(
    module: Constructor
  ) {
    this.node = AppModule.getInstance(module)

    if (!ModuleNode._root) {
      // 如果根节点为空
      // 那么当前节点将成为根节点
      // 我们会将根节点的 providers 作为全局的
      // 这里是将 provider 提取出
      // 放入我们生成的一个新的全局模块
      const Deps = AppModule.generateModule({
        controllers: [],
        providers: this.module.providers,
        imports: [],
        exports: []
      })
      // 声明为全局模块
      Globals()(Deps)
      // 加入新的全局模块
      this.module.imports.push(Deps)
      ModuleNode._root = this
    }

    this.mount()
  }
  // ...
}
```

#### 生成模块

上面涉及的生成模块方法如下。

```ts
class AppModule {
  public static generateModule(config: ModuleConfig) {
    // 不用担心 BaseModule 冲突
    // 因为它仅存在于这个函数内部
    @Module(config)
    class BaseModule {}

    return BaseModule
  }
}
```

#### 注入 `provider`

具体新增代码如下：

```ts
import { Constructor, Middleware, Module, ModuleConfig, Pipe, Provider, ProviderType, TokenConfig, UseMiddleware, UsePipe } from '@expressive/common'
import { Entities } from './entities'

export class AppModule implements ModuleConfig {
  private static Manager = new Entities()
  private readonly _providers: Provider[]

  public static generateModule(config: ModuleConfig) {
    @Module(config)
    class BaseModule {}

    return BaseModule
  }

  // 主要就是这个方法
  // 目前分别注入管道和中间件
  public injectGlobalsProvider(providers: Provider[]) {
    const pipes = providers.filter(provider => provider.type === ProviderType.PIPE).map(({ provider: pipe }) => {
      if (pipe.prototype instanceof Pipe) return pipe as Constructor<Pipe>

      throw new TypeError(`${pipe.name} is not pipe!`)
    })

    const middlewares = providers.filter(provider => provider.type === ProviderType.MIDDLEWARE).map(({ provider: middleware }) => {
      if (middleware.prototype instanceof Middleware) return middleware as Constructor<Middleware>
      throw new TypeError(`${middleware.name} is not middleware!`)
    })

    this.controllers.map(controller => {
      const _providers = providers.filter(({ type }) => type === ProviderType.SERVICE).map(({ provider }) => provider)
      // 这里将管道和中间件实例化
      UsePipe(...pipes.map(Pipe => AppModule.Manager.toEntity(Pipe, _providers)))(controller)
      UseMiddleware(...middlewares.map(Middleware => AppModule.Manager.toEntity(Middleware, _providers)))(controller)
    })
  }

  public injectGlobalsImport(imports: AppModule[]) {
    const globalProviders = imports.flatMap(module => module.providers)
    this.providers = globalProviders
    this.providers = this.imports.flatMap(m => AppModule.Modules.get(m).exports)
      .map(provider => ({ type: ProviderType.SERVICE, provider }))
    this.imports = imports.map(module => module.prototype)

    this.injectGlobalsProvider(globalProviders)
  }

  public set providers(providers) {
    for (const provider of providers) {
      if (!this._providers.includes(provider)) {
        this._providers.push(provider)
      }
    }
  }

  public get services() {
    return this._providers.filter(({ type }) => type === ProviderType.SERVICE).map(({ provider }) => provider)
  }

  protected parseMetadata(module: Constructor): Omit<ModuleConfig, 'providers'> & { providers: Provider[] } {
    const controllers = Reflect.getMetadata(TokenConfig.ModuleControllers, module)
    const providers = Reflect.getMetadata(TokenConfig.ModuleProviders, module)
    const exports = Reflect.getMetadata(TokenConfig.ModuleExports, module)
    const imports = Reflect.getMetadata(TokenConfig.ModuleImports, module)
    return { controllers, providers, exports, imports }
  }
}
```

### 修改 `Router`

修改的就只有 `Router.bindRouter` 这里。

```ts
  public bindRouter(entity: Object) {
    for (const name of entityMethodNames) {
      const { fn, url, method, params, statusCode, middlewares: routerMiddlewares = [] } = this.parseRouterFnData(entity, name, baseUrl)
      this.router[HttpRequestName[method]](url,
        baseMiddlewares
          .concat(routerMiddlewares)
          // 主要就是这里
          // 原先是在这里进行实例化
          // 现在改成由外部控制实例化
          // 此处直接调用
          .map(Middleware => Middleware.use),
      )
    }

    return this.router
  }
```

完成以上步骤之后，把那些类型问题修复完毕之后。全局的管道和中间件就实现了。
