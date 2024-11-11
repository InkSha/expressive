import { StatusCode } from "./http"

export abstract class HTTPException extends Error {
  public abstract readonly code: StatusCode
  public abstract readonly name: string
}

export class NotFoundException extends HTTPException {
  public name = "NotFoundAssets"
  public code = StatusCode.NOT_FOUND
}

export class BadRequestException extends HTTPException {
  public name = "BadRequest"
  public code = StatusCode.BAD_REQUEST
}
