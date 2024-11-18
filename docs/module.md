# 模块化

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
