import { SchemaManager } from './schema'
import type { TColumn, TEntity } from './types'

export const Entity: TEntity = (alias) => target => {
  SchemaManager.registerSchema(target, alias)
}

export const Column: TColumn = (config) => (target, field) => {
  if (!config.field) {
    if (typeof field !== 'string') {
      throw new TypeError(`entity ${target.constructor.name} field ${field.toString()} not is string!`)
    }
    config.field = field
  }

  SchemaManager.addColumn(target.constructor, config)
}
