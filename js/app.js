/**
 * GEOPORTAL • BACIA DO RIBEIRÃO ABÓBORA (WEBGIS INTERATIVO)
 * Lógica Principal da Aplicação
 * Padrão MapBiomas (cod_2015.qml) | 6 Basemaps | Análise Temporal
 */

(function () {
  'use strict';

  // =========================================================================
  // 1. DICIONÁRIO OFICIAL MAPBIOMAS (cod_2015.qml)
  // =========================================================================
  const MAPBIOMAS = {
    3:  { name: 'Formação Florestal',               color: '#1F8D49' },
    4:  { name: 'Formação Savânica',                color: '#7DC975' },
    9:  { name: 'Silvicultura',                     color: '#7A5900' },
    11: { name: 'Campo Alagado e Área Pantanosa',   color: '#519799' },
    12: { name: 'Formação Campestre',               color: '#D6BC74' },
    15: { name: 'Pastagem',                         color: '#EDDE8E' },
    20: { name: 'Cana',                             color: '#DB7093' },
    21: { name: 'Mosaico de Usos',                  color: '#FFEFC3' },
    24: { name: 'Área Urbanizada',                  color: '#D4271E' },
    25: { name: 'Outras Áreas não Vegetadas',       color: '#DB4D4F' },
    33: { name: 'Rio, Lago e Oceano',               color: '#2532E4' },
    39: { name: 'Soja',                             color: '#F5B3C8' },
    41: { name: 'Outras Lavouras Temporárias',      color: '#F54CA9' }
  };

  // =========================================================================
  // =========================================================================
  // 2. CONFIGURAÇÃO DOS 3 MAPAS DE FUNDO OFICIAIS (BASEMAPS)
  // =========================================================================
  const BASEMAPS = {
    google_hybrid: {
      name: '1. Google Híbrido',
      layer: L.tileLayer('https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}', {
        maxZoom: 20,
        attribution: '&copy; Google Maps'
      })
    },
    esri_satellite: {
      name: '2. Esri Imagem de Satélite',
      layer: L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        maxZoom: 19,
        attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
      })
    },
    esri_topo: {
      name: '3. Esri Topográfico',
      layer: L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}', {
        maxZoom: 19,
        attribution: 'Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ, TomTom, Intermap, iPC, USGS, FAO, NPS, NRCAN, GeoBase, Kadaster NL, Ordnance Survey, Esri Japan, METI, Esri China (Hong Kong), and the GIS User Community'
      })
    }
  };

  // =========================================================================
  // 3. ESTADO GLOBAL DA APLICAÇÃO
  // =========================================================================
  const appState = {
    map: null,
    currentBasemapKey: 'google_hybrid',
    layers: {
      bacia: null,
      drenagem: null,
      delimitacao_app: null,
      app_1985: null,
      app_2012: null,
      app_2025: null,
      bacia_uso_1985: null,
      bacia_uso_2012: null,
      bacia_uso_2025: null
    },
    layerData: {
      bacia: null,
      drenagem: null,
      delimitacao_app: null,
      app_1985: null,
      app_2012: null,
      app_2025: null,
      bacia_uso_1985: null,
      bacia_uso_2012: null,
      bacia_uso_2025: null
    },
    baciaBounds: null,
    activeYear: 2025,
    baciaActiveYear: 2025,
    timelinePlaying: false,
    timelineTimer: null,
    selectedClassDNs: new Set(),
    measureMode: null, // 'distance' | 'area' | null
    measurePoints: [],
    measureLayer: null,
    chartInstance: null
  };

  // =========================================================================
  // 4. INICIALIZAÇÃO DO MAPA
  // =========================================================================
  function initMap() {
    // Centro inicial aproximado da Bacia do Ribeirão Abóbora
    const initialCenter = [-17.8256, -51.0245];
    const initialZoom = 12;

    appState.map = L.map('map', {
      center: initialCenter,
      zoom: initialZoom,
      zoomControl: false, // Usaremos nossos botões personalizados
      attributionControl: true
    });

    // Adiciona o basemap padrão (Google Híbrido)
    BASEMAPS[appState.currentBasemapKey].layer.addTo(appState.map);

    // Escala gráfica métrica
    L.control.scale({
      position: 'bottomright',
      metric: true,
      imperial: false
    }).addTo(appState.map);

    // Camada para desenhos de medição
    appState.measureLayer = L.featureGroup().addTo(appState.map);

    // Listeners do mapa para coordenadas
    appState.map.on('mousemove', onMapMouseMove);
    appState.map.on('zoomend', onMapZoomEnd);

    // Eventos de clique para medição
    appState.map.on('click', onMapClickMeasure);
    appState.map.on('dblclick', onMapDblClickMeasure);
  }

  // =========================================================================
  // 5. CARREGAMENTO DOS DADOS VETORIAIS
  // =========================================================================
  async function loadAllLayers() {
    showToast('Carregando camadas geográficas...', 'info');

    // Usa dados embutidos de layers_data.js se disponível, senão faz fetch
    const fileMap = {
      bacia: 'bacia_RA.geojson',
      drenagem: 'drenagem_RA.geojson',
      delimitacao_app: 'delimitacao_APP.geojson',
      app_1985: 'APP_uso_de_cobertura_1985.geojson',
      app_2012: 'APP_uso_de_cobertura_2012.geojson',
      app_2025: 'APP_uso_de_cobertura_2025.geojson',
      bacia_uso_1985: 'uso_de_cobertura_RA_1985.geojson',
      bacia_uso_2012: 'uso_de_cobertura_RA_2012.geojson',
      bacia_uso_2025: 'uso_de_cobertura_RA_2025.geojson'
    };

    for (const key of Object.keys(fileMap)) {
      if (window.GEOPORTAL_DATA && window.GEOPORTAL_DATA[key]) {
        appState.layerData[key] = window.GEOPORTAL_DATA[key];
      } else {
        try {
          const resp = await fetch(fileMap[key]);
          if (resp.ok) {
            appState.layerData[key] = await resp.json();
          }
        } catch (e) {
          console.warn(`Erro ao carregar ${fileMap[key]}:`, e);
        }
      }
    }

    createVectorLayers();
    setupBaciaBounds();
    renderMapBiomasLegend();
    renderSummaryStatistics();
    initChart();
    populateAttributesTable('app_2025');

    showToast('Geoportal carregado com sucesso!', 'success');
  }

  // =========================================================================
  // 6. CRIAÇÃO DAS CAMADAS VETORIAIS COM ESTILOS
  // =========================================================================
  function createVectorLayers() {
    // 1. Limite da Bacia Hidrográfica (Linha fina e discreta)
    if (appState.layerData.bacia) {
      appState.layers.bacia = L.geoJSON(appState.layerData.bacia, {
        style: {
          color: '#64748b',
          weight: 1.1,
          dashArray: '4, 4',
          fillColor: '#0284c7',
          fillOpacity: 0.02
        },
        onEachFeature: function (feature, layer) {
          const props = feature.properties || {};
          const areaHa = props.Area_Ha ? Number(props.Area_Ha).toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : '19.870,07';
          const areaKm2 = props.Area_km2 ? Number(props.Area_km2).toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : '198,70';
          
          layer.bindPopup(`
            <div class="custom-popup">
              <div class="popup-header">
                <i class="fa-solid fa-mountain-sun" style="color:#0284c7"></i>
                <span class="popup-title">Bacia do Ribeirão Abóbora</span>
              </div>
              <div class="popup-row">
                <span class="popup-lbl">Área Total:</span>
                <span class="popup-val">${areaHa} ha</span>
              </div>
              <div class="popup-row">
                <span class="popup-lbl">Área em km²:</span>
                <span class="popup-val">${areaKm2} km²</span>
              </div>
              <div class="popup-row">
                <span class="popup-lbl">Município:</span>
                <span class="popup-val">Rio Verde - GO</span>
              </div>
            </div>
          `);
        }
      }).addTo(appState.map);
    }

    // 2. Camadas de Uso Integral de Toda a Bacia (Contexto Macrorregional)
    // NOTA: Permanecem desmarcadas inicialmente para não ofuscar o FOCO DO ESTUDO que são as APPs
    ['1985', '2012', '2025'].forEach(year => {
      const key = `bacia_uso_${year}`;
      if (appState.layerData[key]) {
        appState.layers[key] = L.geoJSON(appState.layerData[key], {
          style: function (feature) {
            const dn = Number(feature.properties.DN);
            const mb = MAPBIOMAS[dn] || { name: 'Outros', color: '#999999' };
            return {
              fillColor: mb.color,
              fillOpacity: 0.70,
              color: mb.color,
              weight: 0.25,
              opacity: 0.5
            };
          },
          onEachFeature: function (feature, layer) {
            const props = feature.properties || {};
            const dn = Number(props.DN);
            const mb = MAPBIOMAS[dn] || { name: props.uso_de_cob || 'Classe', color: '#999' };
            const areaKm2 = Number(props.area_km2 || props.area_k2 || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 });
            const areaHa = Number(props.area_ha || (Number(props.area_km2 || props.area_k2 || 0) * 100)).toLocaleString('pt-BR', { minimumFractionDigits: 2 });

            layer.bindPopup(`
              <div class="custom-popup">
                <div class="popup-header">
                  <span class="popup-color-pill" style="background:${mb.color}"></span>
                  <span class="popup-title">${mb.name}</span>
                </div>
                <div class="popup-row">
                  <span class="popup-lbl">Contexto:</span>
                  <span class="popup-val">Bacia Integral (${year})</span>
                </div>
                <div class="popup-row">
                  <span class="popup-lbl">Uso de cobertura:</span>
                  <span class="popup-val">${mb.name}</span>
                </div>
                <div class="popup-row">
                  <span class="popup-lbl">Área na Bacia:</span>
                  <span class="popup-val">${areaHa} ha (${areaKm2} km²)</span>
                </div>
              </div>
            `);
          }
        });
      }
    });

    // 3. Camadas de Uso e Cobertura nas APPs (1985, 2012, 2025 - FOCO DO ESTUDO)
    ['1985', '2012', '2025'].forEach(year => {
      const key = `app_${year}`;
      if (appState.layerData[key]) {
        appState.layers[key] = L.geoJSON(appState.layerData[key], {
          style: function (feature) {
            const dn = Number(feature.properties.DN);
            const mb = MAPBIOMAS[dn] || { name: 'Outros', color: '#999999' };
            const hasFilter = appState.selectedClassDNs.size > 0;
            const isSelected = !hasFilter || appState.selectedClassDNs.has(dn);

            return {
              fillColor: mb.color,
              fillOpacity: isSelected ? 0.85 : 0.04,
              color: isSelected ? (hasFilter ? 'rgba(255, 255, 255, 0.45)' : mb.color) : mb.color,
              weight: isSelected ? (hasFilter ? 0.75 : 0.35) : 0.15,
              opacity: isSelected ? (hasFilter ? 0.7 : 0.8) : 0.05
            };
          },
          onEachFeature: function (feature, layer) {
            const props = feature.properties || {};
            const dn = Number(props.DN);
            const mb = MAPBIOMAS[dn] || { name: props.uso_de_cob || 'Classe', color: '#999' };
            const areaHa = Number(props.area_ha || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 });
            const areaKm2 = Number(props.area_km2 || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 });

            layer.bindPopup(`
              <div class="custom-popup">
                <div class="popup-header">
                  <span class="popup-color-pill" style="background:${mb.color}"></span>
                  <span class="popup-title">${mb.name}</span>
                </div>
                <div class="popup-row">
                  <span class="popup-lbl">Ano de Cobertura:</span>
                  <span class="popup-val"><strong>${year}</strong></span>
                </div>
                <div class="popup-row">
                  <span class="popup-lbl">Uso de cobertura:</span>
                  <span class="popup-val">${mb.name}</span>
                </div>
                <div class="popup-row">
                  <span class="popup-lbl">Área em APP:</span>
                  <span class="popup-val">${areaHa} ha</span>
                </div>
                <div class="popup-row">
                  <span class="popup-lbl">Área em km²:</span>
                  <span class="popup-val">${areaKm2} km²</span>
                </div>
              </div>
            `);

            layer.on({
              mouseover: function (e) {
                const l = e.target;
                l.setStyle({ weight: 1.1, color: 'rgba(255, 255, 255, 0.7)' });
                l.bringToFront();
              },
              mouseout: function (e) {
                if (appState.layers[key]) {
                  appState.layers[key].resetStyle(e.target);
                }
              }
            });
          }
        });

        // Adiciona ao mapa se for o ano ativo
        if (year === '2025') {
          appState.layers[key].addTo(appState.map);
        }
      }
    });

    // 4. Delimitação das APPs (Borda fina e discreta)
    if (appState.layerData.delimitacao_app) {
      appState.layers.delimitacao_app = L.geoJSON(appState.layerData.delimitacao_app, {
        style: {
          color: '#059669',
          weight: 0.9,
          dashArray: '3, 3',
          fillColor: 'transparent',
          fillOpacity: 0.0,
          opacity: 0.85
        },
        onEachFeature: function (feature, layer) {
          layer.bindPopup(`
            <div class="custom-popup">
              <div class="popup-header">
                <i class="fa-solid fa-shield-halved" style="color:#059669"></i>
                <span class="popup-title">Delimitação Legal de APP</span>
              </div>
              <div class="popup-row">
                <span class="popup-lbl">Categoria:</span>
                <span class="popup-val">Área de Preservação Permanente</span>
              </div>
              <div class="popup-row">
                <span class="popup-lbl">Legislação:</span>
                <span class="popup-val">Lei Federal nº 12.651/2012</span>
              </div>
              <div class="popup-row">
                <span class="popup-lbl">Simbologia:</span>
                <span class="popup-val">Faixa Marginal / Buffer Legal</span>
              </div>
            </div>
          `);
        }
      }).addTo(appState.map);
    }

    // 5. Rede de Drenagem (Linha mais fina e elegante)
    if (appState.layerData.drenagem) {
      appState.layers.drenagem = L.geoJSON(appState.layerData.drenagem, {
        style: function (feature) {
          const isMain = feature.properties && feature.properties.EIXOPRINCI === 'Sim';
          return {
            color: isMain ? '#0284c7' : '#38bdf8',
            weight: isMain ? 1.4 : 0.75,
            opacity: isMain ? 0.95 : 0.85
          };
        },
        onEachFeature: function (feature, layer) {
          const props = feature.properties || {};
          const nome = props.NOME || 'Curso d\'água sem denominação';
          const isMain = props.EIXOPRINCI === 'Sim' ? 'Eixo Principal' : 'Afluente';
          const regime = props.REGIME || 'Não informado';

          layer.bindTooltip(nome, { sticky: true, className: 'water-tooltip' });
          layer.bindPopup(`
            <div class="custom-popup">
              <div class="popup-header">
                <i class="fa-solid fa-water" style="color:#0284c7"></i>
                <span class="popup-title">${nome}</span>
              </div>
              <div class="popup-row">
                <span class="popup-lbl">Classificação:</span>
                <span class="popup-val">${isMain}</span>
              </div>
              <div class="popup-row">
                <span class="popup-lbl">Regime:</span>
                <span class="popup-val">${regime}</span>
              </div>
            </div>
          `);
        }
      }).addTo(appState.map);
    }

    // Garante ordem correta de sobreposição: hidrografia e borda de APP no topo
    if (appState.layers.delimitacao_app) appState.layers.delimitacao_app.bringToFront();
    if (appState.layers.drenagem) appState.layers.drenagem.bringToFront();

    updateQuickLegend();
  }

  // =========================================================================
  // 7. EXTENSÃO E ZOOM DA BACIA
  // =========================================================================
  function setupBaciaBounds() {
    if (appState.layers.bacia) {
      appState.baciaBounds = appState.layers.bacia.getBounds();
      appState.map.fitBounds(appState.baciaBounds, { padding: [25, 25] });
    }
  }

  function zoomToBacia() {
    if (appState.baciaBounds) {
      appState.map.fitBounds(appState.baciaBounds, {
        padding: [30, 30],
        animate: true,
        duration: 1
      });
      showToast('Visualização ajustada para a extensão da Bacia', 'info');
    }
  }

  // =========================================================================
  // 8. TROCA DE MAPAS DE FUNDO (BASEMAPS)
  // =========================================================================
  function switchBasemap(key) {
    if (!BASEMAPS[key] || key === appState.currentBasemapKey) return;

    appState.map.removeLayer(BASEMAPS[appState.currentBasemapKey].layer);
    BASEMAPS[key].layer.addTo(appState.map);
    BASEMAPS[key].layer.bringToBack();
    appState.currentBasemapKey = key;

    // Atualiza interface de cards
    document.querySelectorAll('.basemap-card').forEach(card => {
      card.classList.toggle('active', card.dataset.basemap === key);
    });

    // Atualiza statusbar
    document.getElementById('lblActiveBasemap').innerHTML = `
      <i class="fa-solid fa-map"></i> ${BASEMAPS[key].name}
    `;

    showToast(`Mapa de fundo alterado para: ${BASEMAPS[key].name}`, 'info');
  }

  // =========================================================================
  // 9. CONTROLE TEMPORAL (1985 / 2012 / 2025)
  // =========================================================================
  function setActiveYear(year) {
    year = Number(year);
    appState.activeYear = year;

    // Atualiza botões
    document.querySelectorAll('.year-btn').forEach(btn => {
      btn.classList.toggle('active', Number(btn.dataset.year) === year);
    });

    // Atualiza camadas no mapa
    ['1985', '2012', '2025'].forEach(y => {
      const key = `app_${y}`;
      const chk = document.getElementById(`chk_${key}`);
      const isCurrent = Number(y) === year;

      if (chk) chk.checked = isCurrent;

      if (appState.layers[key]) {
        if (isCurrent) {
          if (!appState.map.hasLayer(appState.layers[key])) {
            appState.layers[key].addTo(appState.map);
          }
        } else {
          if (appState.map.hasLayer(appState.layers[key])) {
            appState.map.removeLayer(appState.layers[key]);
          }
        }
      }
    });

    // Reorganiza camadas para hidrografia ficar por cima
    if (appState.layers.drenagem && appState.map.hasLayer(appState.layers.drenagem)) {
      appState.layers.drenagem.bringToFront();
    }

    // Atualiza statusbar
    document.getElementById('lblActiveLayerName').innerHTML = `
      <i class="fa-solid fa-layer-group"></i> APP ${year}
    `;

    updateQuickLegend();
    populateAttributesTable(`app_${year}`);
    updateChart(document.getElementById('chartTypeSelect').value);
  }

  function toggleTimelinePlay() {
    const btn = document.getElementById('btnPlayTimeline');
    if (appState.timelinePlaying) {
      clearInterval(appState.timelineTimer);
      appState.timelinePlaying = false;
      btn.classList.remove('playing');
      btn.innerHTML = '<i class="fa-solid fa-play"></i>';
      showToast('Reprodução temporal pausada', 'info');
    } else {
      appState.timelinePlaying = true;
      btn.classList.add('playing');
      btn.innerHTML = '<i class="fa-solid fa-pause"></i>';
      showToast('Reproduzindo dinâmica temporal das APPs...', 'info');

      const years = [1985, 2012, 2025];
      appState.timelineTimer = setInterval(() => {
        let nextIdx = (years.indexOf(appState.activeYear) + 1) % years.length;
        setActiveYear(years[nextIdx]);
      }, 2600);
    }
  }

  // =========================================================================
  // 10. LEGENDA DE USO DE COBERTURA & FILTRO MULTI-SELEÇÃO
  // =========================================================================
  function renderMapBiomasLegend() {
    const list = document.getElementById('legendItemsList');
    list.innerHTML = '';

    // Coleta as classes presentes nos dados
    const presentDNs = new Set();
    ['1985', '2012', '2025'].forEach(yr => {
      const data = appState.layerData[`app_${yr}`];
      if (data && data.features) {
        data.features.forEach(f => presentDNs.add(Number(f.properties.DN)));
      }
    });

    // Ordena as classes
    const sortedDNs = Array.from(presentDNs).sort((a, b) => a - b);

    sortedDNs.forEach(dn => {
      const mb = MAPBIOMAS[dn];
      if (!mb) return;

      const item = document.createElement('div');
      item.className = 'legend-item';
      item.dataset.dn = dn;
      item.innerHTML = `
        <div class="legend-item-left">
          <span class="legend-color-box" style="background:${mb.color}"></span>
          <span class="legend-label">${mb.name}</span>
        </div>
        <div class="legend-item-right">
          <span class="legend-check-box"><i class="fa-solid fa-check"></i></span>
        </div>
      `;

      item.addEventListener('click', () => toggleFilterClass(dn));
      list.appendChild(item);
    });

    updateLegendUI();
  }

  function toggleFilterClass(dn) {
    if (appState.selectedClassDNs.has(dn)) {
      appState.selectedClassDNs.delete(dn);
    } else {
      appState.selectedClassDNs.add(dn);
    }

    updateLegendUI();
    applyClassFilterToLayers();
  }

  function clearLegendFilter() {
    appState.selectedClassDNs.clear();
    updateLegendUI();
    applyClassFilterToLayers();
    showToast('Filtro limpo. Todas as classes de cobertura visíveis.', 'info');
  }

  function updateLegendUI() {
    const hint = document.getElementById('legendFilterHint');
    const clearBtn = document.getElementById('btnClearLegendFilter');
    const hasFilter = appState.selectedClassDNs.size > 0;

    if (clearBtn) {
      clearBtn.style.display = hasFilter ? 'flex' : 'none';
    }

    if (hint) {
      if (hasFilter) {
        hint.textContent = `${appState.selectedClassDNs.size} selecionada(s)`;
      } else {
        hint.textContent = 'Selecione 1 ou mais';
      }
    }

    document.querySelectorAll('.legend-item').forEach(el => {
      const dn = Number(el.dataset.dn);
      if (!hasFilter) {
        el.classList.remove('selected', 'dimmed');
      } else if (appState.selectedClassDNs.has(dn)) {
        el.classList.add('selected');
        el.classList.remove('dimmed');
      } else {
        el.classList.remove('selected');
        el.classList.add('dimmed');
      }
    });
  }

  function applyClassFilterToLayers() {
    const hasFilter = appState.selectedClassDNs.size > 0;

    ['1985', '2012', '2025'].forEach(y => {
      const key = `app_${y}`;
      if (appState.layers[key]) {
        appState.layers[key].setStyle(feature => {
          const fdn = Number(feature.properties.DN);
          const mb = MAPBIOMAS[fdn] || { color: '#999' };
          const isSelected = !hasFilter || appState.selectedClassDNs.has(fdn);

          return {
            fillColor: mb.color,
            fillOpacity: isSelected ? 0.85 : 0.04,
            color: isSelected ? (hasFilter ? 'rgba(255, 255, 255, 0.45)' : mb.color) : mb.color,
            weight: isSelected ? (hasFilter ? 0.75 : 0.35) : 0.15,
            opacity: isSelected ? (hasFilter ? 0.7 : 0.8) : 0.05
          };
        });
      }
    });

    if (hasFilter) {
      const count = appState.selectedClassDNs.size;
      showToast(`${count} classe(s) de cobertura selecionada(s)`, 'info');
    }
  }

  // Mini-legenda rápida no canto inferior esquerdo do mapa
  function updateQuickLegend() {
    const body = document.getElementById('quickLegBody');
    body.innerHTML = '';

    const data = appState.layerData[`app_${appState.activeYear}`];
    if (!data || !data.features) return;

    const classStats = {};
    data.features.forEach(f => {
      const dn = Number(f.properties.DN);
      const ha = Number(f.properties.area_ha || 0);
      classStats[dn] = (classStats[dn] || 0) + ha;
    });

    Object.keys(classStats).sort((a, b) => classStats[b] - classStats[a]).forEach(dn => {
      const mb = MAPBIOMAS[dn];
      if (!mb) return;

      const row = document.createElement('div');
      row.style.display = 'flex';
      row.style.alignItems = 'center';
      row.style.justifyContent = 'space-between';
      row.style.gap = '8px';
      row.innerHTML = `
        <div style="display:flex;align-items:center;gap:6px;">
          <span style="width:10px;height:10px;background:${mb.color};border-radius:2px;display:inline-block;"></span>
          <span style="font-size:10px;color:#fff;">${mb.name}</span>
        </div>
        <span style="font-size:10px;color:#94a3b8;font-family:'JetBrains Mono',monospace;">${classStats[dn].toFixed(1)} ha</span>
      `;
      body.appendChild(row);
    });
  }

  // =========================================================================
  // 11. ESTATÍSTICAS E GRÁFICOS (CHART.JS)
  // =========================================================================
  function getStatsPerYear() {
    const stats = { 1985: {}, 2012: {}, 2025: {} };
    ['1985', '2012', '2025'].forEach(yr => {
      const data = appState.layerData[`app_${yr}`];
      if (data && data.features) {
        data.features.forEach(f => {
          const dn = Number(f.properties.DN);
          const ha = Number(f.properties.area_ha || 0);
          stats[yr][dn] = (stats[yr][dn] || 0) + ha;
        });
      }
    });
    return stats;
  }

  function renderSummaryStatistics() {
    const stats = getStatsPerYear();
    const tbody = document.getElementById('summaryTableBody');
    tbody.innerHTML = '';

    const allDns = new Set([
      ...Object.keys(stats[1985]),
      ...Object.keys(stats[2012]),
      ...Object.keys(stats[2025])
    ]);

    Array.from(allDns).sort((a, b) => a - b).forEach(dn => {
      const mb = MAPBIOMAS[dn] || { name: 'Classe ' + dn, color: '#999' };
      const a1985 = stats[1985][dn] || 0;
      const a2025 = stats[2025][dn] || 0;
      const diff = a2025 - a1985;
      
      let diffHtml = '';
      if (diff > 0.05) {
        diffHtml = `<span class="var-pos">+${diff.toFixed(2)} ha</span>`;
      } else if (diff < -0.05) {
        diffHtml = `<span class="var-neg">${diff.toFixed(2)} ha</span>`;
      } else {
        diffHtml = `<span class="var-neu">0.00 ha</span>`;
      }

      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>
          <span style="display:inline-block;width:8px;height:8px;background:${mb.color};border-radius:2px;margin-right:4px;"></span>
          ${mb.name}
        </td>
        <td>${a1985.toFixed(2)}</td>
        <td>${a2025.toFixed(2)}</td>
        <td>${diffHtml}</td>
      `;
      tbody.appendChild(tr);
    });
  }

  function initChart() {
    const ctx = document.getElementById('temporalChart').getContext('2d');
    updateChart('bar');
  }

  function updateChart(type) {
    const stats = getStatsPerYear();
    const ctx = document.getElementById('temporalChart').getContext('2d');

    if (appState.chartInstance) {
      appState.chartInstance.destroy();
    }

    if (type === 'bar') {
      // Comparativo de barras entre anos
      const dns = [3, 11, 15, 21, 33, 39]; // Classes principais
      const labels = dns.map(dn => MAPBIOMAS[dn]?.name || dn);

      appState.chartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: labels,
          datasets: [
            {
              label: '1985 (ha)',
              data: dns.map(dn => stats[1985][dn] || 0),
              backgroundColor: '#94a3b8'
            },
            {
              label: '2012 (ha)',
              data: dns.map(dn => stats[2012][dn] || 0),
              backgroundColor: '#38bdf8'
            },
            {
              label: '2025 (ha)',
              data: dns.map(dn => stats[2025][dn] || 0),
              backgroundColor: '#10b981'
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              labels: { color: '#f8fafc', font: { family: 'Inter', size: 10 } }
            }
          },
          scales: {
            x: {
              ticks: { color: '#94a3b8', font: { size: 9 } },
              grid: { color: 'rgba(255,255,255,0.05)' }
            },
            y: {
              ticks: { color: '#94a3b8', font: { size: 9 } },
              grid: { color: 'rgba(255,255,255,0.05)' }
            }
          }
        }
      });
    } else if (type.startsWith('doughnut_')) {
      const year = type.split('_')[1];
      const yrStats = stats[year] || {};
      const sortedDns = Object.keys(yrStats).sort((a, b) => yrStats[b] - yrStats[a]);

      appState.chartInstance = new Chart(ctx, {
        type: 'doughnut',
        data: {
          labels: sortedDns.map(dn => MAPBIOMAS[dn]?.name || dn),
          datasets: [{
            data: sortedDns.map(dn => (yrStats[dn] || 0).toFixed(2)),
            backgroundColor: sortedDns.map(dn => MAPBIOMAS[dn]?.color || '#999'),
            borderColor: '#1e293b',
            borderWidth: 2
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'right',
              labels: { color: '#f8fafc', font: { size: 9 } }
            }
          }
        }
      });
    }
  }

  // =========================================================================
  // 12. CONTROLE DO USO DO SOLO NA BACIA COMPLETA
  // =========================================================================
  function setBaciaActiveYear(year) {
    year = String(year);
    appState.baciaActiveYear = Number(year);

    // Atualiza botões
    document.querySelectorAll('.bacia-year-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.year === year);
    });

    // Atualiza camadas no mapa
    ['1985', '2012', '2025'].forEach(y => {
      const key = `bacia_uso_${y}`;
      const chk = document.getElementById(`chk_${key}`);
      const isTarget = y === year;

      if (chk) chk.checked = isTarget;

      if (appState.layers[key]) {
        if (isTarget) {
          if (!appState.map.hasLayer(appState.layers[key])) {
            appState.layers[key].addTo(appState.map);
          }
        } else {
          if (appState.map.hasLayer(appState.layers[key])) {
            appState.map.removeLayer(appState.layers[key]);
          }
        }
      }
    });

    // Garante que o limite da bacia, APPs e drenagem continuem no topo
    ['bacia', 'delimitacao_app', 'app_1985', 'app_2012', 'app_2025', 'drenagem'].forEach(k => {
      if (appState.layers[k] && appState.map.hasLayer(appState.layers[k])) {
        appState.layers[k].bringToFront();
      }
    });

    showToast(`Uso da terra na bacia integral alterado para: ${year}`, 'info');
  }

  // =========================================================================
  // 12.1 ALTERNÂNCIA DE TEMA (MODO CLARO / ESCURO - DIA & NOITE)
  // =========================================================================
  function initTheme() {
    const savedTheme = localStorage.getItem('geoportal_theme') || 'dark';
    applyTheme(savedTheme);

    const btnToggle = document.getElementById('btnThemeToggle');
    if (btnToggle) {
      btnToggle.addEventListener('click', () => {
        const isCurrentLight = document.body.classList.contains('light-theme');
        const nextTheme = isCurrentLight ? 'dark' : 'light';
        applyTheme(nextTheme);
        localStorage.setItem('geoportal_theme', nextTheme);
        showToast(`Tema alterado para: Modo ${nextTheme === 'light' ? 'Claro (Dia)' : 'Escuro (Noite)'}`, 'info');
      });
    }
  }

  function applyTheme(theme) {
    const isLight = theme === 'light';
    document.body.classList.toggle('light-theme', isLight);

    const themeIcon = document.getElementById('themeToggleIcon');
    if (themeIcon) {
      themeIcon.className = isLight ? 'fa-solid fa-moon' : 'fa-solid fa-sun';
    }

    const themeLabel = document.getElementById('themeLabel');
    if (themeLabel) {
      themeLabel.textContent = isLight ? 'Modo Noturno' : 'Modo Diurno';
    }

    const btnToggle = document.getElementById('btnThemeToggle');
    if (btnToggle) {
      btnToggle.title = isLight ? 'Mudar para Modo Escuro (Noite)' : 'Mudar para Modo Claro (Dia)';
    }

    // Altera logos da UFG e LAPIG para versão com alto contraste
    const ufgHeaderLogo = document.getElementById('ufgHeaderLogo');
    const ufgInfoLogo = document.getElementById('ufgInfoCardLogo');
    const ufgSrc = isLight ? 'assets/ufg_logo.svg' : 'assets/ufg_logo_white.svg';
    if (ufgHeaderLogo) ufgHeaderLogo.src = ufgSrc;
    if (ufgInfoLogo) ufgInfoLogo.src = ufgSrc;

    const lapigHeaderLogo = document.getElementById('lapigHeaderLogo');
    const lapigInfoLogo = document.getElementById('lapigInfoCardLogo');
    const lapigSrc = isLight ? 'assets/lapig_logo_dark.svg' : 'assets/lapig_logo_white.svg';
    if (lapigHeaderLogo) lapigHeaderLogo.src = lapigSrc;
    if (lapigInfoLogo) lapigInfoLogo.src = lapigSrc;
  }

  // =========================================================================
  // 13. TABELA DE ATRIBUTOS
  // =========================================================================
  function populateAttributesTable(layerKey) {
    const data = appState.layerData[layerKey];
    const thead = document.getElementById('attrTableHead');
    const tbody = document.getElementById('attrTableBody');
    const counter = document.getElementById('recCount');

    thead.innerHTML = '';
    tbody.innerHTML = '';

    if (!data || !data.features || data.features.length === 0) {
      counter.textContent = '0';
      return;
    }

    counter.textContent = data.features.length;

    // Colunas e Títulos amigáveis
    let cols = [];
    let colLabels = {};
    if (layerKey.startsWith('app_') || layerKey.startsWith('bacia_uso_')) {
      cols = ['uso_de_cob', 'area_ha', 'area_km2'];
      colLabels = { 'uso_de_cob': 'Uso de cobertura', 'area_ha': 'Área (ha)', 'area_km2': 'Área (km²)' };
    } else if (layerKey === 'delimitacao_app') {
      cols = ['fid', 'classe'];
      colLabels = { 'fid': 'Identificador', 'classe': 'Classificação Legal' };
    } else if (layerKey === 'drenagem') {
      cols = ['NOME', 'EIXOPRINCI', 'REGIME'];
      colLabels = { 'NOME': 'Nome do Curso', 'EIXOPRINCI': 'Eixo Principal', 'REGIME': 'Regime' };
    } else if (layerKey === 'bacia') {
      cols = ['Nome', 'Area_Ha', 'Area_km2'];
      colLabels = { 'Nome': 'Nome da Bacia', 'Area_Ha': 'Área (ha)', 'Area_km2': 'Área (km²)' };
    }

    const trH = document.createElement('tr');
    cols.forEach(c => {
      const th = document.createElement('th');
      th.textContent = colLabels[c] || c;
      trH.appendChild(th);
    });
    thead.appendChild(trH);

    // Registros
    data.features.forEach((f, idx) => {
      const p = f.properties || {};
      const tr = document.createElement('tr');
      tr.dataset.idx = idx;

      cols.forEach(c => {
        const td = document.createElement('td');
        let val = p[c] !== null && p[c] !== undefined ? p[c] : '-';
        if (c === 'area_ha' && (val === '-' || val === undefined)) {
          const km = p.area_km2 || p.area_k2;
          if (km) val = (km * 100).toFixed(2);
        }
        if (c === 'area_km2' && (val === '-' || val === undefined) && p.area_k2) {
          val = Number(p.area_k2).toFixed(2);
        }
        if (c === 'classe' && (val === '-' || val === undefined)) {
          val = 'Área de Preservação Permanente (Lei 12.651/12)';
        }
        if (c === 'fid' && (val === '-' || val === undefined)) {
          val = `APP-${idx + 1}`;
        }
        if (typeof val === 'number') val = val.toFixed(2);
        td.textContent = val;
        tr.appendChild(td);
      });

      // Clique para dar zoom na feição
      tr.addEventListener('click', () => {
        const lyr = appState.layers[layerKey];
        if (lyr) {
          const subLayers = lyr.getLayers();
          if (subLayers[idx]) {
            appState.map.fitBounds(subLayers[idx].getBounds(), { padding: [40, 40] });
            subLayers[idx].openPopup();
          }
        }
      });

      tbody.appendChild(tr);
    });
  }

  // =========================================================================
  // 14. FERRAMENTAS DE MEDIÇÃO (TURF.JS)
  // =========================================================================
  function startMeasurement(mode) {
    clearMeasurement();
    appState.measureMode = mode;
    const hud = document.getElementById('measureHud');
    hud.style.display = 'block';

    const title = document.getElementById('measureHudTitle');
    const instr = document.getElementById('measureHudInstructions');

    if (mode === 'distance') {
      title.innerHTML = '<i class="fa-solid fa-ruler"></i> Medindo Distância';
      instr.textContent = 'Clique para adicionar vértices. Duplo clique finaliza.';
    } else {
      title.innerHTML = '<i class="fa-solid fa-draw-polygon"></i> Medindo Área';
      instr.textContent = 'Clique para delimitar o polígono. Duplo clique finaliza.';
    }
  }

  function onMapClickMeasure(e) {
    if (!appState.measureMode) return;

    appState.measurePoints.push([e.latlng.lat, e.latlng.lng]);
    renderMeasureGraphics();
  }

  function onMapDblClickMeasure(e) {
    if (!appState.measureMode) return;
    e.originalEvent.preventDefault();
    renderMeasureGraphics(true);
    appState.measureMode = null;
    document.getElementById('measureHudInstructions').textContent = 'Medição concluída. Use a lixeira para limpar.';
  }

  function renderMeasureGraphics(finish = false) {
    appState.measureLayer.clearLayers();
    if (appState.measurePoints.length === 0) return;

    // Marcadores dos vértices
    appState.measurePoints.forEach(pt => {
      L.circleMarker(pt, {
        radius: 4,
        color: '#38bdf8',
        fillColor: '#ffffff',
        fillOpacity: 1
      }).addTo(appState.measureLayer);
    });

    const hudVal = document.getElementById('measureHudValue');

    if (appState.measureMode === 'distance' || appState.measurePoints.length < 3) {
      // Linha
      L.polyline(appState.measurePoints, {
        color: '#f59e0b',
        weight: 3,
        dashArray: '5, 5'
      }).addTo(appState.measureLayer);

      // Calcula distância total usando Turf
      if (appState.measurePoints.length >= 2 && window.turf) {
        const line = turf.lineString(appState.measurePoints.map(p => [p[1], p[0]]));
        const lengthKm = turf.length(line, { units: 'kilometers' });
        if (lengthKm < 1) {
          hudVal.textContent = `${(lengthKm * 1000).toFixed(1)} m`;
        } else {
          hudVal.textContent = `${lengthKm.toFixed(3)} km`;
        }
      }
    } else {
      // Polígono
      L.polygon(appState.measurePoints, {
        color: '#10b981',
        weight: 2,
        fillColor: '#10b981',
        fillOpacity: 0.25
      }).addTo(appState.measureLayer);

      if (window.turf && appState.measurePoints.length >= 3) {
        const pts = [...appState.measurePoints, appState.measurePoints[0]];
        const poly = turf.polygon([pts.map(p => [p[1], p[0]])]);
        const areaM2 = turf.area(poly);
        const areaHa = areaM2 / 10000;
        const areaKm2 = areaM2 / 1000000;

        if (areaHa < 1) {
          hudVal.textContent = `${areaM2.toFixed(1)} m²`;
        } else if (areaHa < 100) {
          hudVal.textContent = `${areaHa.toFixed(2)} ha`;
        } else {
          hudVal.textContent = `${areaKm2.toFixed(3)} km² (${areaHa.toFixed(1)} ha)`;
        }
      }
    }
  }

  function clearMeasurement() {
    appState.measureMode = null;
    appState.measurePoints = [];
    if (appState.measureLayer) appState.measureLayer.clearLayers();
    document.getElementById('measureHud').style.display = 'none';
  }

  // =========================================================================
  // 15. COORDENADAS E BARRA DE STATUS (WGS84 & UTM 22S)
  // =========================================================================
  function onMapMouseMove(e) {
    const lat = e.latlng.lat;
    const lon = e.latlng.lng;

    document.getElementById('lblLat').textContent = lat.toFixed(5) + '°';
    document.getElementById('lblLon').textContent = lon.toFixed(5) + '°';

    // Conversão rápida para UTM Fuso 22 Sul (Meridiano Central -51°)
    const utm = latLonToUtm(lat, lon, 22);
    document.getElementById('lblUtmX').textContent = Math.round(utm.x).toLocaleString('pt-BR') + 'm';
    document.getElementById('lblUtmY').textContent = Math.round(utm.y).toLocaleString('pt-BR') + 'm';
  }

  function onMapZoomEnd() {
    document.getElementById('lblZoomLevel').textContent = appState.map.getZoom();
  }

  // Algoritmo clássico de Snyder para conversão Lat/Lon -> UTM
  function latLonToUtm(lat, lon, zone) {
    const a = 6378137.0; // WGS84 / SIRGAS2000
    const f = 1 / 298.257223563;
    const k0 = 0.9996;
    const lon0 = (zone * 6 - 183) * (Math.PI / 180);

    const phi = lat * (Math.PI / 180);
    const lam = lon * (Math.PI / 180);

    const e2 = 2 * f - f * f;
    const ep2 = e2 / (1 - e2);

    const N = a / Math.sqrt(1 - e2 * Math.sin(phi) * Math.sin(phi));
    const T = Math.tan(phi) * Math.tan(phi);
    const C = ep2 * Math.cos(phi) * Math.cos(phi);
    const A = Math.cos(phi) * (lam - lon0);

    const M = a * ((1 - e2 / 4 - 3 * e2 * e2 / 64 - 5 * e2 * e2 * e2 / 256) * phi
      - (3 * e2 / 8 + 3 * e2 * e2 / 32 + 45 * e2 * e2 * e2 / 1024) * Math.sin(2 * phi)
      + (15 * e2 * e2 / 256 + 45 * e2 * e2 * e2 / 1024) * Math.sin(4 * phi)
      - (35 * e2 * e2 * e2 / 3072) * Math.sin(6 * phi));

    const x = k0 * N * (A + (1 - T + C) * Math.pow(A, 3) / 6 + (5 - 18 * T + T * T + 72 * C - 58 * ep2) * Math.pow(A, 5) / 120) + 500000.0;
    let y = k0 * (M + N * Math.tan(phi) * (A * A / 2 + (5 - T + 9 * C + 4 * C * C) * Math.pow(A, 4) / 24 + (61 - 58 * T + T * T + 600 * C - 330 * ep2) * Math.pow(A, 6) / 720));
    if (lat < 0) y += 10000000.0; // Hemisfério Sul

    return { x, y };
  }

  // =========================================================================
  // 16. EXPORTAÇÃO / CAPTURA DE TELA DO MAPA
  // =========================================================================
  function exportMap() {
    showToast('Gerando captura de alta resolução do mapa...', 'info');
    const mapElement = document.getElementById('map');

    if (!window.html2canvas) {
      showToast('Biblioteca html2canvas não disponível.', 'error');
      return;
    }

    html2canvas(mapElement, { useCORS: true, allowTaint: true }).then(canvas => {
      const link = document.createElement('a');
      link.download = `UFG_Geoportal_Ribeirao_Abobora_APP_${appState.activeYear}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
      showToast('Imagem exportada com sucesso!', 'success');
    }).catch(err => {
      console.error(err);
      showToast('Erro ao exportar mapa.', 'error');
    });
  }

  // =========================================================================
  // 17. BUSCA RÁPIDA (RIOS, COORDENADAS OU CLASSES)
  // =========================================================================
  function handleSearch(query) {
    query = query.trim().toLowerCase();
    const dropdown = document.getElementById('searchResults');
    dropdown.innerHTML = '';

    if (!query) {
      dropdown.style.display = 'none';
      return;
    }

    // 1. Verifica se são coordenadas (ex: -17.82, -51.02)
    const coordMatch = query.match(/^(-?\d+(\.\d+)?)[,\s]+(-?\d+(\.\d+)?)$/);
    if (coordMatch) {
      const lat = parseFloat(coordMatch[1]);
      const lon = parseFloat(coordMatch[3]);
      if (lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180) {
        const item = document.createElement('div');
        item.className = 'search-result-item';
        item.innerHTML = `<i class="fa-solid fa-location-dot"></i> Coordenada: Lat ${lat.toFixed(4)}, Lon ${lon.toFixed(4)}`;
        item.onclick = () => {
          appState.map.setView([lat, lon], 15);
          L.popup().setLatLng([lat, lon]).setContent(`<b>Coordenada Localizada</b><br>Lat: ${lat}<br>Lon: ${lon}`).openOn(appState.map);
          dropdown.style.display = 'none';
        };
        dropdown.appendChild(item);
        dropdown.style.display = 'block';
        return;
      }
    }

    // 2. Busca cursos d'água na camada de drenagem
    const drenagemData = appState.layerData.drenagem;
    if (drenagemData && drenagemData.features) {
      const matchedRivers = [];
      drenagemData.features.forEach((f, idx) => {
        const nome = f.properties && f.properties.NOME;
        if (nome && nome.toLowerCase().includes(query) && !matchedRivers.some(r => r.nome === nome)) {
          matchedRivers.push({ nome, idx });
        }
      });

      matchedRivers.slice(0, 5).forEach(r => {
        const item = document.createElement('div');
        item.className = 'search-result-item';
        item.innerHTML = `<i class="fa-solid fa-water"></i> ${r.nome}`;
        item.onclick = () => {
          const lyr = appState.layers.drenagem.getLayers()[r.idx];
          if (lyr) {
            appState.map.fitBounds(lyr.getBounds(), { padding: [50, 50] });
            lyr.openPopup();
          }
          dropdown.style.display = 'none';
        };
        dropdown.appendChild(item);
      });
    }

    // 3. Busca classes de uso de cobertura
    Object.keys(MAPBIOMAS).forEach(dn => {
      const mb = MAPBIOMAS[dn];
      if (mb.name.toLowerCase().includes(query)) {
        const item = document.createElement('div');
        item.className = 'search-result-item';
        item.innerHTML = `<i class="fa-solid fa-seedling" style="color:${mb.color}"></i> Classe: ${mb.name}`;
        item.onclick = () => {
          toggleFilterClass(Number(dn));
          dropdown.style.display = 'none';
        };
        dropdown.appendChild(item);
      }
    });

    dropdown.style.display = dropdown.children.length > 0 ? 'block' : 'none';
  }

  // =========================================================================
  // 18. NOTIFICAÇÕES TOAST
  // =========================================================================
  function showToast(msg, type = 'info') {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    let icon = 'fa-circle-info';
    if (type === 'success') icon = 'fa-circle-check';
    if (type === 'error') icon = 'fa-triangle-exclamation';

    toast.innerHTML = `<i class="fa-solid ${icon}"></i> <span>${msg}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(100%)';
      setTimeout(() => toast.remove(), 300);
    }, 3200);
  }

  // =========================================================================
  // 19. ATRIBUIÇÃO DE LISTENERS & INTERAÇÃO DOM
  // =========================================================================
  function setupEventListeners() {
    // Alternância de Abas na Sidebar
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));

        btn.classList.add('active');
        const tabId = btn.dataset.tab;
        const targetPane = document.getElementById(tabId);
        if (targetPane) targetPane.classList.add('active');

        // Se abriu a aba do mapa de fundo ou gráficos, redimensiona
        if (tabId === 'tab-stats' && appState.chartInstance) {
          appState.chartInstance.resize();
        }
      });
    });

    // Recolher / Expandir Sidebar
    const toggleBtn = document.getElementById('sidebarToggleBtn');
    const sidebar = document.getElementById('appSidebar');
    toggleBtn.addEventListener('click', () => {
      sidebar.classList.toggle('collapsed');
      setTimeout(() => appState.map.invalidateSize(), 320);
    });

    // Seletor de Basemaps
    document.querySelectorAll('.basemap-card').forEach(card => {
      card.addEventListener('click', () => {
        switchBasemap(card.dataset.basemap);
      });
    });

    // Botões de Ano Rápido
    document.querySelectorAll('.year-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        setActiveYear(btn.dataset.year);
      });
    });

    // Play Timeline
    document.getElementById('btnPlayTimeline').addEventListener('click', toggleTimelinePlay);

    // Zoom Extensão Bacia
    document.getElementById('btnZoomBacia').addEventListener('click', zoomToBacia);
    document.getElementById('btnResetView').addEventListener('click', zoomToBacia);

    // Zoom In / Out
    document.getElementById('btnZoomIn').addEventListener('click', () => appState.map.zoomIn());
    document.getElementById('btnZoomOut').addEventListener('click', () => appState.map.zoomOut());

    // Checkboxes das Camadas (APPs, Bacia Completa, Drenagem e Limites)
    [
      'app_1985', 'app_2012', 'app_2025', 
      'delimitacao_app', 'drenagem', 'bacia', 
      'bacia_uso_1985', 'bacia_uso_2012', 'bacia_uso_2025'
    ].forEach(key => {
      const chk = document.getElementById(`chk_${key}`);
      if (chk) {
        chk.addEventListener('change', e => {
          if (appState.layers[key]) {
            if (e.target.checked) {
              appState.layers[key].addTo(appState.map);
              // Mantém elementos estruturais sobrepostos
              if (appState.layers.bacia && appState.map.hasLayer(appState.layers.bacia)) appState.layers.bacia.bringToFront();
              if (appState.layers.delimitacao_app && appState.map.hasLayer(appState.layers.delimitacao_app)) appState.layers.delimitacao_app.bringToFront();
              if (appState.layers.drenagem && appState.map.hasLayer(appState.layers.drenagem)) appState.layers.drenagem.bringToFront();
            } else {
              appState.map.removeLayer(appState.layers[key]);
            }
          }
        });
      }
    });

    // Botões de Ano Rápido na Bacia Completa
    document.querySelectorAll('.bacia-year-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        setBaciaActiveYear(btn.dataset.year);
      });
    });

    // Sliders de Opacidade Individuais
    [
      { slider: 'slider_op_2025', lbl: 'lbl_op_2025', layer: 'app_2025' },
      { slider: 'slider_op_2012', lbl: 'lbl_op_2012', layer: 'app_2012' },
      { slider: 'slider_op_1985', lbl: 'lbl_op_1985', layer: 'app_1985' },
      { slider: 'slider_op_delimitacao_app', lbl: 'lbl_op_delimitacao_app', layer: 'delimitacao_app' },
      { slider: 'slider_op_drenagem', lbl: 'lbl_op_drenagem', layer: 'drenagem' },
      { slider: 'slider_op_bacia', lbl: 'lbl_op_bacia', layer: 'bacia' },
      { slider: 'slider_op_bacia_uso_2025', lbl: 'lbl_op_bacia_uso_2025', layer: 'bacia_uso_2025' },
      { slider: 'slider_op_bacia_uso_2012', lbl: 'lbl_op_bacia_uso_2012', layer: 'bacia_uso_2012' },
      { slider: 'slider_op_bacia_uso_1985', lbl: 'lbl_op_bacia_uso_1985', layer: 'bacia_uso_1985' }
    ].forEach(item => {
      const slider = document.getElementById(item.slider);
      const lbl = document.getElementById(item.lbl);
      if (slider) {
        slider.addEventListener('input', e => {
          const val = Number(e.target.value);
          if (lbl) lbl.textContent = `${val}%`;
          const op = val / 100;
          if (appState.layers[item.layer]) {
            if (item.layer === 'drenagem') {
              appState.layers[item.layer].setStyle({ opacity: op });
            } else if (item.layer === 'delimitacao_app') {
              appState.layers[item.layer].setStyle({ opacity: op });
            } else if (item.layer === 'bacia') {
              appState.layers[item.layer].setStyle({ opacity: op, fillOpacity: op * 0.05 });
            } else {
              appState.layers[item.layer].setStyle({ fillOpacity: op, opacity: Math.min(1, op + 0.1) });
            }
          }
        });
      }
    });

    // Zoom para camadas individuais
    document.querySelectorAll('.btn-layer-zoom').forEach(btn => {
      btn.addEventListener('click', () => {
        const target = btn.dataset.target;
        if (appState.layers[target]) {
          appState.map.fitBounds(appState.layers[target].getBounds(), { padding: [30, 30] });
        }
      });
    });

    // Medição Geodésica
    document.getElementById('btnMeasureDist').addEventListener('click', () => startMeasurement('distance'));
    document.getElementById('btnMeasureArea').addEventListener('click', () => startMeasurement('area'));
    document.getElementById('btnClearDraw').addEventListener('click', clearMeasurement);
    document.getElementById('btnCloseMeasureHud').addEventListener('click', clearMeasurement);
    document.getElementById('btnToggleMeasure').addEventListener('click', () => startMeasurement('distance'));

    // Exportar Mapa
    document.getElementById('btnExportMap').addEventListener('click', exportMap);

    // Fullscreen
    document.getElementById('btnFullscreen').addEventListener('click', () => {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen();
      } else {
        document.exitFullscreen();
      }
    });

    // Modal Ajuda
    const helpModal = document.getElementById('helpModal');
    document.getElementById('btnHelp').addEventListener('click', () => helpModal.style.display = 'flex');
    document.getElementById('btnCloseHelpModal').addEventListener('click', () => helpModal.style.display = 'none');
    document.getElementById('btnOkHelpModal').addEventListener('click', () => helpModal.style.display = 'none');

    // Mini-legenda Toggle
    document.getElementById('quickLegHeader').addEventListener('click', () => {
      document.getElementById('mapQuickLegend').classList.toggle('collapsed');
    });

    // Limpar Filtro de Cobertura
    const btnClearLeg = document.getElementById('btnClearLegendFilter');
    if (btnClearLeg) {
      btnClearLeg.addEventListener('click', clearLegendFilter);
    }

    // Seletor de Tipo de Gráfico
    document.getElementById('chartTypeSelect').addEventListener('change', e => {
      updateChart(e.target.value);
    });

    // Tabela de Atributos - Troca de Camada
    document.getElementById('tableLayerSelect').addEventListener('change', e => {
      populateAttributesTable(e.target.value);
    });

    // Tabela de Atributos - Filtro de Texto
    document.getElementById('tableFilterInput').addEventListener('input', e => {
      const term = e.target.value.toLowerCase();
      document.querySelectorAll('#attrTableBody tr').forEach(row => {
        row.style.display = row.textContent.toLowerCase().includes(term) ? '' : 'none';
      });
    });

    // Busca no Topo
    const sInput = document.getElementById('searchInput');
    const sClear = document.getElementById('clearSearchBtn');
    sInput.addEventListener('input', e => {
      const v = e.target.value;
      sClear.style.display = v ? 'block' : 'none';
      handleSearch(v);
    });
    sClear.addEventListener('click', () => {
      sInput.value = '';
      sClear.style.display = 'none';
      document.getElementById('searchResults').style.display = 'none';
    });
  }

  // =========================================================================
  // 20. INICIALIZAÇÃO GERAL
  // =========================================================================
  window.addEventListener('DOMContentLoaded', () => {
    initTheme();
    initMap();
    setupEventListeners();
    loadAllLayers();
  });

})();
