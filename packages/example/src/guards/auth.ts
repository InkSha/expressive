import { BadRequestException, Guard } from '@expressive/common'
import { Request } from 'express'

export class Auth extends Guard {

  public canContinue(request: Request): boolean {
    console.log('need auth')

    if (request?.headers?.token !== '123456') {
      throw new BadRequestException('need auth')
    }

    return true
  }
}
