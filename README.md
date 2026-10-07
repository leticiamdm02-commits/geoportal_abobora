# 🌍 GEOPORTAL • BACIA DO RIBEIRÃO ABÓBORA (WEBGIS CIENTÍFICO & INTERATIVO)

WebGIS interativo, completo e de padrão acadêmico-científico vinculado à **Universidade Federal de Goiás (UFG)**, desenvolvido para monitoramento ambiental, gestão de recursos hídricos e análise temporal da **Bacia Hidrográfica do Ribeirão Abóbora** (Rio Verde - GO).

O foco central da pesquisa é a dinâmica de **Uso e Cobertura da Terra nas Áreas de Preservação Permanente (APPs)** entre os anos de **1985**, **2012** e **2025**, complementada pela visualização contextual de toda a extensão da bacia hidrográfica (~198,7 km²).

---

## 🏛️ Identidade Visual Institucional UFG
- Logotipo oficial da **Universidade Federal de Goiás (UFG)** integrado no cabeçalho e nos metadados técnicos.
- Alternância dinâmica entre versões escura e branca de alto contraste conforme o tema selecionado.

---

## 🚀 Como Executar o Geoportal

Você pode iniciar o Geoportal de **duas formas extremamente simples**:

### Opção 1: Execução com 1 Clique (Recomendado)
- Dê um **duplo clique** no arquivo:
  ```bash
  iniciar_geoportal.bat
  ```
- O script iniciará automaticamente um servidor HTTP local otimizado (`server.py`) e abrirá a aplicação instantaneamente no seu navegador padrão no endereço:
  `http://localhost:8080`

### Opção 2: Execução Direta (Sem Servidor)
- Basta dar um **duplo clique** no arquivo `index.html`.
- O WebGIS possui camadas pré-carregadas em `js/layers_data.js` preparadas para funcionar sem nenhuma restrição ou bloqueio de CORS!

---

## 🌓 Modo Claro e Escuro (Dia & Noite)
- Botão dedicado no cabeçalho para alternar instantaneamente entre:
  - **Modo Escuro (Noite):** Alto contraste, estilo cartográfico moderno e descanso visual para análises prolongadas.
  - **Modo Claro (Dia):** Fundo branco/slate claro, visual limpo, acadêmico e ideal para relatórios e impressões.
- A preferência do usuário é memorizada automaticamente via `localStorage`.

---

## 🗺️ Os 3 Mapas de Fundo (Basemaps Oficiais)

O Geoportal dispõe de **3 mapas base de altíssima definição**, selecionáveis na aba **Mapas de Fundo**:

1. **1. Google Híbrido**: Fotografia de satélite combinada com arruamento, malha viária e toponímia.
2. **2. Esri Imagem de Satélite**: Imagem orbital pura em altíssima resolução óptica.
3. **3. Esri Topográfico**: Base com relevo sombreado, hidrografia e curvas de nível altimétricas.

---

## 📂 Camadas Vetoriais e Estrutura dos Dados

### 1. Foco do Estudo: Áreas de Preservação Permanente (APPs)
- **`APP_uso_de_cobertura_1985.geojson`**: Situação do uso da terra nas APPs em 1985.
- **`APP_uso_de_cobertura_2012.geojson`**: Situação no marco legal do Novo Código Florestal (Lei nº 12.651/2012).
- **`APP_uso_de_cobertura_2025.geojson`**: Situação contemporânea consolidada das APPs.
- **`delimitacao_APP.geojson`**: Faixa marginal e buffer legal das APPs marcado com linha fina e discreta tracejada verde esmeralda.

### 2. Contexto Macrorregional: Toda a Bacia Hidrográfica
*(Apresentada em aba própria para consulta, mantendo o destaque visual nas APPs)*
- **`uso_de_cobertura_RA_1985.geojson`**: Uso do solo na bacia completa em 1985.
- **`uso_de_cobertura_RA_2012.geojson`**: Uso do solo na bacia completa em 2012.
- **`uso_de_cobertura_RA_2025.geojson`**: Uso do solo na bacia completa em 2025.

