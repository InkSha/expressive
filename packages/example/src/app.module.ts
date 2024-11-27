import { Module, ProviderType } from "@expressive/common"
import { UserModule } from "./modules/user/user.module"
import { ConfigModule } from '@expressive/config'
import { DTOPipe } from '@expressive/dto'
import { Logger } from './middlewares'

@Module({
  imports: [UserModule, ConfigModule],
  providers: [
    { type: ProviderType.PIPE, provider: DTOPipe },
    { type: ProviderType.MIDDLEWARE, provider: Logger }
  ]
})
export class AppModule {}
