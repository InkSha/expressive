# Expressive

一个简易的仿造 Nest.js 的 NodeJS 后台框架。

用于学习 IoC (Inversion of Control 控制反转) 和 DI (Dependency Injection 依赖注入) 思想。

传统开发时，一切对象都由开发者手动创建，需要什么就 `new` 什么。并不通过中间者。

而 IoC 是一种设计思想。将原本手动创建对象的控制权交由框架处理。DI 则是 IoC 的实现。

通过这个库，可以学习到：

- 装饰器。
- 元数据。
- IoC 思想。
- DI 的实现。

## 示例

```ts
@Injectable()
class AppService {
  private _count: number = 0

  constructor() {
    console.log('service init')
  }
  public async login(name: string, pwd: string) {
    if (name === 'error') {
      return this.notFound()
    }
    return (name === 'test' && pwd === '123')
  }

  public count() {
    return this._count++
  }

  public notFound() {
    throw new NotFoundError('Not Found User!')
  }
}


@Controller('user')
class AppController {
  constructor(
    private readonly service: AppService,
  ) {
    console.log('init', service)
  }

  @Get('home')
  public Home() {
    return {
      code: 200,
      data: 'home'
    }
  }

  @Get('not-found')
  @NotFound()
  public async NotFound() {
    return {
      code: 200,
      data: null,
      msg: 'not found'
    }
  }

  @Get('login')
  public async Login(
    @Param('name') name: string,
    @Param('pwd') pwd: string
  ) {
    return this.service.login(name, pwd).then(pass => {
      return {
        code: 200,
        data: 'login',
        count: this.service.count(),
        msg: pass ? 'success' : 'failure'
      }
    })
  }
}

@Controller('user')
class UserController {
  constructor(
    private readonly service: AppService
  ) {
    console.log('init', service)
  }

  @Get('test')
  public test() {
    return {
      count: this.service.count()
    }
  }

  @Get('test-error')
  public testError() {
    return this.service.notFound()
  }
}

@Module({
  controllers: [AppController, UserController],
  providers: [AppService]
})
class AppModule {}

const boostrap = () => {
  const app = new AppFactory(AppModule)

  app.start()
}

boostrap()


```

## 开发准备

### 首先建立项目文件夹

```shell
# 这里也可以自己命名文件夹
mkdir SimpleNest
cd SimpleNest
```

### 然后安装项目依赖

```shell
# 这里使用的是 pnpm
# 可以根据自身喜好切换
pnpm add @types/express @types/node reflect-metadata ts-node typescript -D
pnpm add express
```

### 接着初始化 `TS` 配置

```shell
# 初始化 ts 配置
pnpm tsc --init
```

因为我们需要使用到装饰器和元数据，因此需要去配置文件中开启。

```jsonc
// tsconfig.json
{
  "compilerOptions": {
    // 启用元数据
    "emitDecoratorMetadata": true,
    // 启用装饰器
    "experimentalDecorators": true,
    "outDir": "dist",
    "target": "ESNext",
    "allowSyntheticDefaultImports": true,
    "lib": [
      "ESNext"
    ],
    "types": [
      // 在这里引入元数据和 node 的类型声明
      "node",
      // 这里只是类型的声明
      // 实际还是需要引入的
      // 在入口文件引入 (import "reflect-metadata")
      "reflect-metadata"
    ],
    "baseUrl": ".",
    "paths": {
      "@/*": [
        "./src/*"
      ]
    },
  }
}

```

### 尝试运行

```shell
mkdir src
echo console.log(123 as number) > src/main.ts

pnpm ts-node src/main.ts # 123
```

## 元数据

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

## 实现 Controller

在这一环节，将实现一个路由控制器。

将实现：

- 路由前缀定义
- 子路由路径定义
- 子路由方法定义
- 路由参数传递
- 设置状态码

### 控制器示例

