import { RequestParam } from "./http"
import { TokenConfig } from "./token"

export interface ParamsInfo {
  property: string
  index: number
  type: RequestParam
  proto: { new (): unknown }
}

export type Params = (property?: string) => ParameterDecorator

type GenerateParam = (type: RequestParam) => Params

const GenerateParam: GenerateParam = (type) => (property?: string) => (target, key, index) => {
  const data: ParamsInfo[] = Reflect.getMetadata(TokenConfig.Params, target, key) ?? []
  const proto = Reflect.getMetadata("design:paramtypes", target, key)[index]
  data.push({ type, index, property, proto })
  Reflect.defineMetadata(TokenConfig.Params, data, target, key)
}

export const Param = GenerateParam(RequestParam.PARAMS)
export const Query = GenerateParam(RequestParam.QUERY)
export const Body = GenerateParam(RequestParam.BODY)

export const Request = GenerateParam(RequestParam.REQUEST)
export const Response = GenerateParam(RequestParam.RESPONSE)
export const Next = GenerateParam(RequestParam.NEXT)
export const Header = GenerateParam(RequestParam.HEADERS)
