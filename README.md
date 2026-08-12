# Vizinho Link

Prompt - Lovable

Crie a arquitetura full-stack (frontend e backend) para a plataforma

"Vizinho Indica", um marketplace de serviços comunitário. O design deve

ser Light Mode, moderno e acolhedor, utilizando a biblioteca Shadcn/UI e

Tailwind CSS. O backend já está configurado no Supabase.

Paleta de Cores e Estilo Visual:

Fundo Principal (Light Mode): #F8FAFC (Slate 50 - cinza muito suave para

conforto visual).

Destaque Primário (Botões/Links): #059669 (Emerald 600 - verde que

transmite confiança e vizinhança).

Destaque Secundário (Avaliações/Alertas): #F59E0B (Amber 500 - cor de

ouro para as estrelas e destaques).

Texto Principal/Cabeçalhos: #1E293B (Slate 800 - contraste forte para

leitura).

Texto Secundário/Corpo: #64748B (Slate 500).

Card Background: #FFFFFF (Branco puro com sombras suaves shadow-sm).

Gradiente: Use o gradiente linear-gradient(135deg, #059669, #34D399) para

o Hero Section ou botões de destaque máximo.

Estrutura de Páginas (Layouts): Gere o layout e o scaffolding conectando

os componentes às tabelas do Supabase já existentes.

A. Home (Vitrine de Serviços - Pública/Híbrida):

Hero Section: Título grande "Encontre profissionais de confiança no seu

condomínio", com uma barra de busca centralizada grande (Input com ícone

de lupa) e filtros rápidos (Pills/Badges) para categorias (Reformas,

Aulas, Culinária).

Grid de Destaques: Utilize a View SQL v_servicos_destaque para renderizar

cards.

Componente do Card: Deve conter a foto do serviço (aspect-ratio 16/9),

foto do prestador (avatar circular pequeno), título, preço estimado e,

obrigatoriamente, a média de estrelas (ícone ⭐ + nota) que vem da View.

Floating Action Button (Mobile): Um botão flutuante para "Anunciar" no

canto inferior direito.

B. Detalhes do Serviço (/servico/:id - Onde :id é Int8):

Layout de Coluna Dupla (Desktop):

Esquerda: Galeria de fotos do serviço e descrição detalhada.Direita (Sticky): Card do perfil do prestador (tabela profiles) com botão

"Chamar no Chat" (CTA Primário) e botão "Favoritar" (ícone de coração

outline/fill).

Seção de Prova Social: Lista de comentários vindos da tabela avaliacoes,

exibindo nome do vizinho e a nota dada.

C. Dashboard do Usuário (Área Protegida):

Sidebar ou Menu Superior: Links para "Meus Anúncios", "Favoritos" e

"Mensagens".

Meus Anúncios: Tabela ou Lista de cards mostrando os serviços que o

usuário cadastrou (tabela servicos), com opções de Editar/Excluir.

Chat Interno: Interface tipo WhatsApp Web. Lista de conversas à esquerda

e área de chat à direita. Deve ler da tabela mensagens.

Requisitos Arquiteturais e de Dados:

Conexão Supabase: O projeto DEVE respeitar o schema existente onde os IDs

são numéricos (int8), não UUIDs nas rotas (ex: /servico/42).

Autenticação: Telas de Login/Registro limpas e centralizadas, usando o

componente Auth do Supabase.

Componentização:

Use Card, Badge, Avatar, Button e Dialog do Shadcn/UI.

Crie um componente StarRating reutilizável para exibir as notas.

Linguagem: O código-fonte gerado deve usar TypeScript e Tailwind CSS. projectID;

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://shared-skillz.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/5082edc5-fa26-4cff-b95a-ec575dfd656d).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
