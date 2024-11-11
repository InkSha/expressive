import { Module } from "@expressive/common"
import { UserController } from "./user.controller"
import { UserService } from "./user.service"
import { ArticleModule } from "../article/article.module"
import { ConfigModule } from "@expressive/config"

@Module({
  imports: [ArticleModule, ConfigModule],
  controllers: [UserController],
  providers: [UserService],
})
export class UserModule {}
