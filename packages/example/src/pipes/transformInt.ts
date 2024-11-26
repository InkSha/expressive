import { Pipe } from '@expressive/common'

export class TransformInt extends Pipe<number, string | Object> {

  constructor(
    private readonly property: string = ''
  ) {
    super()
  }

  public transform(value: string | Object): number {
    let val = ''

    if (typeof value === 'string') val = value
    else if (this.property in value) {
      val = value[this.property]
    }

    const num = Number(val)
    if (!Number.isNaN(num)) {
      return num
    }

    return -1
  }
}
