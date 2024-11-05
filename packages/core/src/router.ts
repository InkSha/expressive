import {
  type Constructor,
  type ParamsInfo,
  type RequestType,
  HttpRequestName,
  HTTPException,
  StatusCode,
  TokenConfig,
  RequestParam,
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

      this.router[HttpRequestName[method]](url, async (req, res, next) => {
        const p = this.getParams(req, res, next, params)

        if (statusCode) res.status(statusCode)

        this.callHandle(fn, entity, p).then((data) => res.send(data))
      })
    }

    return this.router
  }

  private getParams(
    req: express.Request,
    res: express.Response,
    next: express.NextFunction,
    params?: ParamsInfo[],
  ) {
    const p = []

    if (params) {
      p.push(...new Array(Math.max(...params.map((v) => v.index))))
      for (const { type, index, property } of params) {
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
            p[index] = property ? req.body[property] : req.body
            break
          case RequestParam.QUERY:
            p[index] = property ? req.query[property] : req.query
            break
          case RequestParam.PARAMS:
            p[index] = property ? req.params[property] : req.params
            break
          case RequestParam.HEADERS:
            p[index] = property ? req.headers[property] : req.headers
            break
        }
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
    try {
      return fn.call(caller, ...params)
    } catch (e: unknown) {
      const isHTTPException = e instanceof HTTPException
      return {
        code: isHTTPException ? e.code : StatusCode.INTERNAL_SERVER_ERROR,
        msg: isHTTPException ? e.message : "unknown error",
        data: null,
      }
    }
  }

  private parseRouterFnData(entity: Object, name: string, baseUrl = "/") {
    const fn = entity[name] as (...args: unknown[]) => unknown
    const url = this.join(baseUrl, Reflect.getMetadata(TokenConfig.Router, fn) as string)
    const method = Reflect.getMetadata(TokenConfig.RouterMethod, fn) as RequestType
    const params = Reflect.getMetadata(TokenConfig.Params, fn) as ParamsInfo[]
    const statusCode = Reflect.getMetadata(TokenConfig.HttpStatus, fn) as StatusCode

    return { fn, url, method, params, statusCode }
  }

  private join(...urls: string[]) {
    return urls
      .map((url) => url.replaceAll("\\", "/"))
      .join("/")
      .replace(/\/{2,}/g, "/")
  }
}
