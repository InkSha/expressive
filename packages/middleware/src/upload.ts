import { MiddleContext, Middleware } from './middleware'

export class FileUpload extends Middleware {
  public use(ctx: MiddleContext): boolean {
    return true
  }
}
