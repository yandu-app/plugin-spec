# Plugin Developer Experience

Plugin developers should not need the Yandu source code to write, test, or debug plugins.

## `@yandu/dev` — Development Harness

```bash
npm install --save-dev @yandu/dev
```

### 1. Mock KernelSystem

```typescript
import { createMockSystem } from '@yandu/dev';

const system = createMockSystem();
// system.registry, system.capabilities, system.loop — all functional mocks

import myPlugin from './src/index';
myPlugin.register(system);

console.log(system.capabilities.listDescriptors());
// [ { type: 'translation', id: 'google-free', name: 'Google Translate' } ]
```

### 2. Plugin Test Runner

```typescript
import { describePlugin } from '@yandu/dev';
import myPlugin from './src/index';

describePlugin(myPlugin, (system) => {
  test('registers translation capability', () => {
    const adapters = system.capabilities.getByType('translation');
    expect(adapters.has('google-free')).toBe(true);
  });

  test('translates text', async () => {
    const adapter = system.capabilities.get<TranslationAdapter>('google-free');
    const result = await adapter!.translate('hello', 'en', 'zh');
    expect(result).toBe('你好');
  });
});
```

### 3. CLI — `yandu-plugin-dev`

```bash
# Start interactive plugin shell
npx yandu-plugin-dev

# Load plugin, inspect registered capabilities
> load ./src/index.ts
Registered 1 capability: translation:google-free

# Call a capability interactively
> call translation:google-free.translate "hello" "en" "zh"
Result: "你好"

# Call a tool interactively
> tool hello --name "World"
Result: { content: "Hello, World!" }

# Hot reload on file changes
> watch
[watch] Reloading plugin...
```

### 4. Hot Reload

```bash
npx yandu-plugin-dev --watch
```

### 5. VS Code Extension (Future)

- IntelliSense for `@yandu/types`
- Capability registry explorer
- One-click "Test in Yandu"

## Minimal Plugin Project Structure

```
my-plugin/
├── package.json
├── tsconfig.json
├── src/
│   └── index.ts          # Plugin entry
├── tests/
│   └── plugin.test.ts    # Uses @yandu/dev
└── README.md
```

## Debugging Without Yandu Source

1. Install `@yandu/types` for TypeScript definitions
2. Install `@yandu/dev` for test harness and CLI
3. Write plugin using types only
4. Test with `npx yandu-plugin-dev`
5. Publish to npm as `yandu-plugin-*`
6. Yandu users install via npm; plugin auto-discovered at startup

## Mock System API

```typescript
import { createMockSystem } from '@yandu/dev';

const system = createMockSystem({
  capabilities: {
    translation: new Map([['deepl', deeplAdapter]]),
  },
  sandbox: {
    maxTools: 50,
    protectedTools: new Set(['read', 'write']),
  },
});
```

`createMockSystem()` returns a fully functional `KernelSystem` where:
- `registry.register()` adds tools to an in-memory map
- `capabilities.register()` adds capabilities by type
- `loop` is a stub that logs scheduled tasks
- `createContext()` returns a mock context with the registered tools

## Example: Test a Feed Adapter

```typescript
import { createMockSystem } from '@yandu/dev';
import myPlugin from '../src';

test('arxiv feed adapter fetches papers', async () => {
  const system = createMockSystem();
  myPlugin.register(system);

  const adapter = system.capabilities.getByType('feed').get('org.arxiv');
  const result = await adapter.fetch({ q: 'machine learning', limit: 5 });

  expect(result.papers).toHaveLength(5);
  expect(result.papers[0]).toHaveProperty('title');
});
```