```ts
// 定义 user 前缀
@Controller('user')
class AppController {
  constructor(
    // 注入 service
    private readonly service: AppService,
  ) {
    console.log('init', service)
  }

  // 定义具体路由
  // user/home
  @Get('home')
  public Home() {
    return {
      code: 200,
      data: 'home'
    }
  }

  @Get('not-found')
  // 设置 http 状态码
  @NotFound()
  public async NotFound() {
    return {
      code: 200,
      data: null,
      msg: 'not found'
    }
  }

  @Get('login')
  public async Login(
    // 获取请求参数
    @Param('name') name: string,
    // 获取请求参数
    @Param('pwd') pwd: string
  ) {
    return this.service.login(name, pwd).then(pass => {
      return {
        code: 200,
        data: 'login',
        count: this.service.count(),
        msg: pass ? 'success' : 'failure'
      }
    })
  }
}

@Controller('user')
class UserController {
  constructor(
    private readonly service: AppService
  ) {
    console.log('init', service)
  }

  @Get('test')
  public test() {
    return {
      count: this.service.count()
    }
  }

  @Get('test-error')
  public testError() {
    return this.service.notFound()
  }
}
```

### 定义路由

在这一节，会实现 `Controller` 和 `Get`、 `Post` 等装饰器。

将用于声明路由路径和请求方法。

#### `Controller`

```ts
// 定义装饰器类型
// 接受一个可选的 baseUrl 路径作为路由前缀
// 比如传入 `user` 则控制器所属路由为 `user/login`、 `user/home`
// 返回一个类装饰器
export type Controller = (baseUrl?: string) => ClassDecorator

// 实现装饰器
export const Controller: Controller = baseUrl => target => {
  // 给于一个默认值
  baseUrl ??= '/'

  // 如果没有 / 开头就增加一个
  // 即 @Controller('user') 等价于 @Controller('/user')
  if (!baseUrl.startsWith('/')) baseUrl = '/' + baseUrl

  // 绑定元数据
  Reflect.defineMetadata(
    TokenConfig.Controller, // 元数据 key
    baseUrl,
    target
  )
}
```

#### 装饰器工厂

```ts
const Get = url => (target, key, desciper) => {
  Reflect.defineMetadata(TokenConfig.RouterMethod, 'get', target[key])
  Reflect.defineMetadata(TokenConfig.Router, url, target[key])
}

const Post = url => (target, key, desciper) => {
  Reflect.defineMetadata(TokenConfig.RouterMethod, 'post', target[key])
  Reflect.defineMetadata(TokenConfig.Router, url, target[key])
}

const Put = url => (target, key, desciper) => {
  Reflect.defineMetadata(TokenConfig.RouterMethod, 'put', target[key])
  Reflect.defineMetadata(TokenConfig.Router, url, target[key])
}
```

可以看到，以上代码具有高度重复性。
唯一的差异就是路由方法的不同。

这时就可以使用到装饰器工厂了。

首先声明一个枚举。

```ts
export enum HttpMethod {
  Get = "get",
  Post = "post",
  Put = "put",
  Patch = "patch",
  Delete = "delete"
}
```

然后声明工厂函数类型。

```ts
// 路由类型
// 接受一个 url 参数作为路由路径
// 返回一个方法装饰器
export type Router = (url?: string) => MethodDecorator

// 路由工厂类型
// 接受一个 requestType 参数作为路由请求类型
// 返回一个路由类型
export type GenerateRouter = (requestType: HttpMethod) => Router
```

最后实现它。

```ts
export const GenerateRouter: GenerateRouter = requestType => url => (target, key, desciper) => {
  // 分别为方法绑定对应的路由路径和请求类型
  Reflect.defineMetadata(TokenConfig.RouterMethod, requestType, target[key])
  Reflect.defineMetadata(TokenConfig.Router, url, target[key])
}

// 逐个声明请求类型
export const Get = GenerateRouter(HttpMethod.Get)
export const Post = GenerateRouter(HttpMethod.Post)
export const Put = GenerateRouter(HttpMethod.Put)
export const Patch = GenerateRouter(HttpMethod.Patch)
export const Delete = GenerateRouter(HttpMethod.Delete)
```

### 绑定路由

这里就可以开始使用装饰器了。

```ts
// 记得导入对应装饰器

@Controller('user')
export class UserController {

  @Get('profile')
  getProfile() {
    return {
      name: 'admin'
    }
  }
}
```

### 获取路由

在这一环节，我们将实现一个工具方法。

用于获取路由信息。

