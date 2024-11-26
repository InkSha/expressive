import { Middleware } from '@expressive/common'
import { Request, Response, NextFunction } from 'express'

export class Auth extends Middleware {
  public use(req: Request, res: Response, next: NextFunction): void {
    console.log('need auth')

    if (req.headers) {
      console.log({ token: req.headers.token })
    }

    next()
  }
}
