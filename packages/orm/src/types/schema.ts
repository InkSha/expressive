export type BaseFieldType = 'string' | 'number'

export type Field = string

export type RelationType = 'ONE_TO_ONE' | 'ONE_TO_MANY' | 'MANY_TO_MANY'

export interface SchemaFieldConstraint {
  minLength?: number
  maxLength?: number
  minValue?: number
  maxValue?: number
  required?: boolean
  unique?: boolean
  primary?: boolean
  notNull?: boolean
  default?: unknown
  autoincrement?: boolean
  join?: boolean
}

export interface SchemaField {
  field?: Field
  type: BaseFieldType
  constraint: SchemaFieldConstraint
  comment?: string
}

export interface SchemaRelation {
  field: Field
  type: RelationType
  relatedTable: string
  relatedField: Field
}

export interface BaseSchema {
  table: string
  fields: SchemaField[]
  indexes?: string[]
  relations?: SchemaRelation[]
}