### 3. Estrutura e Hidrografia
- **`bacia_RA.geojson`**: Delimitação da bacia (198,7 km²) com contorno fino e discreto tracejado.
- **`drenagem_RA.geojson`**: 113 trechos fluviais hierarquizados com traçado fino e elegante (Eixo Principal e Afluentes).

---

## 🎨 Padronização de Cores MapBiomas (`cod_2015.qml`)

As cores e classes seguem a tabela oficial do MapBiomas Coleção Brasil:

| Classe de Cobertura | Cor Hexadecimal | Representação Visual |
| :--- | :---: | :---: |
| Formação Florestal | `#1F8D49` | 🟢 Verde Florestal |
| Formação Savânica | `#7DC975` | 🟢 Verde Savana |
| Silvicultura | `#7A5900` | 🟤 Marrom Silvicultura |
| Campo Alagado e Área Pantanosa | `#519799` | 🟦 Azul Acinzentado |
| Formação Campestre | `#D6BC74` | 🟡 Bege Campestre |
| Pastagem | `#EDDE8E` | 🟡 Amarelo Pastagem |
| Cana | `#DB7093` | 🌸 Rosa Cana |
| Mosaico de Usos | `#FFEFC3` | 🟨 Creme Claro |
| Área Urbanizada | `#D4271E` | 🔴 Vermelho Urbano |
| Outras Áreas não Vegetadas | `#DB4D4F` | 🛑 Vermelho Claro |
| Rio, Lago e Oceano | `#2532E4` | 🔵 Azul Hidrográfico |
| Soja | `#F5B3C8` | 🌺 Rosa Claro (Soja) |
| Outras Lavouras Temporárias | `#F54CA9` | 🪷 Magenta Agrícola |

> **Simbologia de Seleção:** Ao filtrar ou clicar em uma classe de uso, o contorno de seleção é apresentado com traçado fino e sutilmente opaco, preservando a harmonia da representação cartográfica.

---

## ⚠️ Limitações do Estudo e Nota Metodológica

> **Aviso Importante:** Este geoportal foi desenvolvido para fins estritamente didáticos e demonstrativos. A análise de Uso e Cobertura da Terra utiliza a base de dados do MapBiomas (resolução espacial de 30m), derivada de imagens da série Landsat. Devido à escala e resolução espacial desses dados, podem ocorrer inconsistências ou falhas no mapeamento da cobertura vegetal e do solo em pequenas feições. Por essa razão, este produto não é indicado para delimitações ou diagnósticos de Áreas de Preservação Permanente (APP) em nível de detalhamento local/propriedade, sendo recomendado para análises de caráter regional e para o aprendizado de técnicas de geoprocessamento.

---

## ⚡ Recursos Interativos do Geoportal

- **Player Temporal Automático**: Reproduza a evolução histórica das APPs com controles de reproduzir e pausar.
- **Gráficos e Estatísticas Dinâmicos (Chart.js)**: Gráficos de barras temporais e pizza com resumo de regeneração vegetal e antropização.
- **Tabela de Atributos Completa**: Consulta tabular com filtro dinâmico de texto e clique na linha para dar zoom na feição no mapa.
- **Medição Geodésica (Turf.js)**: Cálculos precisos de extensões lineares (m/km) e áreas poligonais (ha/km²).
- **Leitura Contínua de Coordenadas**: Coordenadas geodésicas (Lat/Lon) e projetadas métricas (UTM 22S - SIRGAS 2000).
- **Exportação de Mapas**: Captura instantânea em PNG de alta resolução.
- **Download dos Dados**: Acesso direto a todos os arquivos GeoJSON e estilos QML na aba Sobre.

---

## 📐 Especificações Técnicas e Cartográficas

- **Instituição:** Universidade Federal de Goiás (UFG)
- **Área de Estudo:** Bacia Hidrográfica do Ribeirão Abóbora, Rio Verde - GO
- **Datum Horizontal Original:** SIRGAS 2000 (EPSG: 4674)
- **Projeção Cartográfica:** UTM Zona 22 Sul (EPSG: 31982)
- **Visualização WebGIS:** WGS 84 / Pseudo-Mercator (EPSG: 3857 / 4326)
- **Bibliotecas:** Leaflet 1.9.4, Turf.js, Chart.js 4.4, FontAwesome 6, html2canvas
