import { Module } from "@expressive/common"
import { TagsService } from "./tags.service"
import { TagsController } from "./tags.controller"

@Module({
  controllers: [TagsController],
  providers: [TagsService],
  exports: [TagsService],
})
export class TagsModule {}
