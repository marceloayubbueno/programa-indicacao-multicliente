# API – Recompensas

> Consulte este documento para detalhes de integração, payloads e exemplos dos endpoints de recompensas.
> Última atualização: 2024-06

---

## Sumário
- [Visão Geral](#visão-geral)
- [Endpoints](#endpoints)
  - [Listar recompensas](#listar-recompensas)
  - [Buscar recompensa por ID](#buscar-recompensa-por-id)
  - [Criar recompensa](#criar-recompensa)
  - [Excluir recompensa](#excluir-recompensa)
- [Exemplos de Payloads](#exemplos-de-payloads)
- [Observações de Integração](#observações-de-integração)
- [Referências](#referências)

---

## Visão Geral
Os endpoints de recompensas permitem o cadastro, listagem e exclusão de recompensas associadas a campanhas ou ações do sistema. Todas as rotas são protegidas por autenticação JWT (admin).

Base URL: `/api/rewards`

---

## Endpoints

### Listar recompensas
- **GET** `/api/rewards`
- **Headers:** `Authorization: Bearer <token>`
- **Resposta:**
```json
[
  {
    "_id": "...",
    "nome": "Camiseta",
    "descricao": "Camiseta personalizada",
    "quantidade": 10,
    ...
  }
]
```

### Buscar recompensa por ID
- **GET** `/api/rewards/:id`
- **Headers:** `Authorization: Bearer <token>`
- **Resposta:** (igual ao objeto acima)

### Criar recompensa
- **POST** `/api/rewards`
- **Headers:** `Authorization: Bearer <token>`
- **Body:**
```json
{
  "nome": "Camiseta",
  "descricao": "Camiseta personalizada",
  "quantidade": 10
}
```
- **Resposta:** (recompensa criada)
- **Status:** `201 Created`, `400 Bad Request`, `401 Unauthorized`

### Excluir recompensa
- **DELETE** `/api/rewards/:id`
- **Headers:** `Authorization: Bearer <token>`
- **Resposta:**
```json
{ "message": "Recompensa excluída com sucesso" }
```
- **Status:** `200 OK`, `401 Unauthorized`, `404 Not Found`

---

## Exemplos de Payloads

### Cadastro de recompensa
```json
{
  "nome": "Camiseta",
  "descricao": "Camiseta personalizada",
  "quantidade": 10
}
```

---

## Observações de Integração
- Todos os endpoints exigem autenticação JWT de administrador.
- Valide sempre os status HTTP e mensagens de erro para UX adequada.

---

## Referências
- [Visão geral do projeto](../promptify-project-overview.md)
- [Checklist de desenvolvimento](../dev-checklist.md) 