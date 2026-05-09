import type { Plugin, FeedAdapter } from '@yandu/types';

const adapter: FeedAdapter = {
  id: 'org.arxiv',
  name: 'arXiv',
  availableFormats: ['atom', 'json'],

  async fetch(query) {
    const url = new URL('https://export.arxiv.org/api/query');
    url.searchParams.set('search_query', query.q || 'all:*');
    url.searchParams.set('start', String(query.offset || 0));
    url.searchParams.set('max_results', String(query.limit || 10));

    const res = await fetch(url);
    const xml = await res.text();

    return {
      papers: parseArxivAtom(xml),
      total: extractTotalResults(xml),
    };
  },

  async fetchFormat(query, format) {
    return this.fetch(query);
  },

  async resolveDownload(paper) {
    const id = paper.externalIds?.arxiv;
    if (!id) return null;
    return `https://arxiv.org/pdf/${id}.pdf`;
  },
};

function parseArxivAtom(xml: string) {
  const entries = xml.match(/<entry>[\s\S]*?<\/entry>/g) || [];
  return entries.map((entry) => ({
    title: entry.match(/<title>([\s\S]*?)<\/title>/)?.[1]?.trim() || '',
    authors: (entry.match(/<name>(.*?)<\/name>/g) || []).map((m) =>
      m.replace(/<\/?name>/g, ''),
    ),
    abstract: entry.match(/<summary>([\s\S]*?)<\/summary>/)?.[1]?.trim() || '',
    publishedAt: entry.match(/<published>(.*?)<\/published>/)?.[1],
    url: entry.match(/<id>(.*?)<\/id>/)?.[1],
    source: 'org.arxiv',
  }));
}

function extractTotalResults(xml: string): number {
  const match = xml.match(/<opensearch:totalResults>(\d+)<\/opensearch:totalResults>/);
  return match ? parseInt(match[1], 10) : 0;
}

export default {
  name: 'yandu-plugin-feed-arxiv',
  version: '1.0.0',
  register(system) {
    system.capabilities.register(
      {
        type: 'feed',
        id: 'org.arxiv',
        name: 'arXiv',
        description: 'arXiv preprint server via Atom API',
      },
      adapter,
    );
  },
} satisfies Plugin;
