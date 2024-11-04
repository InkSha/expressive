import { Module } from "@expressive/common"
import { UserModule } from "./modules/user/user.module"
@Module({
  imports: [UserModule],
})
export class AppModule {}
