import { Module } from "@expressive/common"
import { ArticleController } from "./article.controller"
import { ArticleService } from "./article.service"
import { TagsModule } from "../tags/tags.module"
import { GroupModule } from "../group/group.module"

@Module({
  imports: [TagsModule, GroupModule],
  controllers: [ArticleController],
  providers: [ArticleService],
  exports: [ArticleService],
})
export class ArticleModule {}
