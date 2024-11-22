import "reflect-metadata"
// import { AppFactory } from "@expressive/core"
import { AppCore } from '@expressive/core/src/core'
import { AppModule } from "./app.module"
// const boostrap = () => {
//   const app = new AppFactory(AppModule)
//   app.start(3000)
// }
// boostrap()

const core = new AppCore(AppModule)

console.dir(core, { depth: 20 })
