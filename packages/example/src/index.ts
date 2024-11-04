import { AppFactory } from "@expressive/core"
import { AppModule } from "./app.module"

const boostrap = () => {
  const app = new AppFactory(AppModule)

  app.start(3000)
}

boostrap()
