import { Injectable, NotFoundException } from "@expressive/common"
import { TagsService } from "../tags/tags.service"
import { GroupService } from "../group/group.service"

@Injectable()
export class ArticleService {
  public count = 0

  constructor(
    private readonly tags: TagsService,
    private readonly group: GroupService,
  ) {
    console.log("article init")
    console.log("tags", tags.count)
    console.log("group", group.count)
  }

  createArticle() {
    const tags = [this.tags.generateTag(), this.tags.generateTag()]
    const group = this.group.generateGroup()
    return {
      tags,
      group,
      title: this.generateTitle(),
      content: this.generateContent(),
      count: {
        tags: this.tags.count,
        group: this.group.count,
        count: this.count,
      },
    }
  }

  countArticles(name: string) {
    switch (name) {
      case "admin":
        return 33
      case "test":
        return 22
      case "user":
        return 11
      default:
        throw new NotFoundException(`user ${name} not found`)
    }
  }

  generateTitle() {
    this.count++

    return new Array(Math.floor(Math.random() * 6 + 1))
      .fill(0)
      .map(() => Math.floor(Math.random() * 36 + 1).toString(36))
      .join("")
  }

  generateContent() {
    this.count++

    return new Array(Math.floor(Math.random() * 64 + 32))
      .fill(0)
      .map(() => Math.floor(Math.random() * 36 + 1).toString(36))
      .join("")
  }
}
