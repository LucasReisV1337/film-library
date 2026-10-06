# Executando a base

## Requisitos

Node.js 20.9 ou superior, com npm. Sugerimos Node.js 22, indicado no `.nvmrc`.

## Instalação e desenvolvimento

Na raiz do repositório:

```bash
npm ci
npm run dev
```

Abra <http://localhost:3000>. Nenhum arquivo `.env` é necessário para iniciar a base.

## Verificações da base

```bash
npm run seed:check
npm test
npm run typecheck
npm run build
```

Os testes iniciais verificam os dados e o gerador.

## Produção local

```bash
npm run build
npm start
```

## Dados

O catálogo oficial está em `seed.json`, incluído no repositório. Não é necessário regenerar os dados. A entrega deve funcionar com o catálogo completo.

Para restaurar o catálogo original, execute `npm run seed`.