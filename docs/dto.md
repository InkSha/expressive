# 数据传输

DTO 全称为 `Data Transfer Object` （数据传输对象）。

通常用于在不同的系统、层或服务之间传递数据。DTO 主要用于 封装数据，它不包含任何业务逻辑，主要是作为数据的载体进行传输，目的是 减少方法调用的数量和减少数据冗余。

常用于 API, 业务之间的数据传输。

```ts
export class CreateArticleDTO {
  title: string
  content: string
  author: string
}
```

上面的 `CreateArticleDTO` 是一个基本的 DTO 示例。

它定义了创建一个文章所需要的数据内容。

而通常，我们还需要对 DTO 进行验证，保证数据格式正确。

下面将实现一个简单的 DTO 及校验。

## DTO 示例

下面是一个简单的 DTO 的示例。

```ts
export class UserInfoDTO {
  // id 不允许为空 且只能在 22,23,24 这个范围内
  @NotEmpty()
  @IsNumber({ inSet: [22, 23, 24] })
  id: number

  // name 不允许为空 且长度在 2 ~ 3 这个范围内
  @NotEmpty()
  @IsString({ minLength: 2, maxLength: 3 })
  name: string

  // student 不允许为空 且必须为 false
  @NotEmpty()
  @IsBoolean({ isFalse: true })
  student: boolean

  // age 值必须在 20 ~ 24 范围内
  @NotEmpty()
  @IsNumber({ max: 24, min: 20 })
  age: number

  // skills 最小长度为 3, 可选
  @IsOptional()
  @IsArray({ minLength: 3 })
  skills: Array<string>

  // info 是一个对象
  @IsObject()
  info: Record<string, string>
}
```

## 实现校验装饰器

透过以上代码，可以看见，它运用到了装饰器。
所以我们需要先实现装饰器

而在此之前，我们需要首先定义一份配置类型。

```ts
export interface BaseConfig<C = Record<string, unknown>> {
  // 校验配置
  config: C
  // 校验方法
  verify: (val: unknown, config: C) => [boolean, string, string]
  // 校验提示
  reason?: Record<keyof C, string>
  // 优先级
  first?: number
  // 失败是否继续
  failureContinue?: boolean
  // 是否跳过其他校验器
  skipOtherValidator?: boolean
}
```

然后去实现我们的装饰器。

以下是用于校验数组的 `IsArray` 装饰器。

```ts
import { Validator, type BaseConfig, addValidator } from "./base"
export const isArray = Array.isArray

export type IsArrayConfig = Partial<{
  maxLength: number
  minLength: number
  equalLength: number
  notEqualLength: number
}>

export const is_array: BaseConfig<IsArrayConfig>["verify"] = (val, config) => {
  // 我们需要首先判断是否是数组
  // 如果不是数组 那么后续的校验就不必进行了
  if (isArray(val)) {
    // 这里声明一个工具函数 用于生成错误信息
    const buildInfo = Validator.failureInfo<IsArrayConfig>

    // 分别判断条件
    if (config.equalLength && val.length !== config.equalLength) {
      return buildInfo(`length not equal ${config.equalLength}`, "equalLength")
    }
    if (config.maxLength && val.length > config.maxLength) {
      return buildInfo(`length larger than ${config.maxLength}`, "maxLength")
    }
    if (config.minLength && val.length < config.minLength) {
      return buildInfo(`length smaller than ${config.minLength}`, "minLength")
    }
    if (config.notEqualLength && val.length === config.notEqualLength) {
      return buildInfo(`length should not equal ${config.notEqualLength}`, "notEqualLength")
    }

    return [true, "", ""]
  }
  return Validator.failureInfo("not array", "")
}

export const IsArray =
  (config?: IsArrayConfig): PropertyDecorator =>
  (target, property) => {
    addValidator(target, property, { config, verify: is_array })
  }
```

以上就是一个校验装饰器了。其他的装饰器的大体结构基本和这个差不多。

## 实现校验

在上面的代码中，可以看见从外部引入了工具方法。

本节将实现这些工具方法。

### 获取全局环境

我们需要将校验配置进行存储。为了防止多个实例导致配置丢失。
这里选择将配置挂载到全局，使得每一个实例获取的都是同一个配置。

所以首先需要实现一个获取全局的方法。

```ts
export function getGlobal() {
  if (typeof globalThis !== "undefined") {
    return globalThis
  }

  if (typeof global !== "undefined") {
    return global
  }

  // @ts-ignore: Cannot find name 'window'.
  if (typeof window !== "undefined") {
    // @ts-ignore: Cannot find name 'window'.
    return window
  }

  // @ts-ignore: Cannot find name 'self'.
  if (typeof self !== "undefined") {
    // @ts-ignore: Cannot find name 'self'.
    return self
  }
}
```

