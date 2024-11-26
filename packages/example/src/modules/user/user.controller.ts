import { Body, Controller, Get, Post, Query, UseMiddleware } from "@expressive/common"
import { UserService } from "./user.service"
import { ArticleService } from "../article/article.service"
import { UserInfoDTO } from "./dto/info.dto"
import { ConfigService } from "@expressive/config"
import { Auth, Logger } from '../../middlewares'
import { TransformInt } from '../../pipes/transformInt'

@UseMiddleware(Logger)
@Controller("user")
export class UserController {
  constructor(
    private readonly service: UserService,
    private readonly articles: ArticleService,
    private readonly config: ConfigService,
  ) {}

  @Get("login")
  public async Login(@Query("name") name: string, @Query("pwd") pwd: string) {
    return this.service.login(name, pwd).then((pass) => {
      return {
        code: 200,
        data: "login",
        count: this.service.count(),
        msg: pass ? "success" : "failure",
      }
    })
  }

  @Get('search')
  public async searchUser(@Query(new TransformInt('id')) id: number) {
    return { id, type: typeof id }
  }

  @Get("articles")
  @UseMiddleware(Auth)
  public async getArticles(@Query("name") name: string) {
    return {
      name,
      count: this.articles.count,
      articles: this.articles.countArticles(name),
    }
  }

  @Post("info")
  public async getUserInfo(@Body() userInfo: UserInfoDTO) {
    return {
      userInfo,
    }
  }

  @Get("version")
  public async getVersion() {
    const version = this.config.getEnv("VERSION", "example")
    const author = this.config.getEnv("AUTHOR", "example")
    const content = `version=${version} and author=${author}`
    return content
  }
}
