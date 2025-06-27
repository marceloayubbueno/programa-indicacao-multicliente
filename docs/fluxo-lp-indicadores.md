# Fluxo da Landing Page (LP) de Indicadores

## Visão Geral
A Landing Page (LP) de Indicadores é um dos principais pontos de captação de novos participantes para campanhas de indicação. O fluxo foi desenhado para garantir padronização, integração robusta entre frontend e backend, e facilidade de manutenção e evolução.

---

## 1. Geração e Edição da LP
- A LP é criada e editada por meio do editor visual (GrapesJS), acessível pelo painel administrativo.
- O editor oferece blocos prontos (formulário, hero, benefícios, etc.) que podem ser arrastados para o canvas.
- O bloco de formulário já vem padronizado com os campos essenciais:
  - Nome completo (`<input type="text" name="name" ... >`)
  - E-mail (`<input type="email" name="email" ... >`)
  - Telefone/WhatsApp (`<input type="tel" name="phone" ... >`)
- O HTML e CSS gerados são salvos no backend, no campo `compiledOutput` da entidade da LP.

---

## 2. Publicação e Preview
- Ao salvar a LP, o backend aplica pós-processamento para garantir padronização dos campos (ex: `name="name"`, `name="email"`, etc.).
- O preview da LP é acessível via `/client/pages/lp-preview.html?id=<id_da_lp>`, que carrega o HTML/CSS dinâmico do backend.
- O backend também pode servir a LP publicada em uma URL amigável.

---

## 3. Integração Frontend-Backend
- O formulário da LP utiliza JS dedicado (`lp-indicador-form-public.js`) para:
  - Validar campos obrigatórios no frontend.
  - Enviar os dados via `fetch` para o endpoint do backend (`/api/lp-indicadores/submit-form`).
  - Exibir feedback de sucesso ou erro ao usuário.
- O backend valida novamente os dados recebidos e registra o novo indicador.
- O fluxo é seguro contra campos ausentes ou mal formatados.

---

## 4. Requisitos e Padronização dos Campos
- **Campo Nome:** Obrigatório, deve ter `name="name"` no HTML.
- **Campo E-mail:** Obrigatório, deve ter `name="email"`.
- **Campo Telefone:** Obrigatório, deve ter `name="phone"`.
- Outros campos opcionais podem ser adicionados, mas recomenda-se seguir o padrão de nomes para integração.
- O formulário deve estar dentro de `<form class="lp-indicador-form">` para que o JS de integração funcione corretamente.

---

## 5. Dicas de Manutenção e Evolução
- Sempre utilize os blocos padrão do editor visual para garantir compatibilidade.
- Ao criar novos blocos ou campos customizados, siga o padrão de nomes e atributos.
- Se alterar o template base, valide o HTML final no DevTools para garantir que todos os campos essenciais possuem o atributo `name` correto.
- Em caso de erro no envio do formulário, verifique primeiro o HTML renderizado e depois o JS de integração.
- Documente qualquer customização ou exceção para facilitar o onboarding de novos devs.

---

## 6. Referências
- Código do editor visual: `client/pages/lp-editor-grapes.html`
- JS de integração do formulário: `client/js/lp-indicador-form-public.js`
- Pós-processamento backend: `server/src/lp-indicadores/lp-indicadores.service.ts`
- API de submissão: `POST /api/lp-indicadores/submit-form`

---

**Última atualização:** {DATA_ATUAL} 