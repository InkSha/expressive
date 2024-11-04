import { Controller, Get, NotFound, Param } from "@expressive/common"
import type { AppService } from "./app.service"

@Controller("user")
export class AppController {
  constructor(private readonly service: AppService) {
    console.log("init", service)
  }

  @Get("home")
  public Home() {
    return {
      code: 200,
      data: "home",
    }
  }

  @Get("not-found")
  @NotFound()
  public async NotFound() {
    return {
      code: 200,
      data: null,
      msg: "not found",
    }
  }

  @Get("login")
  public async Login(@Param("name") name: string, @Param("pwd") pwd: string) {
    return this.service.login(name, pwd).then((pass) => {
      return {
        code: 200,
        data: "login",
        count: this.service.count(),
        msg: pass ? "success" : "failure",
      }
    })
  }

  @Get("register")
  public register() {
    return Promise.resolve({ code: 200, data: "register" })
  }
}

@Controller("user")
export class UserController {
  constructor(private readonly service: AppService) {
    console.log("init", service)
  }

  @Get("test")
  public test() {
    return {
      count: this.service.count(),
    }
  }

  @Get("test-error")
  public testError() {
    return this.service.notFound()
  }
}
