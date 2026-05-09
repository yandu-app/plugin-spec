import type { Plugin } from '@yandu/types';

export default {
  name: 'yandu-plugin-hello',
  version: '1.0.0',
  register(system) {
    system.registry.register({
      name: 'hello',
      description: 'Say hello to someone',
      inputSchema: {
        type: 'object',
        properties: {
          name: { type: 'string', description: 'Name to greet' },
        },
        required: ['name'],
      },
      execute: async (args) => ({
        content: `Hello, ${args.name}!`,
      }),
    });
  },
} satisfies Plugin;
