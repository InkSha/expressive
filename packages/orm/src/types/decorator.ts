import { SchemaField } from './schema'

export type TEntity = (alias?: string) => ClassDecorator

export type TColumn = (config?: SchemaField) => PropertyDecorator

export type TOneToOne = () => PropertyDecorator

export type TOneToMany = () => PropertyDecorator

export type TManyToMany = () => PropertyDecorator
