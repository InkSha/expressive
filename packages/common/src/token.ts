export const TokenConfig = {
  Controller: "__CONTROLLER__",
  Router: "__ROUTER__",
  RouterMethod: "__ROUTER_METHOD__",
  Moudle: "__MODULE__",
  Params: "__PARAMS__",
  Injectable: "__INJECTABLE__",
  HttpStatus: "__HTTP_STATUS__",
  Global: "__GLOBAL__"
} as const satisfies Record<string, `__${string}__`>