### 实现校验类

整体思路如下：

- 首先需要存储配置，这里选择的是双重 Map， 第一层是数据原型，第二层是每个 Key 对应的校验配置。
- 然后需要保证配置不会丢失，这里选择的是使用单例模式，将配置挂载到全局。
- 接着需要有一个可以增加配置的方法，用于对原型增加校验的配置。
- 在保证配置不丢失且可以增加的情况下，需要对实例进行校验。

```ts
export class Validator {

  private object: Map<Object, Map<string | symbol, BaseConfig[]>>

  constructor() {
    const global = getGlobal()
    if (global.validator) {
      this.object = global.validator
    } else {
      this.object = global.validator = new Map()
    }
  }

  public hasValidator(target: Object): boolean {
    return this.object.has(target)
  }

  public addValidator(
    target: Object,
    property: string | symbol,
    {
      config = {},
      reason = {},
      first = 0,
      verify = () => [true, "", ""],
      skipOtherValidator = false,
    }: BaseConfig,
  ) {
    const map = this.object.get(target) || new Map()
    const validators: BaseConfig[] = map.has(property) ? map.get(property) : []

    validators.push({ config, reason, verify, first, skipOtherValidator })
    map.set(property, validators)
    this.object.set(target, map)
  }

  public validatorObject(target: Object): [boolean, string] {
    if (this.object.has(target.constructor)) {
      const validators = this.object.get(target.constructor)

      for (const [property, configs] of validators.entries()) {
        for (const { verify, config, reason = {}, skipOtherValidator } of configs.sort(
          (a, b) => b.first - a.first,
        )) {
          const [pass, msg, key] = verify(target[property], config)

          if (!pass) {
            return [pass, key in reason ? reason[key] : `${String(property)} ${msg}`]
          }
          if (skipOtherValidator) {
            break
          }
        }
      }
    }
    return [true, ""]
  }

  public static failureInfo<Config extends {} = Record<string, unknown>>(
    msg: string,
    property: keyof Config,
  ): [boolean, string, keyof Config] {
    return [false, msg, property]
  }
}

export const parseDTO: Validator["validatorObject"] = (target) =>
  new Validator().validatorObject(target)

export const addValidator: Validator["addValidator"] = (target, property, config) => {
  new Validator().addValidator(target.constructor, property, config)
}

export const hasValidator: Validator["hasValidator"] = (target) =>
  new Validator().hasValidator(target)
```

## 根据原型进行实例化

这一步其实简单来说并没有什么太复杂的内容。就是实例化一个 DTO 对象，然后将传递过来的数据赋值给它。

简单的实现如下：

```ts
export const assignmentObject = <T>(raw: { new (...args: unknown[]): T }, data: Object) => {
  const obj = new raw()
  const json = JSON.parse(JSON.stringify(data))
  // Object.keys 虽然存在一些局限性
  // 比如无法获取 Symbol，只能获取可枚举属性等
  // 但因为我们的 data 对象是一个请求发送过来的 JSON
  // 因此可以忽略
  for (const key of Object.keys(obj)) {
    obj[key] = json[key]
  }
  return obj
}
```

## 绑定到路由

以上步骤完成后，我们就实现了一个可以自动配置校验规则，可以根据传递数据进行实例化赋值，可以根据校验规则进行校验并返回校验信息的校验库。

接着，我们需要将它绑定到路由中去。

```ts
// 增加 POST /user/info 路由 （记得配置 Body Parser 和 cors）
// 它接收一个 UserInfo DTO
// 这个 UserInfoDTO 就是在前面定义的
//...
  @Post("info")
  public async getUserInfo(@Body() userInfo: UserInfoDTO) {
    return {
      userInfo,
    }
  }
//...
```

### 客户端错误

我们首先为 `StatusCode` 增加一个属性 `BAD_REQUEST`, 值为对应的 HTTP 状态码 400。

然后实现一个 `BadRequestException`。

```ts
export class BadRequestException extends HTTPException {
  public name = "BadRequest"
  public code = StatusCode.BAD_REQUEST
}
```

## 改造 Router

我们的 DTO 校验是作用在路由接受请求时，此时需要先校验参数，然后才调用对应服务，因此需要改造 Router 类。

### 改造 `Router.parseRouterFnData`

