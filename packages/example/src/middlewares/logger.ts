import { Middleware } from '@expressive/common'
import { Request, Response, NextFunction } from 'express'

export class Logger extends Middleware {
  constructor() {
    super()
    console.log('logger init')
  }

  public use(req: Request, res: Response, next: NextFunction): void {
    const info = [
      `[${req.method}]`,
      `[${req.url}]`,
      new Date().toLocaleString()
    ].join(' ')

    console.log(info)

    next()
  }
}
