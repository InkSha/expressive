import type { NextFunction, Request, Response } from 'express'

export interface MiddlewareContext {
  request: Request
  response: Response
}

export abstract class Middleware {
  public abstract use(req: Request, res: Response, next: NextFunction): void
}
