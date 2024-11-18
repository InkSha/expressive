# 配置管理

这里使用到了 `dotenv` 库。

大体内容如下：

```ts
import { config } from "dotenv"
import fs from "node:fs"
import path from "node:path"

@Injectable()
export class ConfigService {
  constructor() {
    const cwd = process.cwd()
    // 将会读取项目根目录下的 .env 开头的所有文件
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
```
