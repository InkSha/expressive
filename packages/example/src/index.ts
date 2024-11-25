import "reflect-metadata"
import { AppCore } from '@expressive/core/src/core'
import { AppModule } from "./app.module"
const boostrap = () => {
  const core = new AppCore(AppModule)
  core.start(3000, () => {
    console.log('run')
    // console.dir(core, { depth: 20 })
  })
}
boostrap()
