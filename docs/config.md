# 配置管理

这里使用到了 `dotenv` 库。

大体内容如下：

```ts
import { config } from "dotenv"
import fs from "node:fs"
import path from "node:path"

@Injectable()
export class ConfigService {
  constructor() {
    const cwd = process.cwd()
    // 将会读取项目根目录下的 .env 开头的所有文件
    config({
      path: fs
        .readdirSync(cwd)
        .filter((p) => fs.statSync(path.join(cwd, p)).isFile())
        .filter((file) => file.startsWith(".env")),
    })
  }

  public getEnv(key: string, defaultValue: string): string {
    const value = process.env[key]
    return value === undefined ? defaultValue : value
  }
}

@Module({
  providers: [ConfigService],
  exports: [ConfigService],
})
export class ConfigModule {}
```

## 全局模块

当前的配置模块需要在使用的地方手动引入，
但这种方式在模块数量较多时会增加代码维护的复杂性和开发负担。

为了解决这一问题，我们将实现一个全局模块，使其能够在项目的任何地方直接访问，无需手动引入，从而提高开发效率和代码可读性。

我们需要增加一个装饰器，用于标识这个模块是全局的。

```ts
export type Globals = () => ClassDecorator

export const Globals: Globals = () => (target) => Reflect.defineMetadata(TokenConfig.Global, true, target)
```

### 为 `ConfigModule` 增加全局装饰器

```ts
@Globals()
@Module({
  providers: [ConfigService],
  exports: [ConfigService],
})
export class ConfigModule {}
```

接着，需要改造我们的 `AppFactory` 类。

增加一个 `globals` 私有属性。

```ts
// ...
  private globals = {
    providers: new Set<Constructor>()
  }
// ...
```

### 为 `AppFactory` 增加新方法

```ts
// ...
 private judgeIsGlobal(module: Constructor) {
    return Reflect.hasMetadata(TokenConfig.Global, module) && Reflect.getMetadata(TokenConfig.Global, module)
  }
// ...
```

### 改造 `AppFactory.parseModule`

```ts
  private parseModule(module: Constructor) {
    if (!Reflect.hasMetadata(TokenConfig.Moudle, module)) {
      throw new TypeError(`${module.name} Not Module!`)
    }

    const isGlobal = this.judgeIsGlobal(module)

    const { providers, controllers, imports, exports } = Reflect.getMetadata(
      TokenConfig.Moudle,
      module,
    ) as ModuleConfig

    const importProviders = Array.from(new Set(imports.sort((a, b) => {
      if (this.judgeIsGlobal(a)) return -1
      if (this.judgeIsGlobal(b)) return 1
      return 0
    }).flatMap((m) => this.parseModule(m))))

    if (isGlobal) {
      exports.map(provider => this.globals.providers.add(provider))
    }

    for (const controller of controllers) {
      this.app.use(this.parseController(controller, [].concat(providers, importProviders, Array.from(this.globals.providers))))
    }


    return exports
  }
```

以上代码中, 因为 `Module.imports` 可能全局模块在局部模块后，导致会优先解析局部模块，因此进行了排序。将全局模块调度到前面。
