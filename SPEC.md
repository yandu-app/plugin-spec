# Yandu Plugin Specification

Version: 1.0.0

## 1. Overview

A Yandu plugin is an npm package named `yandu-plugin-*` that exports a `Plugin` object. The plugin registers capabilities into Yandu's runtime through a single `register(system)` call.

Key design principles:
- **Uniform interface**: All plugins use the same `Plugin` interface regardless of capability type.
- **Capability registry**: Plugins register capabilities via `system.capabilities.register(descriptor, implementation)`. The `type` field distinguishes translation, feed, converter, etc.
- **No core distinction**: Yandu's core does not distinguish between "built-in" and "external" plugins. All plugins are discovered and loaded the same way.
- **Sandboxed**: Plugins run in a sandbox that limits tool registration and protects core tools.

## 2. Plugin Interface

```typescript
export interface Plugin {
  name: string;
  version: string;
  register(system: KernelSystem): void;
}
```

### 2.1 Entry Point Resolution

When Yandu scans `node_modules` for `yandu-plugin-*` packages, it resolves the entry point in this order:

1. `package.json` field `yandu.main`
2. `package.json` field `module`
3. `package.json` field `main`

The resolved module is dynamically imported. The plugin object is extracted from `mod.default`, `mod.plugin`, or `mod` itself if it has a `register` method. If the module exports a function, it is called and the return value is used.

### 2.2 package.json Fields

```json
{
  "name": "yandu-plugin-hello",
  "version": "1.0.0",
  "main": "dist/index.js",
  "module": "dist/index.mjs",
  "yandu": {
    "main": "dist/index.mjs"
  },
  "peerDependencies": {
    "@yandu/types": "^1.0.0"
  }
}
```

## 3. KernelSystem

`KernelSystem` is the dependency injection surface passed to `plugin.register()`.

```typescript
export interface KernelSystem {
  registry: ToolRegistry;
  acpRegistry: AcpRegistry;
  capabilities: CapabilityRegistry;
  loop: KernelLoop;
  createContext(workingDirectory?: string): KernelContext;
}
```

## 4. Capability Registry

The `CapabilityRegistry` is the unified registration surface for all plugin-provided capabilities.

```typescript
export interface CapabilityRegistry {
  register<T>(descriptor: CapabilityDescriptor, implementation: T): void;
  unregister(capabilityId: string): boolean;
  get<T>(capabilityId: string): T | undefined;
  getByType<T>(type: CapabilityType): Map<string, T>;
  listDescriptors(type?: CapabilityType): CapabilityDescriptor[];
}

export interface CapabilityDescriptor {
  type: CapabilityType;
  id: string;
  name: string;
  description?: string;
  version?: string;
}

export type CapabilityType =
  | 'translation'
  | 'feed'
  | 'converter'
  | 'search'
  | 'im'
  | 'import'
  | 'tool'
  | 'config';
```

Capability IDs should be namespaced: `{vendor}.{name}` or reverse-domain style.

## 5. Capability Type Specifications

### 5.1 Translation (`type: 'translation'`)

```typescript
export interface TranslationAdapter {
  id: string;
  name: string;
  supportsStreaming: boolean;
  maxTextLength: number;
  translate(text: string, from: string, to: string): Promise<string>;
  translateStream?(text: string, from: string, to: string): AsyncIterable<string>;
}
```

### 5.2 Feed (`type: 'feed'`)

```typescript
export interface FeedAdapter {
  id: string;
  name: string;
  availableFormats: string[];
  configSchema?: ConfigSchema;
  fetch(query: FeedQuery): Promise<FeedResult>;
  fetchFormat(query: FeedQuery, format: string): Promise<FeedResult>;
  resolveDownload?(paper: Paper): Promise<string | null>;
}
```

### 5.3 Converter (`type: 'converter'`)

```typescript
export interface ContentConverter {
  id: string;
  name: string;
  inputFormats: string[];
  settingsSchema?: ConfigSchema;
  convert(input: ConvertInput, options?: ConvertOptions): Promise<ConvertResult>;
}
```

### 5.4 Search (`type: 'search'`)

```typescript
export interface SearchAdapter {
  id: string;
  name: string;
  search(query: SearchQuery): Promise<SearchResult[]>;
  cancel?(searchId: string): void;
}
```

### 5.5 IM (`type: 'im'`)

```typescript
export interface IMAdapter {
  id: string;
  name: string;
  initialize(config: IMConfig): Promise<void>;
  send(chatId: string, text: string): Promise<void>;
  onMessage(handler: (msg: IMMessage) => void): void;
}
```

### 5.6 Import (`type: 'import'`)

```typescript
export interface ImportAdapter {
  id: string;
  name: string;
  import(options: ImportOptions): Promise<ImportResult>;
  validate?(options: ImportOptions): Promise<boolean>;
}
```

### 5.7 Tool (`type: 'tool'`)

Tools are registered directly on `system.registry`:

```typescript
system.registry.register({
  name: 'my_tool',
  description: '...',
  inputSchema: { type: 'object', properties: { ... } },
  execute: async (args, ctx) => { ... },
});
```

### 5.8 Config (`type: 'config'`)

Config-only plugins register a `ConfigSchema`:

```typescript
system.capabilities.register(
  { type: 'config', id: 'my-plugin', name: 'My Plugin Settings' },
  myConfigSchema
);
```

## 6. Plugin Lifecycle

```
Scan node_modules for yandu-plugin-*
  |
  v
For each: resolve entry, dynamic import
  |
  v
Validate Plugin interface
  |
  v
Create sandboxed KernelSystem
  |
  v
Call plugin.register(sandboxedSystem)
  |
  v
Capabilities/tools/configs registered
```

No hot-reload. Restart Yandu to unload a plugin.

## 7. Sandbox Rules

| Limit | Default | Config Key |
|-------|---------|------------|
| Max tools | 20 | `kernel.sandbox.maxTools` |
| Max slash commands | 10 | `kernel.sandbox.maxSlashCommands` |
| Protected tools | `read`, `write`, `bash`, `enter_plan_mode`, `exit_plan_mode` | N/A |

Protected tools cannot be overridden. The `CapabilityRegistry` is sandboxed: plugins can register but cannot unregister core capabilities.

## 8. Naming Conventions

Package: `yandu-plugin-{type}-{name}`

Examples:
- `yandu-plugin-translate-google-free`
- `yandu-plugin-feed-arxiv`
- `yandu-plugin-converter-pdf`
- `yandu-plugin-im-telegram`

Capability IDs: `{vendor}.{name}`

Examples:
- `google-free`
- `org.arxiv`
- `converter.pdf`

## 9. TypeScript Types

```bash
npm install --save-dev @yandu/types
```

Exports: `Plugin`, `KernelSystem`, `CapabilityRegistry`, `CapabilityDescriptor`, `CapabilityType`, all adapter interfaces, `Tool`, `ConfigSchema`.

## 10. Error Handling

Plugins should never throw during `register()`. Defer errors to runtime. If `register()` throws, Yandu logs the error and skips the plugin. Other plugins continue loading.

## 11. Versioning

Semantic versioning. Major = breaking interface changes, Minor = new features, Patch = bug fixes. Yandu does not enforce compatibility. Document minimum Yandu version in README.

## 12. Distribution

```bash
npm install yandu-plugin-translate-google-free
```

For development:
```bash
cd yandu
npm link ../my-plugin
```
