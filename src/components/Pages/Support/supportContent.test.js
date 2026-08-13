import { describe, expect, it } from 'vitest';
import {
  DEFAULT_HELP_ARTICLE_ID,
  HELP_ARTICLES,
  HELP_CATEGORIES,
  findHelpArticles,
} from './supportContent';

describe('supportContent', () => {
  it('mantém o artigo inicial disponível na central', () => {
    expect(HELP_ARTICLES.some((article) => article.id === DEFAULT_HELP_ARTICLE_ID)).toBe(true);
  });

  it('organiza todos os artigos dentro de categorias', () => {
    const categoryArticleCount = HELP_CATEGORIES.reduce(
      (total, category) => total + category.articles.length,
      0,
    );

    expect(HELP_ARTICLES).toHaveLength(categoryArticleCount);
    expect(HELP_CATEGORIES.every((category) => category.articles.length > 0)).toBe(true);
  });

  it('encontra artigos por título, palavras-chave e conteúdo detalhado', () => {
    expect(findHelpArticles('Pix').some((article) => article.id === 'publish-service')).toBe(true);
    expect(findHelpArticles('checkout_created').some((article) => article.id === 'payment-statuses')).toBe(true);
    expect(findHelpArticles('pagamentos externos').length).toBeGreaterThan(0);
  });

  it('retorna uma lista vazia sem termo de busca', () => {
    expect(findHelpArticles('   ')).toEqual([]);
  });
});
