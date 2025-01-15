import type { Request } from 'express'

export abstract class Guard {
  public abstract canContinue(request: Request): boolean
}
