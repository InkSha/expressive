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
