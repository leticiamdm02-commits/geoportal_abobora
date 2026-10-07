# 🌐 Como Colocar o Geoportal Online e Compartilhar com Qualquer Pessoa

Este WebGIS foi projetado com uma arquitetura estática moderna (**Client-side GIS**). Todos os dados geoespaciais, bibliotecas cartográficas e estilos funcionam diretamente no navegador do usuário, **sem necessidade de banco de dados ou servidor pago**.

Isso significa que você pode hospedá-lo **100% GRÁTIS, com segurança HTTPS (cadeado verde) e velocidade global**.

---

## 🥇 Opção 1: Netlify Drop (A Mais Fácil e Rápida — Em 1 Minuto)
*Ideal se você quer um link para enviar no WhatsApp ou e-mail imediatamente, sem instalar nada.*

1. Acesse o site gratuito: **[app.netlify.com/drop](https://app.netlify.com/drop)**
2. Abra a pasta `C:\estagio_2026\WebGis\geoportal` no seu computador.
3. **Arraste e solte** a pasta `geoportal` inteira dentro da área indicada no navegador.
4. Aguarde alguns segundos enquanto os arquivos sobem.
5. Pronto! O Netlify criará um link público instantâneo (exemplo: `https://geoportal-abobora.netlify.app`).
6. *(Opcional)* Você pode criar uma conta gratuita para mudar o nome do link para o que preferir nas configurações de *Site Settings -> Change site name*.

---

## 🎓 Opção 2: GitHub Pages (Padrão Ouro Acadêmico — Recomendado para UFG)
*Ideal para colocar o link em artigos científicos, dissertações, TCCs e relatórios técnicos.*

1. Crie uma conta gratuita no **[github.com](https://github.com)** (caso ainda não tenha).
2. Clique no botão **"New repository"** (Novo repositório).
3. Dê o nome ao repositório, por exemplo: `geoportal-abobora`.
4. Deixe como **Public** (Público) e clique em **Create repository**.
5. Na página que se abrir, clique em **"uploading an existing file"** (enviar arquivos existentes) ou use o Git pelo terminal:
   ```bash
   git init
   git add .
   git commit -m "Publicação do Geoportal Bacia do Ribeirão Abóbora"
   git branch -M main
   git remote add origin https://github.com/SEU-USUARIO/geoportal-abobora.git
   git push -u origin main
   ```
6. No seu repositório no GitHub, vá em **Settings** (Configurações) -> menu lateral esquerdo **Pages**.
7. Em **Build and deployment -> Branch**, selecione a branch `main` e a pasta `/ (root)`.
8. Clique em **Save**.
9. Em cerca de 1 a 2 minutos, seu Geoportal estará no ar no endereço:
   👉 **`https://SEU-USUARIO.github.io/geoportal-abobora/`**

---

## ⚡ Opção 3: Vercel (Ultra Rápido)
1. Acesse **[vercel.com](https://vercel.com)** e faça login com sua conta do GitHub ou e-mail.
2. Clique em **"Add New..." -> "Project"**.
3. Importe o repositório do seu GitHub ou instale o Vercel CLI no computador (`npm i -g vercel`).
4. Clique em **Deploy**.
5. Seu site receberá um link automático com certificado SSL: `https://geoportal-abobora.vercel.app`.

---

## 🔒 Segurança e Desempenho
- O arquivo `js/layers_data.js` já contém todas as 9 camadas pré-carregadas e otimizadas.
- Qualquer pessoa no celular, tablet ou computador poderá navegar, alternar anos, medir distâncias e consultar a tabela sem precisar instalar nenhum programa SIG (como QGIS).
