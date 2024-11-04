import { Injectable, NotFoundException } from "@expressive/common"

@Injectable()
export class UserService {
  private _count = 0

  constructor() {
    console.log("service init")
  }
  public async login(name: string, pwd: string) {
    if (name === "error") {
      return this.notFound()
    }
    return name === "test" && pwd === "123"
  }

  public count() {
    return this._count++
  }

  public notFound() {
    throw new NotFoundException("Not Found User!")
  }
}
