import {
  type Constructor,
  type ParamsInfo,
  type RequestType,
  type Middleware,
  HttpRequestName,
  HTTPException,
  StatusCode,
  TokenConfig,
  RequestParam,
  BadRequestException,
} from "@expressive/common"
import { assignmentObject, hasValidator, parseDTO } from "@expressive/dto"
import express, { NextFunction, Request, Response } from "express"

export class Router {
  private readonly router = express.Router()

  constructor(private readonly controller: Constructor) {}

  public bindRouter(entity: Object) {
    const baseUrl = Reflect.getMetadata(TokenConfig.Controller, this.controller)
    const entityMethodNames = this.getMethodList(this.controller)
    const baseMiddlewares = (Reflect.getMetadata(TokenConfig.ModuleMiddleware, this.controller) || []) as Array<Constructor<Middleware>>

    for (const name of entityMethodNames) {
      const { fn, url, method, params, statusCode, middlewares: routerMiddlewares = [] } = this.parseRouterFnData(entity, name, baseUrl)

      this.router[HttpRequestName[method]](url,
        baseMiddlewares
          .concat(routerMiddlewares)
          .map(Middleware => new Middleware().use),
        async (req: Request, res: Response, next: NextFunction) => {
          if (statusCode) res.status(statusCode)
          this.callHandle(() => {
            const p = this.getParams(req, res, next, params)
            return fn.apply(entity, p)
          }).then((data) => {
            res.send(data)
          })
        }
      )
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

    const param = {
      [RequestParam.REQUEST]: req,
      [RequestParam.RESPONSE]: res,
      [RequestParam.NEXT]: next,
      [RequestParam.BODY]: req.body,
      [RequestParam.QUERY]: req.query,
      [RequestParam.PARAMS]: req.params,
      [RequestParam.HEADERS]: req.headers,
    }

    if (params.length) {
      for (const { type, index, property, proto, pipes } of params) {
        const has = hasValidator(proto)

        if (type in param) {
          p[index] = param[type]
        }

        if (has) {
          if (typeof p[index] === 'object') {
            if (has) {
              p[index] = assignmentObject(proto, p[index])
            }
            else if (property) {
              p[index] = p[index][property]
            }
          }

          const [pass, reason] = parseDTO(p[index])
          if (!pass) {
            throw new BadRequestException(reason)
          }
        }
        p[index] = pipes.reduce((value, pipe) => pipe.transform(value), p[index])
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
    const middlewares = Reflect.getMetadata(TokenConfig.ModuleMiddleware, entity, name) as Array<Constructor<Middleware>>

    return { fn, url, method, params, statusCode, middlewares }
  }

  private join(...urls: string[]) {
    return urls
      .map((url) => url.replaceAll("\\", "/"))
      .join("/")
      .replace(/\/{2,}/g, "/")
  }
}
