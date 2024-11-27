export const assignmentObject = <T>(raw: { new(...args: unknown[]): T }, data: Object) => {
  const obj = new raw()
  const json = JSON.parse(JSON.stringify(data))
  for (const key of Object.keys(obj)) {
    obj[key] = json[key]
  }
  return obj
}
