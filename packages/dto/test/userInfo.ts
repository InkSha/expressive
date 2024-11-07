import {
  IsNumber,
  IsString,
  IsArray,
  IsBoolean,
  IsObject,
  NotEmpty,
  IsOptional,
} from "../src/index"

export class UserInfoDTO {
  @NotEmpty()
  @IsNumber({ inSet: [22, 23, 24] })
  id: number

  @NotEmpty()
  @IsString({ equalLength: 3, minLength: 2, maxLength: 3 })
  name: string

  @NotEmpty()
  @IsBoolean({ isFalse: true })
  student: boolean

  @NotEmpty()
  @IsNumber({ max: 24, min: 20 })
  age: number

  @IsOptional()
  @IsArray({ minLength: 3 })
  skills: Array<string>

  @IsObject()
  info: Record<string, string>
}
