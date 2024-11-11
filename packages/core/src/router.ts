import {
  type Constructor,
  type ParamsInfo,
  type RequestType,
  HttpRequestName,
  HTTPException,
  StatusCode,
  TokenConfig,
  RequestParam,
  BadRequestException,
} from "@expressive/common"
import { assignmentObject, hasValidator, parseDTO } from "@expressive/dto"
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
        if (statusCode) res.status(statusCode)
        this.callHandle(() => {
          const p = this.getParams(req, res, next, params)
          return fn.apply(entity, p)
        }).then((data) => {
          res.send(data)
        })
      })
    }

    return this.router
  }

  private getParams(
    req: express.Request,
    res: express.Response,
    next: express.NextFunction,
    params: ParamsInfo[] = [],
  ) {
    const p = new Array(Math.max.apply(Math, [0].concat(params.map((v) => v.index)))).fill(
      undefined,
    )

    if (params.length) {
      for (const { type, index, property, proto } of params) {
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
            p[index] = has
              ? assignmentObject(proto, req.body)
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
          const [pass, reason] = parseDTO(p[index])
          if (!pass) {
            throw new BadRequestException(reason)
          }
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

  private async callHandle(fn: Function) {
    return new Promise((resolve, reject) => {
      try {
        resolve(fn())
      } catch (e: unknown) {
        reject(e)
      }
    }).catch((e: unknown) => {
      const isHTTPException = e instanceof HTTPException
      return {
        code: isHTTPException ? e.code : StatusCode.INTERNAL_SERVER_ERROR,
        msg: isHTTPException ? e.message : "unknown error",
        data: null,
      }
    })
  }

  private parseRouterFnData(entity: Object, name: string, baseUrl = "/") {
    const fn = entity[name] as (...args: unknown[]) => unknown
    const url = this.join(baseUrl, Reflect.getMetadata(TokenConfig.Router, entity, name) as string)
    const method = Reflect.getMetadata(TokenConfig.RouterMethod, entity, name) as RequestType
    const params = Reflect.getMetadata(TokenConfig.Params, entity, name) as ParamsInfo[]
    const statusCode = Reflect.getMetadata(TokenConfig.HttpStatus, entity, name) as StatusCode

    return { fn, url, method, params, statusCode }
  }

  private join(...urls: string[]) {
    return urls
      .map((url) => url.replaceAll("\\", "/"))
      .join("/")
      .replace(/\/{2,}/g, "/")
  }
}
