import { Module } from "@expressive/common"
import { AppController, UserController } from "./app.controller"
import { AppService } from "./app.service"

@Module({
  controllers: [AppController, UserController],
  providers: [AppService],
})
export class AppModule {}
