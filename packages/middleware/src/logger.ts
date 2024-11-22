import { MiddleContext, Middleware } from './middleware'

export class Logger extends Middleware {
  public use(ctx: MiddleContext): boolean {
    return true
  }
}
