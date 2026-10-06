# Solução

## Execução

Requisitos: Node.js 20.9 ou superior e npm. Na raiz do projeto:

```bash
npm ci
npm run dev
```

A aplicação fica disponível em <http://localhost:3000>. 

Para executar o build de produção:

```bash
npm run build
npm start
```

`NEXT_PUBLIC_SITE_URL` configura a origem usada nos canonicals, JSON-LD e sitemaps. Deve ser uma origem absoluta HTTP(S), sem caminho, credenciais, query ou fragmento. Sem configuração, o padrão é `http://localhost:3000`; não é necessário arquivo `.env` para desenvolvimento local.

## Testes e verificações

Verificações executadas nesta entrega:

| Comando | Resultado |
| --- | --- |
| `npm run seed:check` | Passou. 3.000 filmes, 2.908 ativos, 92 removidos, 5.000 pessoas e 18 gêneros. |
| `npm test` | Passou: 25 testes, 0 falhas. |
| `npm run typecheck` | Passou: geração de tipos e TypeScript sem erros. |
| `npm run lint` | Passou. |
| `npm run build` | Passou: build de produção e 60 páginas estáticas geradas. |
| `npm run test:http` | Passou: 13 testes contra o servidor de produção, 0 falhas. Requer build prévio. |

Os testes HTTP cobrem HTML e links servidos, paginação, metadados e canonical, JSON-LD de filmes e pessoas, dados ausentes, redirecionamentos, respostas 404/410 e exclusão de registros removidos dos sitemaps e listagens.

### Lighthouse

Auditoria executada pelo navegador em 06/10/2026 às 19:56 UTC, com Lighthouse 13.4.1, na página de filme ativo:

- URL: `http://localhost:3000/filmes/quebrada-sombra-de-fogo-299`.
- Condições: viewport móvel de 412 × 823, emulação de Moto G Power (2022) com Android 11, CPU 4× mais lenta, RTT de 150 ms e download simulado de aproximadamente 1,44 Mbps.
- Categorias: Performance 98, Acessibilidade 100, Boas práticas 100, SEO 100 e Agentic Browsing 100.
- Métricas: FCP 1,4 s; LCP 2,3 s; Total Blocking Time 20 ms; CLS 0; Speed Index 1,4 s.
- Principal gargalo: requisições que bloqueiam a renderização, com economia estimada de 740 ms. O relatório também aponta 29 KiB de JavaScript não utilizado, com redução estimada de 300 ms no LCP, e 13 KiB de JavaScript legado, com redução estimada de 150 ms no LCP.

O relatório não registrou avisos de execução. Ele confirma a URL local e a simulação móvel, mas não identifica se o servidor estava rodando em modo de produção; não trato esta execução, isoladamente, como evidência de Lighthouse em build de produção. Os resultados são de uma única execução e podem variar.

## Decisões relevantes

- O catálogo é lido do `seed.json` uma vez por processo e indexado em Maps para localizar filmes, pessoas, gêneros e créditos sem reconstruir essas relações em cada consulta.
- As páginas usam o App Router do Next.js. O conteúdo principal e os links são renderizados no servidor.
- URLs de filmes e pessoas combinam slug legível e ID (`slug-id`), preservando identidade mesmo quando títulos ou nomes se repetem. URLs não canônicas e a forma antiga de paginação recebem redirecionamento permanente para a URL canônica.

Por exemplo:

    - /filmes?page=2 vai para /filmes/pagina/2.
    - /filmes/pagina/1 vai para /filmes, porque essa é a URL oficial da primeira página.

Se o slug de um filme estiver diferente do título atual, a URL é redirecionada para a que usa o slug correto.

- Listagens e gêneros têm URLs próprias por página. Os canonicals refletem a página atual; parâmetros de query para paginação são normalizados por redirecionamento.
- A política de indexação fica centralizada: páginas com conteúdo ativo são indexáveis; listagens vazias, pessoas sem filmes ativos e gêneros sem filmes ativos recebem `noindex, follow`. A decisão é compartilhada entre metadados e seleção de URLs para os sitemaps.
- Filmes com `removed_at` respondem HTTP 410 e não aparecem em listagens, créditos relacionados ou sitemaps. URLs inexistentes respondem HTTP 404. A distinção é feita antes da renderização da página.
- Apenas os detalhes de filmes e pessoas incluem JSON-LD Schema.org (`Movie` e `Person`), com relações coerentes com os links visíveis. Breadcrumbs e a lista de filmes da pessoa também são descritos nas respectivas páginas de detalhe. Propriedades sem dado de origem são omitidas; o conteúdo ausente é identificado na interface, sem fabricar informações.
- O sitemap é dividido em índice e arquivos de URLs, usa origens absolutas canônicas e inclui `lastmod` a partir de datas de atualização dos registros, não do horário da requisição. `robots.txt` aponta para o sitemap. Também há uma rota `llms.txt` como informação complementar, sem depender de integração com serviços de IA.

## Entrega e pendências

Foram implementadas a página inicial, busca de filmes, listagens paginadas, detalhes de filmes e pessoas, páginas de gênero, metadados, dados estruturados, tratamento de URLs e registros removidos, sitemaps, `robots.txt`, `llms.txt` e testes automatizados.

Como evolução além do escopo do desafio, poderia ser avaliada a criação de conteúdo editorial relacionado aos filmes com foco em densidade factual, autoridade de fonte e estrutura citável. Também seria possível aprofundar o estudo de práticas de otimização para mecanismos de resposta e sistemas de IA, frequentemente chamadas de AEO e AIO, sem pressupor que garantam inclusão ou citações nesses sistemas.