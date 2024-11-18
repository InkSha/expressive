import { Module } from "@expressive/common"
import { UserModule } from "./modules/user/user.module"
import { ConfigModule } from '@expressive/config'
@Module({
  imports: [UserModule, ConfigModule],
})
export class AppModule {}
