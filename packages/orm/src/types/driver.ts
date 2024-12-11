import { BaseSchema, SchemaField } from './schema'

export interface Driver<Connection = unknown> {
  execute(sql: string, ...params: unknown[]): Promise<unknown>
  getConnection<R = unknown>(callback: (connection: Connection) => R): Promise<R>
  buildTable(schema: BaseSchema): string
  dropTable(schema: BaseSchema): string
  alterField(fiel: SchemaField): string
}

export type MySqlDriverConfig = {
  database: string
  username: string
  password: string
  host: string
}

export type DriverConfig =
  | {
    database: 'mysql'
    config: MySqlDriverConfig
  }
