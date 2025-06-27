# API – Participantes e Listas de Participantes

Este documento descreve os principais endpoints e regras para integração com a API de Participantes e Listas de Participantes do sistema.

---

## Introdução

Participantes são contatos cadastrados por um Cliente e podem ser vinculados a Listas para segmentação e participação em campanhas. Esta API permite criar, editar, listar e consultar participantes, bem como gerenciar suas listas associadas.

- **Participante:** Contato que pode ser convidado para campanhas e realizar indicações.
- **Lista de Participantes:** Agrupamento de participantes, normalmente segmentado por tipo ou campanha.

Consulte também: [Glossário de Conceitos](../conceitos.md), [Padronização de Dados](../padroes-dados.md)

---

## Endpoints Principais

### Participantes

- **Listar participantes**
  - `GET /api/participants`
  - Retorna todos os participantes cadastrados.

- **Buscar participante por ID**
  - `GET /api/participants/:id`
  - Retorna os dados de um participante específico.

- **Criar participante**
  - `POST /api/participants`
  - Cria um novo participante.

- **Editar participante**
  - `PATCH /api/participants/:id`
  - Atualiza os dados de um participante existente.

### Listas de Participantes

- **Listar listas**
  - `GET /api/participant-lists`
  - Retorna todas as listas de participantes disponíveis.

- **Buscar lista por ID**
  - `GET /api/participant-lists/:id`
  - Retorna os dados de uma lista específica.

---

## Exemplos de Request/Response

### Criar Participante

**Request:**
```json
POST /api/participants
{
  "name": "João Silva",
  "email": "joao@email.com",
  "cellphone": "11999999999",
  "pixKey": "joao@pix.com",
  "type": "indicador",
  "status": "ativo",
  "lists": ["<id_lista>"]
}
```

**Response:**
```json
{
  "_id": "<id_participante>",
  "name": "João Silva",
  "email": "joao@email.com",
  "cellphone": "11999999999",
  "pixKey": "joao@pix.com",
  "type": "indicador",
  "status": "ativo",
  "lists": ["<id_lista>"]
}
```

### Editar Participante

**Request:**
```json
PATCH /api/participants/<id_participante>
{
  "name": "João S. Silva",
  "status": "inativo"
}
```

**Response:**
```json
{
  "_id": "<id_participante>",
  "name": "João S. Silva",
  "email": "joao@email.com",
  "cellphone": "11999999999",
  "pixKey": "joao@pix.com",
  "type": "indicador",
  "status": "inativo",
  "lists": ["<id_lista>"]
}
```

### Listar Listas de Participantes

**Request:**
```
GET /api/participant-lists
```

**Response:**
```json
[
  {
    "_id": "<id_lista>",
    "name": "Lista VIP",
    "type": "indicador",
    "description": "Participantes VIP do cliente X"
  }
]
```

---

## Campos Importantes

### Participante
- `name` (string, obrigatório)
- `email` (string, opcional)
- `cellphone` (string, obrigatório)
- `pixKey` (string, opcional)
- `type` (string, obrigatório – ex: "indicador", "cliente")
- `status` (string, obrigatório – ex: "ativo", "inativo")
- `lists` (array de IDs de listas, opcional)

### Lista de Participantes
- `name` (string, obrigatório)
- `type` (string, obrigatório – deve corresponder ao tipo do participante)
- `description` (string, opcional)

---

## Relacionamentos e Regras

- Um participante pode pertencer a uma ou mais listas.
- Apenas listas do mesmo tipo do participante podem ser vinculadas.
- O campo `lists` deve conter os IDs das listas associadas.
- O campo `type` define o perfil do participante e filtra as listas disponíveis.

---

## Observações
- Todos os endpoints exigem autenticação via JWT (header `Authorization: Bearer <token>`).
- Consulte os demais documentos em `docs/` para detalhes sobre autenticação, campanhas e integrações.

---

## Exemplos de Fluxo

1. Buscar listas disponíveis para o tipo de participante desejado.
2. Criar ou editar participante vinculando a uma lista.
3. Listar participantes filtrando por lista, tipo ou status (se implementado).

---

*Este documento será expandido futuramente com exemplos avançados, fluxos completos e integrações com campanhas.* 