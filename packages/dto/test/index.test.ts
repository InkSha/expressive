import { assignmentObject, parseDTO } from "../src/index"
import { UserInfoDTO } from "./userInfo"

describe("test dto validator", () => {
  it("test userInfo DTO", () => {
    const data = assignmentObject(UserInfoDTO, {
      id: 23,
      name: "ada",
      student: false,
      age: 24,
      // skills: [1, 2, 3, 4],
      info: {},
    })
    const [pass, reason] = parseDTO(data)

    expect(pass).toBe(true)
    expect(reason).toBe("")
  })
})
