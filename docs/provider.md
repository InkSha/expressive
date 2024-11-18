# 提供者

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

## 实现注入

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

## 注入实例

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

## 错误处理

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
