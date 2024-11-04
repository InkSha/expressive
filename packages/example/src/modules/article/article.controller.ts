import { Controller, Get } from "@expressive/common"
import { ArticleService } from "./article.service"

@Controller("articles")
export class ArticleController {
  constructor(private readonly service: ArticleService) {}

  @Get("create")
  create() {
    return this.service.createArticle()
  }
}
