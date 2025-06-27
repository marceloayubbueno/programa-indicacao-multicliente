# FAQ Técnico – Desenvolvimento

> Perguntas frequentes sobre o desenvolvimento, arquitetura e recursos do sistema.
> Última atualização: 2024-06

---

## Perguntas Gerais

### Já existe um sistema de login implantado?
Sim. O sistema possui autenticação JWT para administradores e clientes. O login de admin é feito via `/api/auth/admin-login` e o de clientes via `/api/clients/login`.

### Já existe um endpoint para clientes?
Sim. O CRUD de clientes está disponível em `/api/clients` e documentado em `docs/api/clients.md`.

### Como funciona a autenticação?
A autenticação é baseada em JWT. Endpoints administrativos exigem o token de admin, enquanto endpoints de cliente usam o token do próprio cliente.

### Quais entidades principais já estão implementadas?
- Clientes
- Planos
- Administradores
- Participantes
- Listas de Participantes
- Recompensas
- Landing Pages
- LP-Divulgação
- LP-Indicadores

### Existe documentação dos endpoints?
Sim. Veja a pasta `docs/api/` para detalhes de cada recurso. Alguns endpoints avançados ainda estão sendo documentados.

### Como cadastrar um novo admin?
Via endpoint `/api/admins` (CRUD completo disponível).

### O sistema já envia e-mails?
Sim, há integração com templates de e-mail para onboarding, recuperação de senha, etc.

### Como rodar o backend localmente?
Veja o `README.md` para instruções de setup, variáveis de ambiente e dependências.

---

## Perguntas sobre Fluxos Específicos

### Como funciona o fluxo de trial para clientes?
O endpoint `/api/clients/trial` permite criar um cliente em modo trial, com plano e período definidos.

### Como importar participantes em massa?
Use o endpoint `/api/participants/import` enviando um arquivo CSV conforme o modelo aceito.

### Como publicar uma landing page?
Use o endpoint `/api/landing-pages/:id/publish` (ou equivalente nas LPs específicas).

---

## Melhoria Contínua
Sugira novas perguntas para este FAQ sempre que identificar dúvidas recorrentes no time ou mudanças relevantes no sistema. 