```ts
  // 改成这样即可
  // 和原先的区别在于元数据的获取和定义方式变了
  // 由原先的 Reflect.getMetadata(label, target[key]) 变成了 Reflect.getMetadata(label, target, key)
  // 两者的区别简单来说就是一个是存储在 target[key] 这个具体属性上，一个是存储在 target 上
  // 记得修改对应的 Reflect.defineMetadata
  private parseRouterFnData(entity: Object, name: string, baseUrl = "/") {
    const fn = entity[name] as (...args: unknown[]) => unknown
    const url = this.join(baseUrl, Reflect.getMetadata(TokenConfig.Router, entity, name) as string)
    const method = Reflect.getMetadata(TokenConfig.RouterMethod, entity, name) as RequestType
    const params = Reflect.getMetadata(TokenConfig.Params, entity, name) as ParamsInfo[]
    const statusCode = Reflect.getMetadata(TokenConfig.HttpStatus, entity, name) as StatusCode

    return { fn, url, method, params, statusCode }
  }
```

### 改造 `Router.callHandle`

```ts
  // 原先是将 fn, caller, params 传入在内部使用 call 调用的
  // 这里改为传入一个回调
  private async callHandle(fn: Function) {
    return new Promise((resolve, reject) => {
      // 需要注意的是
      // 这里的 try ... catch 只能处理同步的异常
      // 无法处理异步异常
      try {
        resolve(fn())
      } catch (e: unknown) {
        // 同步异常直接 reject
        // 异步异常则不经过此处直接跳到 Promise.catch
        reject(e)
      }
    })
    // 因此需要多加一层 Promise.catch 进行异常处理
    .catch((e: unknown) => {
      const isHTTPException = e instanceof HTTPException
      return {
        code: isHTTPException ? e.code : StatusCode.INTERNAL_SERVER_ERROR,
        msg: isHTTPException ? e.message : "unknown error",
        data: null,
      }
    })
  }
```

### 改造 `Router.getParams`

```ts
  // 为 params 增加一个默认值
  private getParams(
    req: express.Request,
    res: express.Response,
    next: express.NextFunction,
    params: ParamsInfo[] = [],
  ) {
    // 更改 p 的初始化方式
    const p = new Array(
      Math.max.apply(
        Math,
        params.map((v) => v.index),
      ),
    ).fill(undefined)

    if (params.length) {
      for (const { type, index, property, proto } of params) {
        // proto 是新增的参数类型
        // 这里进行判断这个类型是否存在校验
        const has = hasValidator(proto)

        switch (type) {
          case RequestParam.REQUEST:
            p[index] = property ? req[property] : req
            break
          case RequestParam.RESPONSE:
            p[index] = property ? res[property] : res
            break
          case RequestParam.NEXT:
            p[index] = next
            break
          case RequestParam.BODY:
            // 为 body 和 query 单独进行判断
            p[index] = has
              // 存在校验就实例化
              ? assignmentObject(proto, req.body)
              // 否则就正常流程
              : property
                ? req.body[property]
                : req.body
            break
          case RequestParam.QUERY:
            p[index] = has
              ? assignmentObject(proto, req.query)
              : property
                ? req.query[property]
                : req.query
            break
          case RequestParam.PARAMS:
            p[index] = property ? req.params[property] : req.params
            break
          case RequestParam.HEADERS:
            p[index] = property ? req.headers[property] : req.headers
            break
        }

        if (has) {
          // 进行校验数据是否合法
          const [pass, reason] = parseDTO(p[index])
          // 未通过就将错误提示传入并返回一个异常
          if (!pass) {
            throw new BadRequestException(reason)
          }
        }
      }
    }
    return p
  }
```

### 改造 `Router.bindRouter`

```ts
  public bindRouter(entity: Object) {
    const baseUrl = Reflect.getMetadata(TokenConfig.Controller, this.controller)
    const entityMethodNames = this.getMethodList(this.controller)

    for (const name of entityMethodNames) {
      const { fn, url, method, params, statusCode } = this.parseRouterFnData(entity, name, baseUrl)

      this.router[HttpRequestName[method]](url, async (req, res, next) => {
        // 首先设置正常的 http 状态码
        // 如果后续的路由处理发生了异常就会被替换
        // 如果是在最后设置就会导致异常的状态码错误
        if (statusCode) res.status(statusCode)

        this.callHandle(() => {
          // 将参数的获取移入到回调函数内容
          // 因为 getParams 现在兼顾校验 DTO，也会抛出异常
          const p = this.getParams(req, res, next, params)
          return fn.apply(entity, p)
        }).then((data) => {
          res.send(data)
        })
      })
    }

    return this.router
  }
```

完成以上步骤后，我们已经完成了 DTO 的配置，校验和绑定路由了。

可以通过访问 POST `/user/info` 并传递值进行查看。
