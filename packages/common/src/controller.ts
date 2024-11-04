import { TokenConfig } from "./token"

export type Controller = (baseUrl?: string) => ClassDecorator
export const Controller: Controller =
  (baseUrl = "/") =>
  (target) => {
    const prefix = !baseUrl.startsWith("/") ? `/${baseUrl}` : baseUrl

    Reflect.defineMetadata(TokenConfig.Controller, prefix, target)
  }
