import { DatabaseError } from './error'
import { BaseSchema, SchemaField } from './types'

// biome-ignore lint/complexity/noStaticOnlyClass: <Global Schema Manager>
export class SchemaManager {
  private static schemas: Map<Function, BaseSchema> = new Map()

  public static registerSchema(target: Function, alias?: string) {
    if (SchemaManager.schemas.has(target)) {
      throw new DatabaseError(`${target.name} registered, register ${target.name} failure!`)
    }

    SchemaManager.schemas.set(target, {
      fields: [],
      table: alias ?? target.name,
    })
  }

  public static addColumn(target: Function, config: SchemaField) {
    if (SchemaManager.schemas.has(target)) {
      const schema = SchemaManager.schemas.get(target)
      for (const { field } of schema.fields) {
        if (field === config.field) {
          throw new DatabaseError(`field name ${field} exists!`)
        }
      }

      schema.fields.push(config)
    } else {
      throw new DatabaseError(`${target.name} not register!`)
    }
  }

  public static hasEntity(target: Function) {
    return SchemaManager.schemas.has(target)
  }

  public static getEntity(target: Function) {
    return SchemaManager.schemas.get(target)
  }

  public static [Symbol.iterator]() {
    return SchemaManager.schemas.values()
  }
}
