# 控制器

实现 Controller

在这一环节，将实现一个路由控制器。

将实现：

- 路由前缀定义
- 子路由路径定义
- 子路由方法定义
- 路由参数传递
- 设置状态码

## 控制器示例

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

## 定义路由

在这一节，会实现 `Controller` 和 `Get`、 `Post` 等装饰器。

将用于声明路由路径和请求方法。

### `Controller`

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

### 装饰器工厂

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

## 绑定路由

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

## 获取路由

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

## 实现路由

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

## 异步路由

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

### 判断异步函数

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

## 路由传参

正常的 API 不能只有输出没有输入。

通常情况下，我们会根据请求的参数返回不同的结果。

对于一个搜索 API，我们应该传递一个搜索关键字参数。

而对于用户登录 API，我们应该传递用户账户和密码两个参数。

### 参数装饰器

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

## 设置 HTTP 状态码

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