```ts
// 这里将传入一个类作为参数 Controller
function AppFactory(Controller: new (...args: any) => any) {
  // 这里直接实例化
  const controller = new Controller()
  // 获取定义在类上面的路由前缀
  const prefix = Reflect.getMetadata(TokenConfig.Controller, Controller)

  // 获取路由
  const routerInfo = Object
    // 获取类上面的所有方法名称
    .getOwnPropertyNames(Controller.prototype)
    // 过滤构造函数
    .filter(name => name !== 'constructor')
    // 提取路由信息
    .map(method => {
      const fn = controller[method]
      // 路由路径
      const url = Reflect.getMetadata(TokenConfig.Router, fn) as string
      // 请求类型
      const requestType = Reflect.getMetadata(TokenConfig.RouterMethod, fn) as HttpMethod
      // 路由参数
      const params = Reflect.getMetadata(TokenConfig.Params, fn)
      // 返回状态码
      const statusCode = Reflect.getMetadata(TokenConfig.HttpStatus, fn)

      return {
        url,
        params,
        statusCode,
        requestType,
      }
    })

  console.log({ prefix, routerInfo })
}

AppFactory(UserController)
```

运行程序后即可看见以下内容。

```ts
{
  prefix: '/user',
  routerInfo: [
    {
      url: 'profile',
      params: undefined,        // 这两个参数暂时不需要管
      statusCode: undefined,    // 后续会涉及
      requestType: 'get'
    }
  ]
}
```

### 实现路由

以上环节完成，就能够获得一个定义好路由信息的控制器。

本节将利用控制器实现 HTTP 服务器。

```ts
// 使用的是 express
// 首先导入
import * as express from 'exrpess'

// 改造上一节定义的 AppFactory
function AppFactory(Controller: new (...args: any) => any) {
  // 增加一个 express 实例
  const app = express()
  // 定义一个路由
  const router = express.Router()

  const controller = new Controller()
  const prefix = Reflect.getMetadata(TokenConfig.Controller, Controller)

  const routerInfo = Object
    .getOwnPropertyNames(Controller.prototype)
    .filter(name => name !== 'constructor')
    .map(method => {
      const fn = controller[method]
      const url = Reflect.getMetadata(TokenConfig.Router, fn) as string
      const requestType = Reflect.getMetadata(TokenConfig.RouterMethod, fn) as HttpMethod
      const params = Reflect.getMetadata(TokenConfig.Params, fn)
      const statusCode = Reflect.getMetadata(TokenConfig.HttpStatus, fn)

      // 绑定路由路径
      router[requestType]([prefix, url].join('/'), (req, res) => {
        // 调用路由方法
        res.send(fn())
      })

      return {
        url,
        params,
        statusCode,
        requestType,
      }
    })

  // 使用路由
  app.use(router)

  // 监听 3000 端口 并开启服务
  app.listen(3000, () => {
    console.log('run')
  })
}

AppFactory(UserController)
```

改造完毕后运行程序。

