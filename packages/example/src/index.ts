import {
  Controller,
  Get,
  Injectable,
  Module,
  NotFound,
  NotFoundException,
  Param,
} from "@expressive/common"
import { AppFactory } from "@expressive/core"

@Injectable()
class AppService {
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

@Controller("user")
class AppController {
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
class UserController {
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

@Module({
  controllers: [AppController, UserController],
  providers: [AppService],
})
class AppModule {}

const boostrap = () => {
  const app = new AppFactory(AppModule)

  app.start(3000)
}

boostrap()
