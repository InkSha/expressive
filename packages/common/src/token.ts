export const TokenConfig = {
  Controller: "__CONTROLLER__",
  Router: "__ROUTER__",
  RouterMethod: "__ROUTER_METHOD__",
  RouterPipe: "__ROUTER_PIPE__",
  Moudle: "__MODULE__",
  Params: "__PARAMS__",
  Injectable: "__INJECTABLE__",
  HttpStatus: "__HTTP_STATUS__",
  Global: "__GLOBAL__",
  ModuleControllers: "__MODULE_CONTROLLERS__",
  ModuleProviders: "__MODULE_PROVIDERS__",
  ModuleExports: "__MODULE_EXPORTS__",
  ModuleImports: "__MODULE_IMPORTS__",
  ModuleMiddleware: "__MODULE_MIDDLEWARE__",
} as const satisfies Record<string, `__${string}__`>
