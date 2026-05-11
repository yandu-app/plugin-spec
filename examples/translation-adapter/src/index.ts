import { translate } from '@vitalets/google-translate-api';
import type { Plugin, TranslationAdapter } from '@yandu/types';

const adapter: TranslationAdapter = {
  id: 'google-free',
  name: 'Google Translate',
  supportsStreaming: false,
  maxTextLength: 5000,

  async translate(text, from, to) {
    const result = await translate(text, { from, to });
    return result.text;
  },
};

export default {
  name: 'yandu-plugin-translate-google-free',
  version: '1.0.0',
  register(system) {
    system.capabilities.register(
      {
        type: 'translation',
        id: 'google-free',
        name: 'Google Translate',
        description: 'Free Google Translate API (unofficial)',
      },
      adapter,
    );
  },
} satisfies Plugin;
