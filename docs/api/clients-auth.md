# Autenticação e Consulta de Dados do Cliente (Área do Cliente)

## JWT do Cliente

- O token JWT gerado para o cliente utiliza o campo `sub` como identificador único, que corresponde ao `_id` do cliente no MongoDB.
- Exemplo de payload do JWT:

```json
{
  "sub": "64f1c2e8b2e4a2a1b8c1d2e3",
  "iat": 1693512345,
  "exp": 1693598745
}
```

## Endpoint: Buscar dados do cliente autenticado

- **Método:** GET
- **Rota:** `/api/clients/me`
- **Autenticação:** Necessário enviar o token JWT no header `Authorization: Bearer <token>`
- **Descrição:** Retorna os dados completos do cliente autenticado.
- **Resposta:**

```json
{
  "_id": "64f1c2e8b2e4a2a1b8c1d2e3",
  "companyName": "Empresa Exemplo",
  "cnpj": "12.345.678/0001-99",
  "plan": "Premium",
  "accessEmail": "contato@empresa.com",
  "responsibleName": "João Silva",
  "responsiblePhone": "11999999999",
  "responsiblePosition": "Diretor",
  "responsibleEmail": "joao@empresa.com",
  "responsibleCPF": "123.456.789-00",
  "cep": "01234-567",
  "street": "Rua Exemplo",
  "number": "123",
  "complement": "Sala 1",
  "neighborhood": "Centro",
  "city": "São Paulo",
  "state": "SP",
  "status": "ativo"
}
```

## Restrições de Edição

- **Não editável:** `cnpj`
- **Editável:** Dados pessoais, endereço, contato, etc.

## Observações

- O login do cliente é feito diretamente pelo registro da empresa.
- **Melhoria futura:** Implementar coleção de usuários vinculados ao cliente para maior flexibilidade e segurança. 