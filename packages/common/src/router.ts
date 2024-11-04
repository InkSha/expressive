import { StatusCode, RequestType } from "./http"
import { TokenConfig } from "./token"

export type Router = (url?: string) => MethodDecorator
export type HTTPStatus = () => MethodDecorator

type GenerateRouter = (type: RequestType) => Router
type GenerateHTTPStatus = (code: StatusCode) => HTTPStatus

const GenerateRouter: GenerateRouter = (type) => (url) => (target, name) => {
  Reflect.defineMetadata(TokenConfig.RouterMethod, type, target[name])
  Reflect.defineMetadata(TokenConfig.Router, url, target[name])
}

const GenerateHTTPStatus: GenerateHTTPStatus = (code) => () => (target, name) => {
  Reflect.defineMetadata(TokenConfig.HttpStatus, code, target[name])
}

export const Get = GenerateRouter(RequestType.GET)
export const Post = GenerateRouter(RequestType.POST)
export const Put = GenerateRouter(RequestType.PUT)
export const Patch = GenerateRouter(RequestType.PATCH)
export const Delete = GenerateRouter(RequestType.DELETE)

export const Success = GenerateHTTPStatus(StatusCode.SUCCESS)
export const NotFound = GenerateHTTPStatus(StatusCode.NOT_FOUND)
