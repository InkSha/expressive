import type { Request, Response } from 'express'

export interface MiddleContext {
  request: Request
  response: Response
}

export abstract class Middleware {
  public abstract use(ctx: MiddleContext): boolean
}
