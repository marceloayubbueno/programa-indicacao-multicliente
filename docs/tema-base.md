# Tema Base – Programa de Indicação

## Visão Geral
Este documento define o padrão visual do sistema, servindo como referência para todo o time de desenvolvimento e design. Aqui você encontra a paleta de cores, tipografia, espaçamentos, componentes base, exemplos de uso e orientações para migrar telas para o novo padrão.

> **Resumo rápido:** Um resumo deste tema base está disponível no início do arquivo `client/css/tailwind.css` para consulta rápida durante o desenvolvimento. Sempre consulte este documento para detalhes, exemplos e decisões de design.

---

## Paleta de Cores
| Elemento         | Claro           | Escuro           | Tailwind         |
|------------------|-----------------|------------------|------------------|
| Fundo            | #ffffff         | #181C23          | bg-white / bg-gray-900 |
| Sidebar          | #f3f4f6         | #232936          | bg-gray-100 / bg-gray-800 |
| Card             | #ffffff         | #232936          | bg-white / bg-gray-800 |
| Azul destaque    | #3B82F6         | #3B82F6          | text-blue-600 / bg-blue-100 |
| Verde            | #22C55E         | #22C55E          | text-green-500   |
| Vermelho         | #EF4444         | #EF4444          | text-red-500     |
| Texto            | #181C23         | #F3F4F6          | text-gray-900 / text-gray-100 |

---

## Tipografia
- **Fonte principal:** Inter, sans-serif (Tailwind padrão)
- **Títulos:** `font-bold`, tamanhos: `text-2xl`, `text-3xl`
- **Texto normal:** `text-base`, `text-gray-900` (claro), `text-gray-100` (escuro)

---

## Espaçamentos
- **Cards:** `p-6`, `rounded-xl`, `shadow`, `border` (claro)
- **Sidebar:** `py-6 px-4`, `w-64`
- **Header:** `px-8 py-6`
- **Gaps:** `gap-4`, `gap-6`, `mb-8`

---

## Componentes Padrão
### Sidebar
```html
<nav class="w-64 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 ...">
  ...
</nav>
```

### Card
```html
<div class="bg-white dark:bg-gray-800 rounded-xl p-6 shadow border border-gray-200 dark:border-none ...">
  ...
</div>
```

### Botão de Tema
```html
<button class="p-2 rounded-full border border-gray-300 dark:border-gray-600 bg-gray-200 dark:bg-gray-700 ...">
  <span>🌙</span>
</button>
```

### Item Ativo do Menu
- Claro: `bg-blue-100 text-blue-600`
- Escuro: `bg-gray-900 text-blue-400`

---

## Dark Mode
- Ativado por classe `dark` no `<html>`.
- Use sempre classes `dark:` para cores e textos.
- O botão de alternância de tema já está implementado no dashboard.

---

## Como usar o documento mãe (resumo no CSS)
- O início do arquivo `client/css/tailwind.css` contém um resumo deste tema base para consulta rápida.
- Sempre que for criar ou migrar componentes, consulte o resumo para saber quais classes e padrões usar.
- Para detalhes, exemplos e decisões de design, consulte este documento completo em `docs/tema-base.md`.
- **Mantenha ambos atualizados:** Se mudar o padrão visual, atualize o resumo no CSS e este documento.

---

## Como migrar telas para o novo padrão
1. **Remova o CSS antigo da página.**
2. **Aplique as classes do Tailwind** conforme o padrão deste documento.
3. **Use os exemplos de sidebar, header, cards e botões** como base.
4. **Garanta responsividade e dark mode** usando as classes utilitárias do Tailwind.
5. **Valide visualmente** em ambos os temas.
6. **Dúvidas? Consulte este documento ou o resumo no CSS.**

---

## Referências Visuais
- [FirstPromoter Dashboard](https://firstpromoter.com/)
- [Tailwind UI](https://tailwindui.com/)
- [Heroicons](https://heroicons.com/)

Inclua prints ou links de referência aqui conforme o projeto evoluir.

---

## Contribuição
- Mantenha este documento atualizado ao evoluir o design.
- Sugestões e melhorias são bem-vindas! 