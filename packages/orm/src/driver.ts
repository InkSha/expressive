import { MysqlDriver } from './mysql'
import { Driver, DriverConfig } from './types'

export class DriverManager {
  constructor(
    private readonly config: DriverConfig
  ) {}

  public getDriver(): Driver {
    const { config, database } = this.config
    switch (database) {
      case 'mysql':
        return new MysqlDriver(config)
      default:
        // biome-ignore lint/correctness/noSwitchDeclarations: <explanation>
        const n: never = database
    }
  }
}
