import { Controller, Get } from "@expressive/common"
import { GroupService } from "./group.service"

@Controller("group")
export class GroupController {
  constructor(private readonly service: GroupService) {}

  @Get("/random")
  async randomTag() {
    return this.service.generateGroup()
  }
}
