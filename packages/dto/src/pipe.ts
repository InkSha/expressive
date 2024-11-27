import { BadRequestException, Constructor, Pipe } from '@expressive/common'
import { hasValidator, parseDTO } from './base'
import { assignmentObject } from './assignment'

export class DTOPipe extends Pipe<Object, Object> {
  public transform(value: Object, proto: Constructor): Object {
    const has = hasValidator(proto)
    let data = value

    if (has) {
      if (typeof value === 'object') {
        if (has) {
          data = assignmentObject(proto, value)
        }
      }

      const [pass, reason] = parseDTO(data)
      if (!pass) {
        throw new BadRequestException(reason)
      }
    }

    return data
  }
}
