import { DriverConfig } from './driver'

export * from './schema'
export * from './decorator'
export * from './driver'

export type BaseCoreConfig = {
  entities: Function[]
  type: DriverConfig['database']
}
export type MySqlConfig = BaseCoreConfig & DriverConfig

export type CoreConfig = MySqlConfig
