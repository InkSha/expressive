/**
 *
 */

/**
 *
 */
export enum StatusCode {
  SUCCESS = 200,

  NOT_FOUND = 404,

  INTERNAL_SERVER_ERROR = 500,
}

/**
 *
 */
export enum RequestType {
  GET = 0,
  POST = 1,
  PUT = 2,
  PATCH = 3,
  DELETE = 4,
}

export enum RequestParam {
  REQUEST = 0,
  RESPONSE = 1,
  NEXT = 2,
  BODY = 3,
  QUERY = 4,
  PARAMS = 5,
  HEADERS = 6,
}

export const HttpRequestName = ["get", "post", "put", "patch", "delete"] as const satisfies string[]