接着访问 [http://localhost:3000/user/profile](http://localhost:3000/user/profile) 查看是否生效。

### 异步路由

我们的 API 不可能全是同步的，经常会需要执行一些异步任务。

在 `UserController` 中增加一个异步的 `login` 方法。

```ts
@Controller('user')
export class UserController {

  @Get('profile')
  getProfile() {
    return {
      name: 'admin'
    }
  }

  @Get('login')
  async login() {
    return {
      pass: true
    }
  }
}
```

访问 [http://localhost:3000/user/login](http://localhost:3000/user/login) 会发现没有任何返回内容。

这是因为我们只处理了同步函数，没有处理异步函数导致的。

同步和异步的差异简单来说就是：

- 同步 我等你一起走。
- 异步 我先走，你后面跟上。

因此这里发生的问题很明了了。

```ts
router.get('/user/login', (req, res) => {
  const fn = async () => 123
  // 这里 fn() 会返回 Promise<Pending> 而不是 123
  // 没有等待完成
  // 而是直接发送了
  res.send(fn())
})
```

#### 判断异步函数

```ts
// 使用 async 关键字定义的函数
const asyncFn = async () => {}

// 我们都知道， JS 中万物皆对象
// 每一个对象都有着它的原型
// 可以通过判断原型确定是否属于异步函数
if (asyncFn.constructor.name === "AsyncFunction") {
  console.log(asyncFn, '是异步函数')
}

// 但是这样就会有一个问题，就是如果没有使用 async 关键字定义
// 而是直接返回 Promise 的函数
// 如 syncFn 的原型就是 Function 而非 AsyncFunction
const syncFn = () => new Promise((resolve, reject) => resolve(123))
```

所以我们应该使用第二种方法，即判断函数的返回值。

```ts
const fn = () => Promise.resolve(true)
if (fn instanceof Promise) {
  console.log(fn, '是异步的')
}else{
  console.log(fn, '不是异步的')
}
```

改造 `AppFactory` 函数。

再次访问 [http://localhost:3000/user/login](http://localhost:3000/user/login) 可看见数据有正确返回。

```ts
// ...
router[requestType]([prefix, url].join('/'), (req, res) => {
  new Promise(async (resolve, reject) => {
    const result = fn()
    if (result instanceof Promise) {
      resolve(await result)
    } else {
      resolve(result)
    }
  })
    .then(data => {
      res.send(data)
    })
})
// ...
```

### 路由传参

正常的 API 不能只有输出没有输入。

通常情况下，我们会根据请求的参数返回不同的结果。

对于一个搜索 API，我们应该传递一个搜索关键字参数。

而对于用户登录 API，我们应该传递用户账户和密码两个参数。

#### 参数装饰器

```ts
// 参数装饰器类型
// 接受 prototype 作为属性
// 即 返回的是 params[prototype]
export type Param = (prototype?: string) => ParameterDecorator

export const Param: Param = (prototype?: string) => (target, key, index) => {
  // 因为可能存在多个参数
  // 这里使用数组存储
  const data = Reflect.getMetadata(TokenConfig.Params, target[key]) ?? []
  data.push({
    // 参数类型
    // 这里的 params 对应的是 request.query
    type: 'params',
    // 参数在参数列表中的索引
    index,
    // 可能的属性名
    prototype
  })
  Reflect.defineMetadata(TokenConfig.Params, data, target[key])
}
```

修改 `UserController`。

```ts
@Controller('user')
export class UserController {

  @Get('profile')
  getProfile() {
    return {
      name: 'admin'
    }
  }

  @Get('login')
  async login(@Param('name') name: string, @Param('pwd') pwd: string) {
    const pass = name === 'admin' && pwd === '123456'
    return {
      pass,
      login: true
    }
  }

  @Get('register')
  register() {
    return Promise.resolve({ pass: false, register: true })
  }
}
```

此时运行程序再次打印路由信息就可以看见参数信息了。

```ts
{
  routerInfo: [
    {
      url: 'profile',
      params: undefined,
      statusCode: undefined,
      requestType: 'get'
    },
    {
      url: 'login',
      params: [
        { type: 'params', index: 1, prototype: 'pwd' },
        { type: 'params', index: 0, prototype: 'name' }
      ],
      statusCode: undefined,
      requestType: 'get'
    },
    {
      url: 'register',
      params: undefined,
      statusCode: undefined,
      requestType: 'get'
    }
  ]
}
```

修改 `AppFactory`。

```ts
// ...
router[requestType]([prefix, url].join('/'), (req, res) => {
  new Promise(async (resolve, reject) => {
    // 提前声明一个数组 p 用于存储参数
    const p = []

    // 如果参数存在
    if (params) {
      for (const { type, index, prototype } of params) {
        if (type === 'params') {
          p[index] = prototype ? req.query[prototype] : req.query
        }
      }
    }

    const result = fn(...p)
    if (result instanceof Promise) {
      resolve(await result)
    } else {
      resolve(result)
    }
  })
    .then(data => {
      res.send(data)
    })
})
// ...
```

修改完成后，就可以分别访问

- [http://localhost:3000/user/login?name=admin&pwd=12345](http://localhost:3000/user/login?name=admin&pwd=12345)

- [http://localhost:3000/user/login?name=admin&pwd=123456](http://localhost:3000/user/login?name=admin&pwd=123456)

查看效果。

### 设置 HTTP 状态码

首先声明一些状态码。

```ts
export enum HttpStatusCode {
  Success = 200,
  NotFound = 404
}
```

接着定义装饰器类型。

```ts
type HttpCode = () => MethodDecorator
// 与路由装饰器一样
// 这里使用装饰器工厂
type GenerateHttpCode = (code: HttpStatusCode) => HttpCode
```

然后就是实现了。

```ts
const GenerateHttpCode: GenerateHttpCode = code => () => (target, key, descriptor) => {
  Reflect.defineMetadata(TokenConfig.HttpStatus, code, target[key])
}

export const Success = GenerateHttpCode(HttpStatusCode.Success)
export const NotFound = GenerateHttpCode(HttpStatusCode.NotFound)
```

改造 `UserController` 和 `AppFactory`。

```ts
// ...
@Get('login')
@NotFound() // 404
async login(@Param('name') name: string, @Param('pwd') pwd: string) {
  const pass = name === 'admin' && pwd === '123456'
  return {
    pass,
    login: true
  }
}
// ...

// ...
router[requestType]([prefix, url].join('/'), (req, res) => {
  if (statusCode) res.status(statusCode)
// ...
```

访问 `login` 接口即可查看到效果。

## 实现 Service

```ts
@Injectable()
class AppService {
  private _count: number = 0

  constructor() {
    console.log('service init')
  }
  public async login(name: string, pwd: string) {
    if (name === 'error') {
      return this.notFound()
    }
    return (name === 'test' && pwd === '123')
  }

  public count() {
    return this._count++
  }

  public notFound() {
    throw new NotFoundError('Not Found User!')
  }
}
```

### 实现注入

这里的注入很简单，只是使用一个装饰器表明这个被装饰者可以被注入。

```ts
export type Injectable = () => ClassDecorator
export const Injectable: Injectable = () => target => {
  Reflect.defineMetadata(TokenConfig.Injectable, true, target)
}
```

新建一个 `UserService` 类，定义一个 `login` 方法，将 `UserController` 中的判断逻辑移过来。

```ts
@Injectable()
export class UserService {
  async login(name: string, pwd: string) {
    return name === 'admin' && pwd === '123456'
  }
}
```

接着在 `UserController` 中使用它。

```ts
@Controller('user')
export class UserController {

  constructor(
    // 记得 UserService 定义要在 UserController 之前
    // 否则会因为在 UserService 定义前访问它而报错
    private readonly service: UserService
  ) {}

  @Get('login')
  @NotFound()
  async login(@Param('name') name: string, @Param('pwd') pwd: string) {
    return await this.service.login(name, pwd).then(login => ({ login }))
  }
}
```

此时直接运行是可以正常运行程序的。但是当访问到 `login` 接口时，就会报错。因为我们没有将 `UserService` 实例化传入。

### 注入实例

改造 `AppFactory`。

```ts
// 构造函数类型 表示类型可被 new 实例化
type Constructor = new (...args: any) => any
// 这是一个模块配置类型
type ModuleConfig = {
  // 路由控制器列表
  controllers: Constructor[]
  // 服务提供者列表
  provuders: Constructor[]
}

// 修改函数参数
// 由原先的控制器类变更为模块配置
function AppFactory(module: ModuleConfig) {
  const app = express()
  const router = express.Router()

  // 新增一个 实体表
  // 这个表将用于存储控制器，提供者的实例。
  const entitys = new Map<Constructor, Constructor>()

  // 新增函数 toEntity
  // 接收 proto 构造函数 和 providers 提供者列表
  const toEntity = (proto: Constructor, providers: Constructor[] = []) => {
    // 如果已经实例化就直接返回实例
    if (entitys.has(proto)) {
      return entitys.get(proto)
    } else {
      // 否则进行实例化
      // 初始化一个参数列表
      const params = []

      try {
        // 通过元数据 design:paramtypes 标签提取出构造函数参数
        const args = Reflect.getMetadata('design:paramtypes', proto) as Constructor[]
        // 遍历参数将其逐个实例化
        params.push(...args.map(constructor => toEntity(constructor, providers)))
      }
      catch {}
      // 开始实例化
      const entity = new proto(...params)
      // 保存实例
      entitys.set(proto, entity)

      return entity
    }
  }

  for (const Controller of module.controllers) {
    // 实例化控制器
    const controller = toEntity(Controller, module.provuders)
    // 获取路由前缀
    const prefix = Reflect.getMetadata(TokenConfig.Controller, Controller)

    Object
      .getOwnPropertyNames(Controller.prototype)
      .filter(name => name !== 'constructor')
      .map(method => {
        const fn = controller[method]
        const url = Reflect.getMetadata(TokenConfig.Router, fn) as string
        const requestType = Reflect.getMetadata(TokenConfig.RouterMethod, fn) as HttpMethod
        const params = Reflect.getMetadata(TokenConfig.Params, fn)
        const statusCode = Reflect.getMetadata(TokenConfig.HttpStatus, fn)

        router[requestType]([prefix, url].join('/'), (req, res) => {
          if (statusCode) res.status(statusCode)

          new Promise(async (resolve, reject) => {
            const p = []

            if (params) {
              for (const { type, index, prototype } of params) {
                if (type === 'params') {
                  p[index] = prototype ? req.query[prototype] : req.query
                }
              }
            }

            const result = fn.call(controller, ...p)
            if (result instanceof Promise) {
              resolve(await result)
            } else {
              resolve(result)
            }
          })
            .then(data => {
              res.send(data)
            })
        })

        return {
          url,
          params,
          statusCode,
          requestType,
        }
      })

    app.use(router)
  }

  app.listen(3000, () => {
    console.log('run')
  })
}

AppFactory({
  controllers: [UserController],
  provuders: [UserService]
})

```

### 错误处理

有时，我们在调用服务时可能会出现一些情况，比如用户没找到，登录密码错误等等。

一般的办法是中止调用，直接返回一个结果。这个结果包含有一些信息，比如未找到用户，代码xx等。

我们可以通过抛出一个错误来处理这些问题。

```ts
// 定义了一个抽象类
// 用于规范后续子类
export abstract class CustomError extends Error {
  public readonly code: HttpStatusCode
  public readonly name: string

  constructor(message: string) {
    super(message)
  }
}

// 此处实现了一个简单的 404 Not Found 错误
export class NotFoundError extends CustomError {
  public code = HttpStatusCode.NotFound
  public name = 'NotFound'

  constructor(message: string) {
    super(message)
  }
}
```

改造 `UserService`。

```ts
@Injectable()
export class UserService {
  async login(name: string, pwd: string) {
    // 这里将判断 name 是否是 admin 否则将抛出 404
    if (name !== 'admin') throw new NotFoundError(`Not Found ${name}`)
    return name === 'admin' && pwd === '123456'
  }
}
```

改造 `AppFactory`。

```ts
// ...
// 使用 try ... catch 将 调用路由方法 包裹
// 然后在这里通过判断错误原型来检查是否属于我们的自定义错误
try {
  const result = fn.call(controller, ...p)
  if (result instanceof Promise) {
    resolve(await result)
  } else {
    resolve(result)
  }
}
catch (e: unknown) {
  if (e instanceof CustomError) {
    res.status(e.code)
    resolve({
      code: e.code,
      msg: e.message,
      name: e.name
    })
  }
}
// ...
```

访问 [http://localhost:3000/user/login?name=test&pwd=123](http://localhost:3000/user/login?name=test&pwd=123) 即可查看效果。

## 实现 Module

```ts
@Module({
  controllers: [AppController, UserController],
  providers: [AppService]
})
class AppModule {}
```

其实上面已经有模块的东西了。

这个无非就是通过一个装饰器将模块配置存在模块类上面，然后在启动方法中解析出来。再逐步实例化，绑定即可。

## 多模块化

通常情况下，为了方便维护和开发，我们会根据业务将代码进行模块化拆分。

分别建立 `tags`, `group`, `user`, `article` 四个模块。每个模块都包含一个 `controller` 和 `service`。

```sh
# 目录结构如下
src
 |— modules
 |  |- article
 |  |  |- article.controller.ts
 |  |  |- article.module.ts
 |  |  |- article.service.ts
 |  |- grup
 |  |  |- grup.controller.ts
 |  |  |- grup.module.ts
 |  |  |- grup.service.ts
 |  |- tags
 |  |  |- tags.controller.ts
 |  |  |- tags.module.ts
 |  |  |- tags.service.ts
 |  `- user
 |     |- user.controller.ts
 |     |- user.module.ts
 |     `- user.service.ts
 |- app.module.ts
 `- index.ts
```

以上的具体路由和服务方法可以自行配置, 只是需要保证模块之间有互相引用即可。
比如 `article` 导入了 `group` 和 `tags` 模块，`user` 导入了 `article` 模块。

```ts
// 示例

// 需要注意的是
// 这里不能使用类型导入
// 因为类型导入是在编译时的
// 在运行时会被移除
// 这导致运行时会无法得到确切类型
// 改为值导入即可
import { ArticleService } from "./article.service"

@Module({
  imports: [TagsModule, GroupModule],
  controllers: [ArticleController],
  providers: [ArticleService],
  exports: [ArticleService],
})
export class ArticleModule {}

class ArticleController {
  constructor(
    private readonly tags: TagService
  ) {}
}
```

首先改造 `Module` 装饰器。

```ts
// 新增 imports 和 exports 属性

export type ModuleConfig = {
  controllers: Constructor[]
  providers: Constructor[]
  imports: Constructor[]
  exports: Constructor[]
}

export type Module = (config?: Partial<ModuleConfig>) => ClassDecorator
export const Module: Module = (config = {}) => (target) => {
  config.controllers ??= []
  config.providers ??= []
  config.exports ??= []
  config.imports ??= []

  Reflect.defineMetadata(TokenConfig.Moudle, config, target)
}
```

接着改造我们的 `AppFactory` 。

为了后续的开发，这里将 `AppFactory` 改造为类。

```ts

// 改造解析模块部分
function parseModule(module: Constructor) {
  if (!Reflect.hasMetadata(TokenConfig.Moudle, module)) {
    throw new TypeError(`${module.name} Not Module!`)
  }

  const { providers, controllers, imports, exports } = Reflect.getMetadata(
    TokenConfig.Moudle,
    module,
  ) as ModuleConfig

  // 这里将递归调用解析模块
  // 然后获取导入模块提供的服务
  const importProviders = imports
    .flatMap((module) => parseModule(module))
    .flatMap((config) => config.exports)

  for (const controller of controllers) {
    app.use(
      parseController(controller, [
        ...providers,
        // 这里对导入服务进行去重
        ...Array.from(new Set(importProviders))
      ]),
    )
  }

  // 因为需要递归获取导入模块提供的服务
  // 这里将返回模块的导出服务
  return { exports }
}

function toEntity(proto: Constructor, providers: Constructor[] = []) {
  if (entity.has(proto)) return entity.get(proto)

  const args = Reflect.getMetadata("design:paramtypes", proto) as Constructor[]

  // 这里对参数进行实例化
  const params = args.map((fn) => {
    // 查询参数服务是否被导入 未导入则报错
    if (!providers.some((p) => p === fn)) {
      throw new EvalError(`${fn.name} not in providers`)
    }

    return toEntity(fn, providers)
  })

  const entity = new proto(...params)

  entity.set(proto, entity)

  return entity
}

```

改造完毕之后，就可以进行多模块化开发了。

可以参考 `packages/example` 目录下的模块。

## DTO

  待续。

## 配置管理

  待续。

## 中间件

  待续。

## 管道

  待续。

## 简单的 ORM

  待续。

## 身份认证

  待续。

## 路由守卫

  待续。

## 全局错误处理

  待续。

## 日志记录

  待续。

## 拦截器

  待续。

## 过滤器

  待续。

## 文件处理

  待续。

## WS 支持

  待续。

## 静态文件服务

  待续。

## 速率限制

  待续。

## CORS 支持

  待续。

## 国际化（i18n）

  待续。

## OpenAPI

  待续。

## 任务调度

  待续。

## 自定义装饰器

  待续。

## 邮件服务

  待续。

## 文件版本管理

  待续。

## API 网关

  待续。

## 监控和分析

  待续。

## 测试

  待续。

## 多环境支持

  待续。

## 数据迁移工具

  待续。

## 渲染引擎

  待续。

## GraphQL 支持

  待续。
