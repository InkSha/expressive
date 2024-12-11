export class DatabaseError extends Error {
  constructor(
    public readonly message: string
  ) {
    super(message)
  }
}
