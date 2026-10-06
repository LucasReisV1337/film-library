# Dados do catálogo

Todos os registros são fictícios. IDs são inteiros positivos e únicos **dentro de cada coleção**. Títulos e nomes podem se repetir, inclusive títulos no mesmo ano. As referências ligam filmes a gêneros e pessoas. Uma pessoa pode ter mais de um papel no mesmo filme.

Os papéis em `credits` são `director`, `writer` e `actor`, definidos por filme.

## Formato

O trecho abaixo ilustra o formato; não é um catálogo completo:

```json
{
  "generated_at": "2026-09-15T00:00:00.000Z",
  "genres": [{ "id": 1, "name": "Drama" }],
  "people": [
    {
      "id": 1,
      "name": "Ana Almeida",
      "birth_date": null,
      "bio": null,
      "updated_at": "2024-12-30T21:05:57.189Z"
    }
  ],
  "films": [
    {
      "id": 1,
      "title": "A Última Maré",
      "synopsis": null,
      "year": 2020,
      "runtime_minutes": 101,
      "genre_ids": [1],
      "credits": [{ "person_id": 1, "role": "director" }],
      "updated_at": "2024-05-10T08:12:00.000Z",
      "removed_at": null
    }
  ]
}
```

## Informações sobre os campos

Valores `null` representam informações desconhecidas. `genre_ids` referencia a coleção `genres`; `credits[].person_id` referencia a coleção `people`.

| Campo | Significado |
| --- | --- |
| `generated_at` | Data de referência fixa do catálogo. |
| `birth_date` | Data de nascimento no formato `YYYY-MM-DD`, ou `null` quando desconhecida. |
| `year` | Ano de lançamento; não há dia ou mês de lançamento. |
| `updated_at` | Última atualização do registro no catálogo fornecido. |
| `removed_at` | Quando preenchido, o filme já está fora do catálogo ativo. |

Anos de lançamento e datas de nascimento foram sorteados independentemente. Não é necessário corrigir possíveis inconsistências cronológicas.
