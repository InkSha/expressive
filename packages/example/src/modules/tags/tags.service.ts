import { Injectable } from "@expressive/common"

@Injectable()
export class TagsService {
  public count = 0

  constructor() {
    console.log("tags init")
  }

  generateTag() {
    this.count++

    return new Array(Math.floor(Math.random() * 16 + 1))
      .fill(0)
      .map(() => Math.floor(Math.random() * 36 + 1).toString(36))
      .join("")
  }
}
