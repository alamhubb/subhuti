export default {
  name: "subhuti",
  version: "0.2.86",
  description: "Qin-managed Subhuti TypeScript parser package",
  type: "library",
  entry: "src/index.ts",
  scripts: {
    build: "tsdown",
    test: "tsdown"
  },
  dependencies: {
    "lru-cache": "^11.0.0"
  },
  devDependencies: {
    "@types/estree": "1.0.6",
    "@types/node": "^24.10.1",
    "tsdown": "0.17.0-beta.6",
    "tsx": "^4.21.0",
    "typescript": "^5.9.3"
  },
  tooling: {
    id: "subhuti",
    runtime: "typescript"
  }
}
