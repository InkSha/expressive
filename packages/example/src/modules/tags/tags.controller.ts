import { Controller, Get } from "@expressive/common"
import { TagsService } from "./tags.service"

@Controller("tags")
export class TagsController {
  constructor(private readonly service: TagsService) {}

  @Get("/random")
  async randomTag() {
    return this.service.generateTag()
  }
}
