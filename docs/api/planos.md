# API – Planos

> Consulte este documento para detalhes de integração, payloads e exemplos dos endpoints de planos.
> Última atualização: 2024-06

---

## Sumário
- [Visão Geral](#visão-geral)
- [Endpoints](#endpoints)
  - [Listar planos](#listar-planos)
  - [Buscar plano por ID](#buscar-plano-por-id)
  - [Criar plano](#criar-plano)
  - [Editar plano](#editar-plano)
  - [Excluir plano](#excluir-plano)
- [Exemplos de Payloads](#exemplos-de-payloads)
- [Observações de Integração](#observações-de-integração)
- [Referências](#referências)

---

## Visão Geral
Os endpoints de planos permitem o cadastro, edição, listagem e exclusão dos planos disponíveis no sistema. Todas as rotas são protegidas por autenticação JWT (admin).

Base URL: `/api/planos`

---

## Endpoints

### Listar planos
- **GET** `/api/planos`
- **Headers:** `Authorization: Bearer <token>`
- **Resposta:**
```json
[
  {
    "_id": "...",
    "nome": "Premium",
    "descricao": "Plano completo",
    "preco": 199.90,
    "periodoTrial": 14,
    "limiteIndicadores": 100,
    "limiteIndicacoes": 1000,
    "funcionalidades": {
      "exportacao": true,
      "relatorios": true,
      "campanhasExtras": true,
      "outraFuncionalidade": false
    }
  }
]
```

### Buscar plano por ID
- **GET** `/api/planos/:id`
- **Headers:** `Authorization: Bearer <token>`
- **Resposta:** (igual ao objeto acima)

### Criar plano
- **POST** `/api/planos`
- **Headers:** `Authorization: Bearer <token>`
- **Body:**
```json
{
  "nome": "Premium",
  "descricao": "Plano completo",
  "preco": 199.90,
  "periodoTrial": 14,
  "limiteIndicadores": 100,
  "limiteIndicacoes": 1000,
  "funcionalidades": {
    "exportacao": true,
    "relatorios": true,
    "campanhasExtras": true,
    "outraFuncionalidade": false
  }
}
```
- **Resposta:** (plano criado)
- **Status:** `201 Created`, `400 Bad Request`, `401 Unauthorized`

### Editar plano
- **PUT** `/api/planos/:id`
- **Headers:** `Authorization: Bearer <token>`
- **Body:** (mesmo do POST)
- **Resposta:** (plano atualizado)
- **Status:** `200 OK`, `400 Bad Request`, `401 Unauthorized`, `404 Not Found`

### Excluir plano
- **DELETE** `/api/planos/:id`
- **Headers:** `Authorization: Bearer <token>`
- **Resposta:**
```json
{ "message": "Plano excluído com sucesso" }
```
- **Status:** `200 OK`, `401 Unauthorized`, `404 Not Found`

---

## Exemplos de Payloads

### Cadastro de plano
```json
{
  "nome": "Start",
  "descricao": "Plano inicial para pequenas empresas",
  "preco": 49.90,
  "periodoTrial": 7,
  "limiteIndicadores": 10,
  "limiteIndicacoes": 50,
  "funcionalidades": {
    "exportacao": true,
    "relatorios": false,
    "campanhasExtras": false
  }
}
```

---

## Observações de Integração
- Todos os endpoints exigem autenticação JWT de administrador.
- O campo `funcionalidades` pode ser expandido para novas features sem quebra de contrato.
- O seed automático dos planos deve ser ajustado para não sobrescrever dados em produção.
- Valide sempre os status HTTP e mensagens de erro para UX adequada.

---

## Referências
- [Visão geral do projeto](../promptify-project-overview.md)
- [Checklist de desenvolvimento](../dev-checklist.md) 