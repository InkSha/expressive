export abstract class Pipe<R = unknown, V = unknown> {
  public abstract transform(value: V): R
}
