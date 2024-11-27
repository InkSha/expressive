import { Constructor } from '@expressive/common'

export class Entities {
  private static entities: Map<Constructor, unknown> = new Map()

  public get size() {
    return Entities.entities.size
  }

  public toEntity<R = unknown>(proto: Constructor<R>, providers: Constructor[] = []): R {
    if (this.hasEntity(proto)) return this.getEntity(proto) as R

    const args = (Reflect.getMetadata("design:paramtypes", proto) as Constructor[]) || []

    const params = args.map((fn) => {
      if (!providers.some((p) => p === fn)) {
        throw new EvalError(`${fn.name} not in providers`)
      }

      return this.toEntity(fn, providers)
    })

    const entity = new proto(...params)

    this.setEntity(proto, entity)
    return entity
  }

  private get entities() {
    return Entities.entities
  }

  private getEntity(proto: Constructor) {
    return this.entities.get(proto)
  }

  private setEntity(proto: Constructor, entity: Object) {
    if (!this.hasEntity(proto)) {
      this.entities.set(proto, entity)
    }

    return this.getEntity(proto)
  }

  private hasEntity(proto: Constructor): boolean {
    return this.entities.has(proto)
  }
}
