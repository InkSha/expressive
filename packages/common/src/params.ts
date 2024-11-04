import { RequestParam } from "./http"
import { TokenConfig } from "./token"

export interface ParamsInfo {
  prototype: string
  index: number
  type: RequestParam
}

export type Params = (prototype?: string) => ParameterDecorator

type GenerateParam = (type: RequestParam) => Params

const GenerateParam: GenerateParam = (type) => (prototype?: string) => (target, key, index) => {
  const data: ParamsInfo[] = Reflect.getMetadata(TokenConfig.Params, target[key]) ?? []
  data.push({ type, index, prototype })
  Reflect.defineMetadata(TokenConfig.Params, data, target[key])
}

export const Request = GenerateParam(RequestParam.REQUEST)
export const Response = GenerateParam(RequestParam.RESPONSE)
export const Query = GenerateParam(RequestParam.QUERY)
export const Body = GenerateParam(RequestParam.BODY)
export const Param = GenerateParam(RequestParam.PARAM)
export const Next = GenerateParam(RequestParam.NEXT)
export const Header = GenerateParam(RequestParam.HEADERS)
