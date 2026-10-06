# Desafio Técnico - Engenharia de Software Pleno SEO & GEO

## Escavateca

Obrigado por participar do nosso processo seletivo.

No Escavador, queremos tornar informações fáceis de encontrar e compreender. Neste desafio, você vai construir um catálogo de filmes navegável, acessível a buscadores e mecanismos de IA. Queremos conhecer sua solução e suas decisões de engenharia.

Os dados são fictícios e sua solução será usada apenas nesta avaliação.

## Sua entrega

Conte o que implementou, o que ficou pendente e como priorizou o trabalho. Também consideramos entregas parciais que funcionem e tenham suas decisões bem explicadas.

Crie um fork ou uma cópia deste repositório para desenvolver sua solução. Envie o link pelo canal e dentro do prazo informados no convite. O repositório pode ser público ou privado; a equipe avaliadora precisa ter acesso.

Na próxima etapa, vamos conversar sobre sua solução e as decisões que tomou. Poderemos propor uma pequena alteração para conhecer como você evolui o projeto.

## Para começar

A base inclui Next.js com TypeScript, uma página inicial e o catálogo em `seed.json`. Você pode reorganizar o projeto e escolher a arquitetura.

Consulte [CONFIG.md](CONFIG.md) para executar o projeto e [DADOS.md](DADOS.md) para conhecer o formato dos dados.

## Contexto

O arquivo tem **3.000 filmes, 5.000 pessoas e 18 gêneros**, com cerca de 4,3 MB. Há sinopses, biografias e datas de nascimento ausentes; filmes descatalogados; gêneros sem filmes; títulos e nomes repetidos; pessoas sem créditos.

## Requisitos principais

### 1. Catálogo navegável

Construa:

- página inicial;
- listagem paginada de filmes;
- página de detalhe de filme;
- página de detalhe de pessoa, com seus filmes;
- página de gênero, com os filmes associados.

Permita navegar entre filmes, pessoas e gêneros usando links. A paginação deve ter URLs próprias, resultados diferentes e links para avançar e voltar.

Defina URLs que diferenciem registros com títulos ou nomes repetidos.

Trate dados ausentes, gêneros vazios e pessoas sem filmes de forma coerente. Você decide quais dessas páginas devem ser indexadas.

### 2. Renderização e metadados

O conteúdo principal e os links do catálogo devem estar disponíveis no HTML servido, sem depender de JavaScript no navegador.

Inclua `title`, descrição e canonical nas páginas indexáveis. Defina canonicals coerentes com a paginação e os parâmetros de URL. A origem das URLs absolutas deve ser configurável e documentada.

### 3. Registros removidos e URLs inexistentes

No catálogo fornecido, todo filme com `removed_at` preenchido já foi removido. Ele deve:

- responder **404 ou 410** quando sua URL for acessada diretamente;
- ficar fora dos sitemaps;
- não aparecer nas listagens nem nos links de pessoas, gêneros ou outras páginas.

As pessoas ligadas a esses filmes continuam no catálogo, mesmo quando não têm filmes ativos.

URLs inexistentes devem responder 404. Esses requisitos se referem ao **status HTTP real**, além da mensagem exibida na tela.

### 4. Dados estruturados

Inclua JSON-LD válido nos detalhes de filme e pessoa, usando tipos e propriedades adequados do Schema.org. Represente as entidades e suas relações de forma consistente com as URLs e o conteúdo visível. Use apenas as informações disponíveis no catálogo.

### 5. Sitemap e robots.txt

Disponibilize um sitemap XML válido com URLs absolutas e canônicas das páginas que decidiu tornar indexáveis. Inclua `lastmod` quando houver uma data que represente a atualização do conteúdo. Essa data deve refletir uma mudança na página, e não o horário de cada requisição.

Disponibilize `robots.txt` com a referência ao sitemap. As regras devem ser coerentes com sua política de indexação e permitir o acesso aos recursos necessários à renderização.

### 6. Verificação e performance

Inclua testes automatizados dos comportamentos que considerar mais importantes. Você escolhe as ferramentas e os cenários.

Execute o Lighthouse em **uma página de filme ativo**, com build de produção e simulação de dispositivo móvel. Registre URL, versão da ferramenta, condições da execução, resultados e o principal gargalo observado. Vamos avaliar sua análise, sem uma nota mínima eliminatória. Se não conseguir executar, explique a limitação e como faria a medição.

## Decisões e documentação

Mantenha as instruções de execução atualizadas. Em `SOLUCAO.md`, registre os testes e verificações, as decisões relevantes e as pendências. Respostas curtas são suficientes.

## Fora do escopo

Não são exigidos autenticação, deploy, imagens, design elaborado, edição de dados, API separada, Docker, banco de dados, busca, filtros, listagem geral de pessoas ou infraestrutura distribuída. Também não exigimos Search Console, indexação real, resultados enriquecidos nos buscadores ou uso de APIs de IA. A interface deve ser legível e permitir navegar com clareza.

## O que vamos avaliar

- **Engenharia:** aplicação executável, organização proporcional e decisões justificadas.
- **Rastreamento e indexação:** HTML acessível, links, paginação, URLs, canonical, status HTTP e coerência do sitemap.
- **Representação dos dados:** identidade de entidades, relações e tratamento honesto de informações ausentes.
- **Verificação:** testes de comportamento e evidências reproduzíveis.
- **Comunicação e priorização:** clareza, transparência sobre limitações e capacidade de explicar escolhas e consequências.

Bom desafio! Nos vemos na conversa técnica.
