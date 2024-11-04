const fs = require("fs")
const path = require("path")
const process = require("process")

const projectName = process.argv[/** node position, file position, */ 2 /** create project name */]
const packageJSON = {
  name: `@expressive/${projectName}`,
  version: "0.0.0",
  description: `Expressive ${projectName}`,
  author: "inksha",
  homepage: "https://github.com/InkSha/expressive#readme",
  license: "MIT",
  main: "src/index.ts",
  publishConfig: {
    registry: "https://registry.npmmirror.com",
  },
  repository: {
    type: "git",
    url: "https://github.com/InkSha/expressive.git",
    directory: `packages/${projectName}`,
  },
  scripts: {
    dev: "ts-node ./src/index.ts",
    check: "biome check --fix",
    lint: "biome lint --fix",
    format: "biome format --fix",
  },
  bugs: {
    url: "https://github.com/InkSha/expressive/issues",
  },
}

const tsconfig = { extends: "../../tsconfig.json" }

const dir = `packages/${projectName}`

const mainFileContent = `export const ${projectName} = () => "hello world"`

const testFileContent = `import { ${projectName} } from '../src'
describe("test ${projectName}", () => {
  test("hello world", () => {
    expect(${projectName}()).toBe("hello world")
  })
})`

fs.mkdirSync(dir)
fs.mkdirSync(path.join(dir, "src"))
fs.mkdirSync(path.join(dir, "test"))

fs.writeFileSync(path.join(dir, "package.json"), JSON.stringify(packageJSON, undefined, 2), "utf-8")
fs.writeFileSync(path.join(dir, "tsconfig.json"), JSON.stringify(tsconfig, undefined, 2), "utf-8")
fs.writeFileSync(path.join(dir, "src", "index.ts"), mainFileContent, "utf-8")
fs.writeFileSync(path.join(dir, "test", "index.test.ts"), testFileContent, "utf-8")
