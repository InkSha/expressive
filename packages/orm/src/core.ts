import { DriverManager } from './driver'
import { DatabaseError } from './error'
import { SchemaManager } from './schema'
import { CoreConfig } from './types'

export class Core {
  constructor(
    private readonly config: CoreConfig
  ) {
    this.build()
  }

  private getSchemas() {
    return this.config.entities.map(entity => {
      if (!SchemaManager.hasEntity(entity)) {
        throw new DatabaseError(`not register ${entity.name}!`)
      }
      return SchemaManager.getEntity(entity)
    })
  }

  public build() {
    const driver = new DriverManager(this.config).getDriver()
    const schemas = this.getSchemas()
    // const tables = schemas.map(schema => new Table(schema))
  }
}
