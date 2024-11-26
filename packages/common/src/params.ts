import { Pipe } from './base'
import { RequestParam } from "./http"
import { TokenConfig } from "./token"

export interface ParamsInfo {
  property: string
  index: number
  type: RequestParam
  proto: { new(): unknown }
  pipes: Pipe[]
}

export type Params = (property?: string | Pipe, ...pipes: Pipe[]) => ParameterDecorator

type GenerateParam = (type: RequestParam) => Params

const GenerateParam: GenerateParam = (type) => (property?: string | Pipe, ...pipes: Pipe[]) => (target, key, index) => {
  const data: ParamsInfo[] = Reflect.getMetadata(TokenConfig.Params, target, key) ?? []
  const proto = Reflect.getMetadata("design:paramtypes", target, key)[index]
  const isPipe = typeof property !== 'string'

  if (isPipe) {
    pipes.push(property)
  }

  data.push({ type, index, property: isPipe ? '' : property, proto, pipes })
  Reflect.defineMetadata(TokenConfig.Params, data, target, key)
}

export const Param = GenerateParam(RequestParam.PARAMS)
export const Query = GenerateParam(RequestParam.QUERY)
export const Body = GenerateParam(RequestParam.BODY)

export const Request = GenerateParam(RequestParam.REQUEST)
export const Response = GenerateParam(RequestParam.RESPONSE)
export const Next = GenerateParam(RequestParam.NEXT)
export const Header = GenerateParam(RequestParam.HEADERS)
