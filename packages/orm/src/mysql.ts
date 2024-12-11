import { DatabaseError } from './error'
import type { BaseFieldType, BaseSchema, Driver, MySqlDriverConfig, SchemaField } from './types'
import type { Pool, PoolConnection } from 'mysql2'

export class MysqlDriver implements Driver<PoolConnection> {

  private pool: Pool

  constructor(
    private config: MySqlDriverConfig
  ) {
    this.initalizePool()
  }

  private async initalizePool() {
    const mysql2 = await import('mysql2')
    this.pool = mysql2.createPool({
      user: this.config.username,
      password: this.config.password,
      database: this.config.database,
      host: this.config.host
    })
  }

  public async getConnection<R = unknown>(callback: (connection: PoolConnection) => R): Promise<R> {
    return new Promise((resolve, reject) => {
      this.pool.getConnection(async (error, connection) => {
        if (error) reject(error)
        else {
          try {
            const result = await callback(connection)
            resolve(result)
          }
          catch (e) {
            throw new DatabaseError(e)
          }
          finally {
            connection.release()
          }
        }
      })
    })
  }

  public async execute<R = unknown>(sql: string, ...params: unknown[]): Promise<R> {
    return new Promise((resolve, reject) => {
      this.pool.execute(sql, params)
        .on('result', resolve)
        .on('error', reject)
    })
  }

  private buildTableField(field: SchemaField): string {
    const result: string[] = []

    // column = `name`
    result.push(field.field)

    // column = `name varchar(255)`
    result.push(`${field.type}${field.constraint.maxLength ? `(${field.constraint.maxLength})` : ""}`)

    // column = `name varchar(255) not null`
    if (field.constraint.notNull || field.constraint.required) result.push('not null')

    // column = `name varchar(255) not null default "name"`
    if (field.constraint.default) {
      const val: string[] = []
      if (field.type === 'string') val.push('"')
      val.push(`${field.constraint.default}`)
      if (field.type === 'string') val.push('"')
      result.push(`default ${val.join('')}`)
    }

    // column = `name varchar(255) not null primary key`
    if (field.constraint.primary) {
      result.push('primary key')
    }

    // column = `name varchar(255) not null unique default "name"`
    if (field.constraint.unique) {
      result.push('unique')
    }

    // column = `id int auto_increment`
    if (field.type === 'number' && field.constraint.autoincrement) {
      result.push('auto_increment')
    }

    return result.join(' ')
  }

  public buildTable(schema: BaseSchema): string {
    return `create table if not exists ${schema.table} (
      ${schema.fields.map(field => this.buildTableField(field)).join('\n,')}
    );`
  }

  public dropTable(schema: BaseSchema): string {
    return `drop table if exists ${schema.table};`
  }

  public alterField(fiel: SchemaField): string {

  }

}
