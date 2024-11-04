import { Module } from "@expressive/common"
import { GroupService } from "./group.service"
import { GroupController } from "./group.controller"

@Module({
  controllers: [GroupController],
  providers: [GroupService],
  exports: [GroupService],
})
export class GroupModule {}
