import { TokenConfig } from "./token"

export type Injectable = () => ClassDecorator
export const Injectable: Injectable = () => (target) => {
  Reflect.defineMetadata(TokenConfig.Injectable, true, target)
}
