# Yandu Plugin Specification

Plugins extend Yandu with new capabilities: translation engines, feed sources, document converters, search backends, instant messaging bots, and more.

Everything is a plugin. There is no special "translation provider" or "feed adapter" -- a plugin registers one or more capabilities via a single unified interface.

## Quick Start

```bash
npm init -y
npm install @yandu/types
```

```typescript
// src/index.ts
import type { Plugin } from '@yandu/types';

export default {
  name: 'yandu-plugin-hello',
  version: '1.0.0',
  register(system) {
    system.registry.register({
      name: 'hello',
      description: 'Say hello',
      inputSchema: { type: 'object', properties: { name: { type: 'string' } } },
      execute: async (args) => ({ content: `Hello, ${args.name}!` }),
    });
  },
} satisfies Plugin;
```

Package naming: `yandu-plugin-*`. Yandu auto-discovers these from `node_modules` at startup.

## Capability Types

| Type | Description | Interface |
|------|-------------|-----------|
| `translation` | Translate text between languages | `TranslationAdapter` |
| `feed` | Fetch papers from academic sources | `FeedAdapter` |
| `converter` | Convert documents (e.g. PDF to Markdown) | `ContentConverter` |
| `search` | Search papers across backends | `SearchAdapter` |
| `im` | Instant messaging bot integration | `IMAdapter` |
| `embedding` | Text embedding models | `EmbeddingAdapter` |
| `import` | Import papers from external libraries | `ImportAdapter` |
| `tool` | Agent-accessible tool | `Tool` |
| `config` | Settings schema only (no runtime code) | `ConfigSchema` |

Read [SPEC.md](SPEC.md) for the complete specification.

## Internationalization

Plugins can provide their own translations. See [I18N.md](I18N.md) for locale file conventions, namespace rules, and programmatic API.

## Developer Experience

Plugin developers do not need the Yandu source code. See [DEV.md](DEV.md) for:
- `@yandu/dev` test harness
- Mock `KernelSystem` for unit testing
- `npx yandu-plugin-dev` CLI for interactive debugging
- Hot reload during development

## Examples

See `examples/` for working plugin samples.

## License

MIT
