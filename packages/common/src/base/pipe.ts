import { Constructor } from '../module'

export abstract class Pipe<R = unknown, V = unknown> {
  public abstract transform(value: V, proto: Constructor): R
}
