import {
  type Constructor,
  type ParamsInfo,
  type RequestType,
  HttpRequestName,
  HTTPException,
  StatusCode,
  TokenConfig,
} from "@expressive/common"
import express from "express"

export class Router {
  private readonly router = express.Router()

  constructor(private readonly controller: Constructor) {}

  public bindRouter(entity: Object) {
    const baseUrl = Reflect.getMetadata(TokenConfig.Controller, this.controller)
    const entityMethodNames = this.getMethodList(this.controller)

    for (const name of entityMethodNames) {
      const { fn, url, method, params, statusCode } = this.parseRouterFnData(entity, name, baseUrl)

      this.router[HttpRequestName[method]](url, async (req, res) => {
        const p = this.getParams(req, params)

        if (statusCode) res.status(statusCode)

        this.callHandle(fn, entity, p).then((data) => res.send(data))
      })
    }

    return this.router
  }

  private getParams(req: express.Request, params?: ParamsInfo[]) {
    const p = []

    if (params) {
      p.push(...new Array(Math.max(...params.map((v) => v.index))))
      for (const { type, index, prototype } of params) {
        p[index] = prototype ? req[type][prototype] : req[type]
      }
    }

    return p
  }

  private getMethodList = (entity: Constructor) => {
    return entity.prototype
      ? Object.getOwnPropertyNames(entity.prototype).filter((name) => name !== "constructor")
      : []
  }

  private async callHandle(fn: Function, caller: Object, params: unknown[]) {
    const result = {
      code: StatusCode.SUCCESS,
      msg: "Success",
      data: null,
    }
    try {
      const data = fn.call(caller, ...params)

      result.data = data instanceof Promise ? await data : data
    } catch (e: unknown) {
      const isHTTPException = e instanceof HTTPException

      result.code = isHTTPException ? e.code : StatusCode.NOT_FOUND
      result.msg = isHTTPException ? e.message : "unknown error"
    }

    return result
  }

  private parseRouterFnData(entity: Object, name: string, baseUrl = "/") {
    const fn = entity[name] as (...args: unknown[]) => unknown
    const url = this.join(baseUrl, Reflect.getMetadata(TokenConfig.Router, fn) as string)
    const method = Reflect.getMetadata(TokenConfig.RouterMethod, fn) as RequestType
    const params = Reflect.getMetadata(TokenConfig.Params, fn) as ParamsInfo[]
    const statusCode = Reflect.getMetadata(TokenConfig.HttpStatus, fn) as StatusCode | undefined

    return { fn, url, method, params, statusCode }
  }

  private join(...urls: string[]) {
    return urls
      .map((url) => url.replaceAll("\\", "/"))
      .join("/")
      .replace(/\/{2,}/g, "/")
  }
}
