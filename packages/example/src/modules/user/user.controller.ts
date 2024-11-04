import { Controller, Get, Param } from "@expressive/common"
import { UserService } from "./user.service"
import { ArticleService } from "../article/article.service"

@Controller("user")
export class UserController {
  constructor(
    private readonly service: UserService,
    private readonly articles: ArticleService,
  ) {}

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

  @Get("articles")
  public async getArticles(@Param("name") name: string) {
    return {
      name,
      count: this.articles.count,
      articles: this.articles.countArticles(name),
    }
  }
}
