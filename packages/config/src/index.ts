import { config } from "dotenv"
import fs from "node:fs"
import { Injectable, Module } from "@expressive/common"
import path from "node:path"

@Injectable()
export class ConfigService {
  constructor() {
    const cwd = process.cwd()
    config({
      path: fs
        .readdirSync(cwd)
        .filter((p) => fs.statSync(path.join(cwd, p)).isFile())
        .filter((file) => file.startsWith(".env")),
    })
  }

  public getEnv(key: string, defaultValue: string): string {
    const value = process.env[key]
    return value === undefined ? defaultValue : value
  }
}

@Module({
  providers: [ConfigService],
  exports: [ConfigService],
})
export class ConfigModule {}
