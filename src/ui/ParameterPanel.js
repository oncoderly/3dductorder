// ParameterPanel - Mobil-uyumlu standart parametre paneli
import { BasePart } from '../components/BasePart.js';

const GALV_THICKNESS_MM = BasePart.getGalvanizedThicknessListMm();
export class ParameterPanel {
  constructor(container, part, onUpdate, scene = null) {
    this.container = container;
    this.part = part;
    this.onUpdateCallback = onUpdate;
    this.onUpdate = (...args) => {
      if (this.onUpdateCallback) this.onUpdateCallback(...args);
      this.updateSheetScaleDisplay();
    };
    this.scene = scene; // Scene3D instance for scene controls
    this.controls = {};
    this.sheetScaleElements = null;
    this.activeTab = localStorage.getItem('activeTab') || 'boyut'; // Varsayılan sekme
    this.useTabNavigation = localStorage.getItem('useTabNavigation') === 'true';
  }

  render() {
    this.container.innerHTML = '';
    const definitions = this.part.getParameterDefinitions();

    // Tab navigasyonu aktifse tab layout kullan
    if (this.useTabNavigation) {
      this.renderTabLayout(definitions);
    } else {
      this.renderAccordionLayout(definitions);
    }

    this.updateSheetScaleDisplay();
  }

  // Tab-based layout (Alternative Design-2 tarzı)
  renderTabLayout(definitions) {
    // Tab navigation bar
    const tabNav = document.createElement('div');
    tabNav.className = 'tab-navigation';

    const tabs = [
      { id: 'boyut', icon: '📏', label: 'Boyut' },
      { id: 'gorunum', icon: '👁️', label: 'Görünüm' },
      { id: 'sahne', icon: '🌐', label: 'Sahne' },
      { id: 'diger', icon: '📦', label: 'Diğer' }
    ];

    tabs.forEach(tab => {
      const tabBtn = document.createElement('button');
      tabBtn.className = `tab-btn ${this.activeTab === tab.id ? 'active' : ''}`;
      tabBtn.dataset.tab = tab.id;
      tabBtn.innerHTML = `
        <span class="tab-icon">${tab.icon}</span>
        <span class="tab-label">${tab.label}</span>
      `;
      tabBtn.addEventListener('click', () => this.switchTab(tab.id));
      tabNav.appendChild(tabBtn);
    });

    this.container.appendChild(tabNav);

    // Tab içerik container
    const tabContent = document.createElement('div');
    tabContent.className = 'tab-content';
    this.container.appendChild(tabContent);

    // Aktif sekme içeriğini render et
    this.renderTabContent(tabContent, definitions);
  }

  switchTab(tabId) {
    this.activeTab = tabId;
    localStorage.setItem('activeTab', tabId);

    // Tab butonlarını güncelle
    const tabBtns = this.container.querySelectorAll('.tab-btn');
    tabBtns.forEach(btn => {
      btn.classList.toggle('active', btn.dataset.tab === tabId);
    });

    // Tab içeriğini güncelle
    const tabContent = this.container.querySelector('.tab-content');
    if (tabContent) {
      const definitions = this.part.getParameterDefinitions();
      this.renderTabContent(tabContent, definitions);
    }
  }

  renderTabContent(container, definitions) {
    container.innerHTML = '';

    switch (this.activeTab) {
      case 'sahne':
        this.renderSahneTabContent(container);
        break;
      case 'boyut':
        this.renderBoyutTabContent(container, definitions);
        break;
      case 'gorunum':
        this.renderGorunumTabContent(container);
        break;
      case 'diger':
        this.renderDigerTabContent(container, definitions);
        break;
    }
  }

  renderSahneTabContent(container) {
    const content = document.createElement('div');
    content.className = 'tab-panel-content';

    // Sahne ayarları
    if (this.scene) {
      const sceneParams = this.scene.getSceneParameterDefinitions();

      sceneParams.forEach(param => {
        let control;
        if (param.type === 'checkbox') {
          control = this.createSceneCheckboxControl(param.key, param.label);
        } else if (param.type === 'color') {
          control = this.createSceneColorControl(param.key, param.label);
        }
        if (control) {
          content.appendChild(control);
        }
      });
    }

    // Tema seçimi
    const themeControl = this.createThemeToggleControl();
    content.appendChild(themeControl);

    // Tab/Accordion modu seçimi
    const layoutControl = this.createLayoutToggleControl();
    content.appendChild(layoutControl);

    container.appendChild(content);
  }

  renderBoyutTabContent(container, definitions) {
    const content = document.createElement('div');
    content.className = 'tab-panel-content';

    // Gruplar
    if (definitions.groups && definitions.groups.length > 0) {
      definitions.groups.forEach(group => {
        const groupDiv = document.createElement('div');
        groupDiv.className = 'tab-group';

        const groupTitle = document.createElement('div');
        groupTitle.className = 'tab-group-title';
        groupTitle.textContent = group.name;
        groupDiv.appendChild(groupTitle);

        group.params.forEach(param => {
          let control;
          if (!param.type || param.type === 'number') {
            control = this.createNumberControl(param);
          } else if (param.type === 'checkbox') {
            control = this.createCheckboxControl(param.key, param.label);
          } else if (param.type === 'color') {
            control = this.createColorControl(param);
          } else if (param.type === 'select') {
            control = this.createSelectControl(param);
          }
          if (control) {
            groupDiv.appendChild(control);
            this.controls[param.key] = control;
          }
        });

        content.appendChild(groupDiv);
      });
    }

    // Boyutlar
    if (definitions.dimensions && definitions.dimensions.length > 0) {
      const dimDiv = document.createElement('div');
      dimDiv.className = 'tab-group';

      const dimTitle = document.createElement('div');
      dimTitle.className = 'tab-group-title';
      dimTitle.textContent = 'Boyutlar';
      dimDiv.appendChild(dimTitle);

      definitions.dimensions.forEach(param => {
        const control = this.createNumberControl(param);
        dimDiv.appendChild(control);
        this.controls[param.key] = control;
      });

      content.appendChild(dimDiv);
    }

    // Yüzler (Plenum Box için)
    if (definitions.faces && definitions.faces.length > 0) {
      this.renderFacesSectionInTab(content, definitions.faces);
    }

    // Sac Kalınlığı Skalası
    this.renderSheetScaleSectionInTab(content);

    container.appendChild(content);
  }

  renderGorunumTabContent(container) {
    const content = document.createElement('div');
    content.className = 'tab-panel-content';

    // Görünüm checkboxları
    const checkboxes = [
      { key: 'showEdges', label: 'Kenar Çizgileri' },
      { key: 'showDims', label: 'Ölçülendirme' },
      { key: 'showFlange', label: 'Flanşları Göster' },
      { key: 'keepViewOnEdit', label: 'Görüşü Koru' }
    ];

    checkboxes.forEach(cb => {
      const control = this.createCheckboxControl(cb.key, cb.label);
      content.appendChild(control);
    });

    container.appendChild(content);
  }

  renderDigerTabContent(container, definitions) {
    const content = document.createElement('div');
    content.className = 'tab-panel-content';

    // Flanş Ayarları
    const flangeDiv = document.createElement('div');
    flangeDiv.className = 'tab-group';

    const flangeTitle = document.createElement('div');
    flangeTitle.className = 'tab-group-title';
    flangeTitle.textContent = '🔧 Flanş Ayarları';
    flangeDiv.appendChild(flangeTitle);

    const flangeParams = [
      { key: 'flangeLip', label: 'Flanş Payı', min: 1, max: 8, step: 1, unit: 'cm' },
      { key: 'flangeThick', label: 'Flanş Kalınlığı', min: 0.2, max: 2, step: 0.05, unit: 'cm' }
    ];

    flangeParams.forEach(param => {
      const control = this.createSliderControl(param);
      flangeDiv.appendChild(control);
    });

    content.appendChild(flangeDiv);

    // Malzeme Özellikleri
    const materialDiv = document.createElement('div');
    materialDiv.className = 'tab-group';

    const materialTitle = document.createElement('div');
    materialTitle.className = 'tab-group-title';
    materialTitle.textContent = '✨ Malzeme Özellikleri';
    materialDiv.appendChild(materialTitle);

    const materialParams = [
      { key: 'metalRough', label: 'Pürüzlülük', min: 0, max: 1, step: 0.01 },
      { key: 'metalness', label: 'Metallik', min: 0, max: 1, step: 0.01 }
    ];

    materialParams.forEach(param => {
      const control = this.createSliderControl(param);
      materialDiv.appendChild(control);
    });

    content.appendChild(materialDiv);

    // Renkler
    if (definitions.colors && definitions.colors.length > 0) {
      const colorDiv = document.createElement('div');
      colorDiv.className = 'tab-group';

      const colorTitle = document.createElement('div');
      colorTitle.className = 'tab-group-title';
      colorTitle.textContent = '🎨 Renkler';
      colorDiv.appendChild(colorTitle);

      definitions.colors.forEach(color => {
        const control = this.createColorControl(color);
        colorDiv.appendChild(control);
      });

      content.appendChild(colorDiv);
    }

    // Alan Hesabı
    const areaDiv = document.createElement('div');
    areaDiv.className = 'tab-group';

    const areaTitle = document.createElement('div');
    areaTitle.className = 'tab-group-title';
    areaTitle.textContent = '📊 Alan Hesabı';
    areaDiv.appendChild(areaTitle);

    const areaParams = [
      { key: 'wastePercent', label: 'Atık Oranı (%)', min: 0, max: 100, step: 1 },
      { key: 'kFactor', label: 'K Faktörü', min: 0, max: 2, step: 0.01 }
    ];

    areaParams.forEach(param => {
      const control = this.createSliderControl(param);
      areaDiv.appendChild(control);
    });

    const areaInclude = this.createCheckboxControl('areaIncludeFlange', 'Flanşı Dahil Et');
    areaDiv.appendChild(areaInclude);

    const areaDisplay = document.createElement('div');
    areaDisplay.className = 'area-display';
    areaDisplay.id = 'area-display';
    areaDisplay.textContent = 'Alan hesaplanıyor...';
    areaDiv.appendChild(areaDisplay);
    this.part.areaDisplayElement = areaDisplay;

    content.appendChild(areaDiv);

    container.appendChild(content);
  }

  renderFacesSectionInTab(container, faces) {
    const facesDiv = document.createElement('div');
    facesDiv.className = 'tab-group manson-management-section';

    const facesTitle = document.createElement('div');
    facesTitle.className = 'tab-group-title';
    facesTitle.textContent = '🔘 Manşon Yönetimi';
    facesDiv.appendChild(facesTitle);

    faces.forEach(face => {
      const faceRow = document.createElement('div');
      faceRow.className = 'manson-face-row';
      faceRow.dataset.faceKey = face.key;

      const faceHeader = document.createElement('div');
      faceHeader.className = 'manson-face-header';

      const faceLabel = document.createElement('span');
      faceLabel.className = 'manson-face-label';
      faceLabel.textContent = face.label;

      const countWrapper = document.createElement('div');
      countWrapper.className = 'manson-count-wrapper';

      const decrementBtn = document.createElement('button');
      decrementBtn.type = 'button';
      decrementBtn.className = 'manson-count-btn decrement';
      decrementBtn.textContent = '−';

      const countInput = document.createElement('input');
      countInput.type = 'number';
      countInput.className = 'manson-count-input';
      countInput.min = 0;
      countInput.max = 20;
      countInput.step = 1;
      countInput.value = this.part.params.faces[face.key].count || 0;

      const incrementBtn = document.createElement('button');
      incrementBtn.type = 'button';
      incrementBtn.className = 'manson-count-btn increment';
      incrementBtn.textContent = '+';

      const updateCount = (newCount) => {
        const count = Math.max(0, Math.min(20, newCount));
        countInput.value = count;
        this.part.ensureFacePorts(face.key, count);
        this.renderMansonPortsInputs(face.key, faceRow);
        this.onUpdate();
      };

      decrementBtn.addEventListener('click', () => {
        updateCount((parseInt(countInput.value) || 0) - 1);
      });

      incrementBtn.addEventListener('click', () => {
        updateCount((parseInt(countInput.value) || 0) + 1);
      });

      countInput.addEventListener('input', (e) => {
        updateCount(parseInt(e.target.value) || 0);
      });

      countWrapper.appendChild(decrementBtn);
      countWrapper.appendChild(countInput);
      countWrapper.appendChild(incrementBtn);

      faceHeader.appendChild(faceLabel);
      faceHeader.appendChild(countWrapper);
      faceRow.appendChild(faceHeader);

      const portsContainer = document.createElement('div');
      portsContainer.className = 'manson-ports-container';
      portsContainer.dataset.faceKey = face.key;
      faceRow.appendChild(portsContainer);

      facesDiv.appendChild(faceRow);

      this.renderMansonPortsInputs(face.key, faceRow);
    });

    container.appendChild(facesDiv);
  }

  renderSheetScaleSectionInTab(container) {
    if (!this.part || !this.part.getSheetScaleState || this.part.params.t === undefined) return;

    const formatLabel = (value) => {
      if (!Number.isFinite(value)) return '-';
      const rounded = Math.round(value * 100) / 100;
      const text = rounded.toFixed(2)
        .replace(/\.0+$/, '')
        .replace(/(\.\d*[1-9])0+$/, '$1');
      return text.replace('.', ',');
    };

    const scaleDiv = document.createElement('div');
    scaleDiv.className = 'tab-group sheet-scale-section';

    const scaleTitle = document.createElement('div');
    scaleTitle.className = 'tab-group-title';
    scaleTitle.textContent = 'Sac Kalınlığı Skalası';
    scaleDiv.appendChild(scaleTitle);

    const summary = document.createElement('div');
    summary.className = 'sheet-scale-summary';
    scaleDiv.appendChild(summary);

    const table = document.createElement('div');
    table.className = 'sheet-scale-table';
    scaleDiv.appendChild(table);

    const enableControl = this.createCheckboxControl('sheetScaleEnabled', 'Skala ile seç');
    scaleDiv.appendChild(enableControl);
    this.controls.sheetScaleEnabled = enableControl;

    const entries = [];
    GALV_THICKNESS_MM.forEach((thicknessMm) => {
      const entry = document.createElement('div');
      entry.className = 'sheet-scale-entry';

      const title = document.createElement('div');
      title.className = 'sheet-scale-entry-title';
      title.textContent = `${formatLabel(thicknessMm)} mm`;
      entry.appendChild(title);

      const enabledKey = BasePart.getSheetScaleEnabledKey(thicknessMm);
      const maxKey = BasePart.getSheetScaleMaxKey(thicknessMm);

      const entryControls = document.createElement('div');
      entryControls.className = 'sheet-scale-entry-controls';

      const includeControl = this.createCheckboxControl(enabledKey, 'Dahil');
      entryControls.appendChild(includeControl);
      this.controls[enabledKey] = includeControl;

      const limitControl = this.createNumberControl({
        key: maxKey,
        label: 'Bitiş (mm)',
        min: 1,
        max: 5000,
        step: 1,
        unit: 'mm',
        nudgeStep: 50
      });
      entryControls.appendChild(limitControl);
      this.controls[maxKey] = limitControl;

      entry.appendChild(entryControls);
      scaleDiv.appendChild(entry);

      entries.push({ thicknessMm, enabledKey, maxKey });
    });

    this.sheetScaleElements = { summary, table, section: scaleDiv, entries };

    container.appendChild(scaleDiv);
  }

  createLayoutToggleControl() {
    const wrapper = document.createElement('div');
    wrapper.className = 'param-checkbox-control';

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.className = 'param-checkbox';
    checkbox.id = 'layout-toggle';
    checkbox.checked = this.useTabNavigation;

    checkbox.addEventListener('change', (e) => {
      this.useTabNavigation = e.target.checked;
      localStorage.setItem('useTabNavigation', e.target.checked.toString());
      this.render(); // Yeniden render et
    });

    const labelEl = document.createElement('label');
    labelEl.className = 'param-checkbox-label';
    labelEl.htmlFor = 'layout-toggle';
    labelEl.textContent = 'Sekme Navigasyonu';

    wrapper.appendChild(checkbox);
    wrapper.appendChild(labelEl);

    return wrapper;
  }

  // Accordion-based layout (mevcut yapı)
  renderAccordionLayout(definitions) {
    // Yeni groups yapısını destekle
    if (definitions.groups && definitions.groups.length > 0) {
      definitions.groups.forEach(group => {
        this.renderGroupSection(group);
      });
    }

    // Eski yapı (geriye uyumluluk)
    // Boyutlar bölümü
    if (definitions.dimensions && definitions.dimensions.length > 0) {
      this.renderSection('📏 Boyutlar', definitions.dimensions, 'dimensions');
    }

    // Yüzler bölümü (Plenum Box için)
    if (definitions.faces && definitions.faces.length > 0) {
      this.renderFacesSection(definitions.faces);
    }
    this.renderSheetScaleSection();

    // Görünüm bölümü
    this.renderViewSection();

    // Flanş bölümü
    this.renderFlangeSection();

    // Malzeme bölümü
    this.renderMaterialSection();

    // Renkler bölümü
    if (definitions.colors && definitions.colors.length > 0) {
      this.renderColorSection(definitions.colors);
    }

    // Alan hesabı bölümü
    this.renderAreaSection();

    // SAHNE KONTROLLERI (en altta, varsayılan kapalı)
    if (this.scene) {
      this.renderSceneControlsSection();
    }
  }

  renderGroupSection(group) {
    const section = document.createElement('div');
    section.className = 'param-section';

    const header = document.createElement('h3');
    header.className = 'param-section-title';
    header.textContent = group.name;

    // Accordion click handler
    header.addEventListener('click', () => {
      section.classList.toggle('collapsed');
    });

    section.appendChild(header);

    const content = document.createElement('div');
    content.className = 'param-section-content';

    const grid = document.createElement('div');
    grid.className = 'param-grid';

    group.params.forEach(param => {
      let control;

      if (!param.type || param.type === 'number') {
        control = this.createNumberControl(param);
      } else if (param.type === 'checkbox') {
        control = this.createCheckboxControl(param.key, param.label);
      } else if (param.type === 'color') {
        control = this.createColorControl(param);
      } else if (param.type === 'select') {
        control = this.createSelectControl(param);
      }

      if (control) {
        grid.appendChild(control);
        this.controls[param.key] = control;
      }
    });

    content.appendChild(grid);
    section.appendChild(content);
    this.container.appendChild(section);
  }

  createSelectControl(param) {
    const wrapper = document.createElement('div');
    wrapper.className = 'param-control';

    const label = document.createElement('label');
    label.className = 'param-label';
    label.textContent = param.label;

    const select = document.createElement('select');
    select.className = 'param-select';

    param.options.forEach(option => {
      const opt = document.createElement('option');
      opt.value = option.value;
      opt.textContent = option.label;
      if (this.part.params[param.key] === option.value) {
        opt.selected = true;
      }
      select.appendChild(opt);
    });

    select.addEventListener('change', (e) => {
      this.part.params[param.key] = e.target.value;
      this.onUpdate();
    });

    wrapper.appendChild(label);
    wrapper.appendChild(select);

    return wrapper;
  }

  renderSection(title, parameters, groupKey) {
    const section = document.createElement('div');
    section.className = 'param-section';

    const header = document.createElement('h3');
    header.className = 'param-section-title';
    header.textContent = title;

    // Accordion click handler
    header.addEventListener('click', () => {
      section.classList.toggle('collapsed');
    });

    section.appendChild(header);

    const content = document.createElement('div');
    content.className = 'param-section-content';

    const grid = document.createElement('div');
    grid.className = 'param-grid';

    parameters.forEach(param => {
      const control = this.createNumberControl(param);
      grid.appendChild(control);
      this.controls[param.key] = control;
    });

    content.appendChild(grid);
    section.appendChild(content);
    this.container.appendChild(section);
  }

  createNumberControl(param) {
    const wrapper = document.createElement('div');
    wrapper.className = 'param-control';

    const label = document.createElement('label');
    label.className = 'param-label';
    label.textContent = param.label;

    const inputWrapper = document.createElement('div');
    inputWrapper.className = 'param-number-row';

    const isThickness = param.key === 't';
    const toUiValue = (value) => (isThickness ? value * 10 : value);
    const fromUiValue = (value) => (isThickness ? value / 10 : value);

    const currentValue = toUiValue(this.part.params[param.key]);
    const allowedValuesRaw = Array.isArray(param.allowedValues) && param.allowedValues.length
      ? param.allowedValues
      : null;
    const allowedValues = allowedValuesRaw
      ? (isThickness ? allowedValuesRaw.map(value => value * 10) : allowedValuesRaw)
      : null;

    const getListDecimals = (list) => {
      let maxDecimals = 0;
      list.forEach((value) => {
        const text = value.toString();
        const dotIndex = text.indexOf('.');
        if (dotIndex === -1) return;
        maxDecimals = Math.max(maxDecimals, text.length - dotIndex - 1);
      });
      return Math.min(maxDecimals, 4);
    };

    const getListStep = (list) => {
      if (!list || list.length < 2) return 1;
      let minStep = Number.POSITIVE_INFINITY;
      for (let i = 1; i < list.length; i++) {
        const step = Math.abs(list[i] - list[i - 1]);
        if (step > 0 && step < minStep) minStep = step;
      }
      return Number.isFinite(minStep) ? minStep : 1;
    };

    const min = allowedValues ? allowedValues[0] : (isThickness ? (param.min ?? 0) * 10 : (param.min ?? 0));
    const max = allowedValues ? allowedValues[allowedValues.length - 1] : (isThickness ? (param.max ?? 1) * 10 : (param.max ?? 1));
    const step = allowedValues ? getListStep(allowedValues) : (isThickness ? 0.1 : (param.step || 1));
    const range = Math.max(1, (max || 1) - (min || 0));
    const nudgeStep = isThickness ? 0.1 : (param.nudgeStep ?? param.nudge ?? (range >= 50 ? 5 : step * 5));
    const decimals = allowedValues
      ? getListDecimals(allowedValues)
      : (() => {
        const stepValue = isThickness ? step : param.step;
        if (!stepValue || Number.isInteger(stepValue)) return 0;
        const [, fraction] = stepValue.toString().split('.');
        return Math.min((fraction ? fraction.length : 2), 4);
      })();
    const formatNumber = (value, places) => {
      if (!Number.isFinite(value)) return '';
      if (places <= 0) return Math.round(value).toString();
      const text = value.toFixed(places);
      return text.replace(/\.0+$/, '').replace(/(\.\d*[1-9])0+$/, '$1');
    };

    const slider = document.createElement('input');
    slider.type = 'range';
    slider.className = 'param-number-slider';
    slider.min = min;
    slider.max = max;
    slider.step = step;
    slider.value = currentValue;

    const decBtn = document.createElement('button');
    decBtn.type = 'button';
    decBtn.className = 'param-step-btn decrement';
    decBtn.textContent = `-${nudgeStep}`;

    const input = document.createElement('input');
    input.type = 'number';
    input.className = 'param-input';
    input.classList.add('param-number-input');
    input.min = min;
    input.max = max;
    input.step = step;
    input.value = currentValue;

    const unit = document.createElement('span');
    unit.className = 'param-unit';
    unit.textContent = isThickness ? 'mm' : param.unit;

    const incBtn = document.createElement('button');
    incBtn.type = 'button';
    incBtn.className = 'param-step-btn increment';
    incBtn.textContent = `+${nudgeStep}`;

    const updateSliderFill = (value) => {
      const min = parseFloat(slider.min);
      const max = parseFloat(slider.max);
      const span = (max - min) || 1;
      const pct = ((value - min) / span) * 100;
      slider.style.background = `linear-gradient(90deg, #4c8dff ${pct}%, #2a3242 ${pct}%)`;
    };

    const clampAndSnap = (raw) => {
      const minValue = Number.isFinite(min) ? min : Number.NEGATIVE_INFINITY;
      const maxValue = Number.isFinite(max) ? max : Number.POSITIVE_INFINITY;
      let value = parseFloat(raw);
      if (Number.isNaN(value)) value = param.default ?? minValue ?? 0;
      value = Math.min(maxValue, Math.max(minValue, value));
      if (allowedValues && allowedValues.length) {
        const snapped = BasePart.snapToClosest(value, allowedValues);
        return Math.min(maxValue, Math.max(minValue, snapped));
      }
      const stepValue = step || 1;
      const snapped = Math.round((value - minValue) / stepValue) * stepValue + minValue;
      const fixed = decimals > 0 ? parseFloat(snapped.toFixed(decimals)) : Math.round(snapped);
      return Math.min(maxValue, Math.max(minValue, fixed));
    };

    const setValue = (val, triggerUpdate = true) => {
      const value = clampAndSnap(val);
      this.part.params[param.key] = fromUiValue(value);
      input.value = formatNumber(value, decimals);
      slider.value = value;
      updateSliderFill(value);
      if (triggerUpdate) this.onUpdate();
    };

    slider.addEventListener('input', (e) => {
      setValue(e.target.value);
    });

    // Select all text on focus so user can immediately type a new value
    input.addEventListener('focus', () => {
      input.select();
    });

    // Only validate on blur/change, not on every keystroke
    input.addEventListener('change', (e) => {
      setValue(e.target.value);
    });

    // Also validate on blur in case user clicks away without pressing Enter
    input.addEventListener('blur', (e) => {
      setValue(e.target.value);
    });

    decBtn.addEventListener('click', () => {
      if (allowedValues && allowedValues.length) {
        const current = clampAndSnap(toUiValue(this.part.params[param.key]));
        const index = allowedValues.findIndex(value => Math.abs(value - current) < 1e-6);
        const nextIndex = index > 0 ? index - 1 : 0;
        setValue(allowedValues[nextIndex]);
        return;
      }
      const current = toUiValue(this.part.params[param.key]);
      setValue(current - nudgeStep);
    });

    incBtn.addEventListener('click', () => {
      if (allowedValues && allowedValues.length) {
        const current = clampAndSnap(toUiValue(this.part.params[param.key]));
        const index = allowedValues.findIndex(value => Math.abs(value - current) < 1e-6);
        const nextIndex = index >= 0 ? Math.min(allowedValues.length - 1, index + 1) : 0;
        setValue(allowedValues[nextIndex]);
        return;
      }
      const current = toUiValue(this.part.params[param.key]);
      setValue(current + nudgeStep);
    });

    setValue(currentValue, false);

    inputWrapper.appendChild(slider);
    inputWrapper.appendChild(decBtn);
    inputWrapper.appendChild(input);
    if (param.unit || isThickness) inputWrapper.appendChild(unit);
    inputWrapper.appendChild(incBtn);

    wrapper.appendChild(label);
    wrapper.appendChild(inputWrapper);

    return wrapper;
  }

  renderFacesSection(faces) {
    // Ana "Manşon Yönetimi" bölümü
    const mainSection = document.createElement('div');
    mainSection.className = 'param-section manson-management-section';

    const mainHeader = document.createElement('h3');
    mainHeader.className = 'param-section-title';
    mainHeader.textContent = '🔘 Manşon Yönetimi';

    mainHeader.addEventListener('click', () => {
      mainSection.classList.toggle('collapsed');
    });

    mainSection.appendChild(mainHeader);

    const mainContent = document.createElement('div');
    mainContent.className = 'param-section-content';

    // Her yüz için satır oluştur
    faces.forEach(face => {
      const faceRow = document.createElement('div');
      faceRow.className = 'manson-face-row';
      faceRow.dataset.faceKey = face.key;

      // Yüz adı ve adet kontrolü aynı satırda
      const faceHeader = document.createElement('div');
      faceHeader.className = 'manson-face-header';

      const faceLabel = document.createElement('span');
      faceLabel.className = 'manson-face-label';
      faceLabel.textContent = face.label;

      const countWrapper = document.createElement('div');
      countWrapper.className = 'manson-count-wrapper';

      // - butonu
      const decrementBtn = document.createElement('button');
      decrementBtn.type = 'button';
      decrementBtn.className = 'manson-count-btn decrement';
      decrementBtn.textContent = '−';

      const countInput = document.createElement('input');
      countInput.type = 'number';
      countInput.className = 'manson-count-input';
      countInput.min = 0;
      countInput.max = 20;
      countInput.step = 1;
      countInput.value = this.part.params.faces[face.key].count || 0;

      // + butonu
      const incrementBtn = document.createElement('button');
      incrementBtn.type = 'button';
      incrementBtn.className = 'manson-count-btn increment';
      incrementBtn.textContent = '+';

      const updateCount = (newCount) => {
        const count = Math.max(0, Math.min(20, newCount));
        countInput.value = count;
        this.part.ensureFacePorts(face.key, count);
        this.renderMansonPortsInputs(face.key, faceRow);
        this.onUpdate();
      };

      decrementBtn.addEventListener('click', () => {
        updateCount((parseInt(countInput.value) || 0) - 1);
      });

      incrementBtn.addEventListener('click', () => {
        updateCount((parseInt(countInput.value) || 0) + 1);
      });

      countInput.addEventListener('input', (e) => {
        updateCount(parseInt(e.target.value) || 0);
      });

      countWrapper.appendChild(decrementBtn);
      countWrapper.appendChild(countInput);
      countWrapper.appendChild(incrementBtn);

      faceHeader.appendChild(faceLabel);
      faceHeader.appendChild(countWrapper);
      faceRow.appendChild(faceHeader);

      // Çaplar container
      const portsContainer = document.createElement('div');
      portsContainer.className = 'manson-ports-container';
      portsContainer.dataset.faceKey = face.key;
      faceRow.appendChild(portsContainer);

      mainContent.appendChild(faceRow);

      // İlk render için çapları göster
      this.renderMansonPortsInputs(face.key, faceRow);
    });

    mainSection.appendChild(mainContent);
    this.container.appendChild(mainSection);
  }

  renderMansonPortsInputs(faceKey, faceRow) {
    const portsContainer = faceRow.querySelector(`.manson-ports-container[data-face-key="${faceKey}"]`);
    if (!portsContainer) return;

    portsContainer.innerHTML = '';

    const face = this.part.params.faces[faceKey];
    if (!face || !face.ports || face.ports.length === 0) {
      return; // Boşsa hiçbir şey gösterme
    }

    // Çaplar için yatay grid
    const portsGrid = document.createElement('div');
    portsGrid.className = 'manson-ports-grid';

    face.ports.forEach((port, index) => {
      const portItem = document.createElement('div');
      portItem.className = 'manson-port-item';

      const portInput = document.createElement('input');
      portInput.type = 'number';
      portInput.className = 'manson-port-input';
      portInput.min = 1;
      portInput.max = 400;
      portInput.step = 1;
      portInput.value = port.diam;
      portInput.title = `${index + 1}. Manşon Çapı`;

      portInput.addEventListener('input', (e) => {
        const diam = parseFloat(e.target.value) || this.part.params.Phi;
        face.ports[index].diam = diam;
        this.onUpdate();
      });

      const portLabel = document.createElement('span');
      portLabel.className = 'manson-port-label';
      portLabel.textContent = `Ø${index + 1}`;

      portItem.appendChild(portLabel);
      portItem.appendChild(portInput);
      portsGrid.appendChild(portItem);
    });

    portsContainer.appendChild(portsGrid);
  }

  renderFacePortsInputs(faceKey, section) {
    const portsContainer = section.querySelector(`.face-ports-container[data-face-key="${faceKey}"]`);
    if (!portsContainer) return;

    portsContainer.innerHTML = '';

    const face = this.part.params.faces[faceKey];
    if (!face || !face.ports || face.ports.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'face-ports-empty';
      empty.textContent = 'Empty';
      empty.style.fontStyle = 'italic';
      empty.style.color = '#666';
      empty.style.padding = '8px';
      portsContainer.appendChild(empty);
      return;
    }

    const portsTitle = document.createElement('div');
    portsTitle.className = 'param-label';
    portsTitle.textContent = 'Çaplar';
    portsTitle.style.fontWeight = 'bold';
    portsTitle.style.marginTop = '8px';
    portsContainer.appendChild(portsTitle);

    face.ports.forEach((port, index) => {
      const portControl = document.createElement('div');
      portControl.className = 'param-control';

      const portLabel = document.createElement('label');
      portLabel.className = 'param-label';
      portLabel.textContent = `${index + 1}. Ø (cm)`;

      const portInput = document.createElement('input');
      portInput.type = 'number';
      portInput.className = 'param-input';
      portInput.min = 1;
      portInput.max = 400;
      portInput.step = 1;
      portInput.value = port.diam;

      portInput.addEventListener('input', (e) => {
        const diam = parseFloat(e.target.value) || this.part.params.Phi;
        face.ports[index].diam = diam;
        this.onUpdate();
      });

      portControl.appendChild(portLabel);
      portControl.appendChild(portInput);
      portsContainer.appendChild(portControl);
    });
  }

  renderSheetScaleSection() {
    if (!this.part || !this.part.getSheetScaleState || this.part.params.t === undefined) return;

    const formatLabel = (value) => {
      if (!Number.isFinite(value)) return '-';
      const rounded = Math.round(value * 100) / 100;
      const text = rounded.toFixed(2)
        .replace(/\.0+$/, '')
        .replace(/(\.\d*[1-9])0+$/, '$1');
      return text.replace('.', ',');
    };

    const section = document.createElement('div');
    section.className = 'param-section collapsed sheet-scale-section';

    const header = document.createElement('h3');
    header.className = 'param-section-title';
    header.textContent = 'Sac Kalinligi Skalasi';

    header.addEventListener('click', () => {
      section.classList.toggle('collapsed');
    });

    section.appendChild(header);

    const content = document.createElement('div');
    content.className = 'param-section-content';

    const summary = document.createElement('div');
    summary.className = 'sheet-scale-summary';
    content.appendChild(summary);

    const table = document.createElement('div');
    table.className = 'sheet-scale-table';
    content.appendChild(table);

    const grid = document.createElement('div');
    grid.className = 'param-grid';

    const enableControl = this.createCheckboxControl('sheetScaleEnabled', 'Skala ile sec');
    grid.appendChild(enableControl);
    this.controls.sheetScaleEnabled = enableControl;

    const entries = [];
    GALV_THICKNESS_MM.forEach((thicknessMm) => {
      const entry = document.createElement('div');
      entry.className = 'sheet-scale-entry';

      const title = document.createElement('div');
      title.className = 'sheet-scale-entry-title';
      title.textContent = `${formatLabel(thicknessMm)} mm`;
      entry.appendChild(title);

      const enabledKey = BasePart.getSheetScaleEnabledKey(thicknessMm);
      const maxKey = BasePart.getSheetScaleMaxKey(thicknessMm);

      const entryControls = document.createElement('div');
      entryControls.className = 'sheet-scale-entry-controls';

      const includeControl = this.createCheckboxControl(enabledKey, 'Dahil');
      entryControls.appendChild(includeControl);
      this.controls[enabledKey] = includeControl;

      const limitControl = this.createNumberControl({
        key: maxKey,
        label: 'Bitis (mm)',
        min: 1,
        max: 5000,
        step: 1,
        unit: 'mm',
        nudgeStep: 50
      });
      entryControls.appendChild(limitControl);
      this.controls[maxKey] = limitControl;

      entry.appendChild(entryControls);
      grid.appendChild(entry);

      entries.push({ thicknessMm, enabledKey, maxKey });
    });

    content.appendChild(grid);
    section.appendChild(content);
    this.container.appendChild(section);

    this.sheetScaleElements = { summary, table, section, entries };
  }

  updateSheetScaleDisplay() {
    if (!this.sheetScaleElements || !this.part || !this.part.getSheetScaleState) return;

    const state = this.part.getSheetScaleState();
    const format = (value) => {
      if (!Number.isFinite(value)) return '-';
      const rounded = Math.round(value * 100) / 100;
      const text = rounded.toFixed(2)
        .replace(/\.0+$/, '')
        .replace(/(\.\d*[1-9])0+$/, '$1');
      return text.replace('.', ',');
    };

    const summary = this.sheetScaleElements.summary;
    if (summary) {
      if (state.enabled && Number.isFinite(state.thicknessMm)) {
        summary.textContent = `En genis kenar: ${format(state.edgeMm)} mm -> Sac kalinligi: ${format(state.thicknessMm)} mm`;
      } else {
        summary.textContent = 'Skala kapali. Sac kalinligi elle ayarlanir.';
      }
    }

    const table = this.sheetScaleElements.table;
    if (table) {
      const entries = state.entries || [];
      const enabledEntries = entries.filter(entry => entry.enabled);
      const lastEnabled = enabledEntries.length ? enabledEntries[enabledEntries.length - 1] : null;

      table.innerHTML = '';
      entries.forEach((entry) => {
        const item = document.createElement('div');
        item.className = 'sheet-scale-row';
        const label = document.createElement('span');
        label.className = 'sheet-scale-range';
        label.textContent = `${format(entry.thicknessMm)} mm`;
        const range = document.createElement('span');
        range.className = 'sheet-scale-thickness';

        if (!entry.enabled) {
          range.textContent = 'Kapali';
        } else if (lastEnabled && entry === lastEnabled) {
          range.textContent = `>= ${format(entry.minMm)} mm`;
        } else {
          range.textContent = `${format(entry.minMm)} - ${format(entry.maxMm)} mm`;
        }

        item.appendChild(label);
        item.appendChild(range);
        table.appendChild(item);
      });
    }

    const entries = state.entries || [];
    entries.forEach((entry) => {
      this.syncNumberControlValue(entry.maxKey, entry.maxMm);
    });
    this.syncNumberControlValue('t', this.part.params.t);

    const enabled = state.enabled;

    entries.forEach((entry) => {
      this.setControlDisabled(this.controls[entry.enabledKey], !enabled);
      this.setControlDisabled(this.controls[entry.maxKey], !enabled || !entry.enabled);
    });

    this.setControlDisabled(this.controls.t, enabled);
  }
  renderViewSection() {
    const section = document.createElement('div');
    section.className = 'param-section collapsed'; // Varsayılan kapalı

    const header = document.createElement('h3');
    header.className = 'param-section-title';
    header.textContent = '👁️ Görünüm';

    // Accordion click handler
    header.addEventListener('click', () => {
      section.classList.toggle('collapsed');
    });

    section.appendChild(header);

    const content = document.createElement('div');
    content.className = 'param-section-content';

    const checkboxes = [
      { key: 'showEdges', label: 'Kenar Çizgileri' },
      { key: 'showDims', label: 'Ölçülendirme' },
      { key: 'showFlange', label: 'Flanşları Göster' },
      { key: 'keepViewOnEdit', label: 'Görüşü Koru' }
    ];

    checkboxes.forEach(cb => {
      const control = this.createCheckboxControl(cb.key, cb.label);
      content.appendChild(control);
    });

    section.appendChild(content);
    this.container.appendChild(section);
  }

  renderFlangeSection() {
    const section = document.createElement('div');
    section.className = 'param-section collapsed';

    const header = document.createElement('h3');
    header.className = 'param-section-title';
    header.textContent = '🔧 Flanş Ayarları';

    header.addEventListener('click', () => {
      section.classList.toggle('collapsed');
    });

    section.appendChild(header);

    const content = document.createElement('div');
    content.className = 'param-section-content';

    const flangeParams = [
      { key: 'flangeLip', label: 'Flanş Payı', min: 1, max: 8, step: 1, unit: 'cm' },
      { key: 'flangeThick', label: 'Flanş Kalınlığı', min: 0.2, max: 2, step: 0.05, unit: 'cm' }
    ];

    flangeParams.forEach(param => {
      const control = this.createSliderControl(param);
      content.appendChild(control);
    });

    section.appendChild(content);
    this.container.appendChild(section);
  }

  renderMaterialSection() {
    const section = document.createElement('div');
    section.className = 'param-section collapsed';

    const header = document.createElement('h3');
    header.className = 'param-section-title';
    header.textContent = '✨ Malzeme Özellikleri';

    header.addEventListener('click', () => {
      section.classList.toggle('collapsed');
    });

    section.appendChild(header);

    const content = document.createElement('div');
    content.className = 'param-section-content';

    const materialParams = [
      { key: 'metalRough', label: 'Pürüzlülük', min: 0, max: 1, step: 0.01 },
      { key: 'metalness', label: 'Metallik', min: 0, max: 1, step: 0.01 }
    ];

    materialParams.forEach(param => {
      const control = this.createSliderControl(param);
      content.appendChild(control);
    });

    section.appendChild(content);
    this.container.appendChild(section);
  }

  renderColorSection(colors) {
    const section = document.createElement('div');
    section.className = 'param-section collapsed';

    const header = document.createElement('h3');
    header.className = 'param-section-title';
    header.textContent = '🎨 Renkler';

    header.addEventListener('click', () => {
      section.classList.toggle('collapsed');
    });

    section.appendChild(header);

    const content = document.createElement('div');
    content.className = 'param-section-content';

    const grid = document.createElement('div');
    grid.className = 'param-grid';

    colors.forEach(color => {
      const control = this.createColorControl(color);
      grid.appendChild(control);
    });

    content.appendChild(grid);
    section.appendChild(content);
    this.container.appendChild(section);
  }

  renderAreaSection() {
    const section = document.createElement('div');
    section.className = 'param-section collapsed';

    const header = document.createElement('h3');
    header.className = 'param-section-title';
    header.textContent = '📊 Alan Hesabı';

    // Accordion click handler
    header.addEventListener('click', () => {
      section.classList.toggle('collapsed');
    });

    section.appendChild(header);

    const content = document.createElement('div');
    content.className = 'param-section-content';

    const areaParams = [
      { key: 'wastePercent', label: 'Atık Oranı (%)', min: 0, max: 100, step: 1 },
      { key: 'kFactor', label: 'K Faktörü', min: 0, max: 2, step: 0.01 }
    ];

    areaParams.forEach(param => {
      const control = this.createSliderControl(param);
      content.appendChild(control);
    });

    const areaInclude = this.createCheckboxControl('areaIncludeFlange', 'Flanşı Dahil Et');
    content.appendChild(areaInclude);

    // Alan gösterimi
    const areaDisplay = document.createElement('div');
    areaDisplay.className = 'area-display';
    areaDisplay.id = 'area-display';
    areaDisplay.textContent = 'Alan hesaplanıyor...';
    content.appendChild(areaDisplay);

    section.appendChild(content);
    this.container.appendChild(section);

    // Referansı sakla
    this.part.areaDisplayElement = areaDisplay;
  }

  createSliderControl(param) {
    const wrapper = document.createElement('div');
    wrapper.className = 'param-slider-control';

    const labelRow = document.createElement('div');
    labelRow.className = 'param-slider-label-row';

    const label = document.createElement('label');
    label.className = 'param-label';
    label.textContent = param.label;

    const value = document.createElement('span');
    value.className = 'param-value';
    // cm ölçülerinde tam sayı, diğerlerinde ondalık göster
    const formatValue = (val) => param.unit === 'cm' ? Math.round(val).toString() : val.toFixed(2);
    value.textContent = formatValue(this.part.params[param.key]);

    labelRow.appendChild(label);
    labelRow.appendChild(value);

    const slider = document.createElement('input');
    slider.type = 'range';
    slider.className = 'param-slider';
    slider.min = param.min;
    slider.max = param.max;
    slider.step = param.step;
    slider.value = this.part.params[param.key];

    slider.addEventListener('input', (e) => {
      const val = parseFloat(e.target.value);
      this.part.params[param.key] = val;
      value.textContent = formatValue(val);

      if (param.key === 'metalRough' || param.key === 'metalness') {
        this.part.updateMaterialProperties();
      } else {
        this.onUpdate();
      }
    });

    wrapper.appendChild(labelRow);
    wrapper.appendChild(slider);

    return wrapper;
  }

  createCheckboxControl(key, label) {
    const wrapper = document.createElement('div');
    wrapper.className = 'param-checkbox-control';

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.className = 'param-checkbox';
    checkbox.id = `param-${key}`;
    checkbox.checked = this.part.params[key];

    checkbox.addEventListener('change', (e) => {
      this.part.params[key] = e.target.checked;
      this.onUpdate();
    });

    const labelEl = document.createElement('label');
    labelEl.className = 'param-checkbox-label';
    labelEl.htmlFor = `param-${key}`;
    labelEl.textContent = label;

    wrapper.appendChild(checkbox);
    wrapper.appendChild(labelEl);

    return wrapper;
  }

  createColorControl(color) {
    const wrapper = document.createElement('div');
    wrapper.className = 'param-control';

    const label = document.createElement('label');
    label.className = 'param-label';
    label.textContent = color.label;

    const input = document.createElement('input');
    input.type = 'color';
    input.className = 'param-color';
    input.value = this.part.params[color.key];

    input.addEventListener('change', (e) => {
      this.part.params[color.key] = e.target.value;
      this.onUpdate();
    });

    wrapper.appendChild(label);
    wrapper.appendChild(input);

    return wrapper;
  }


  setControlDisabled(control, disabled) {
    if (!control) return;
    control.classList.toggle('disabled', disabled);
    control.querySelectorAll('input, button, select').forEach((el) => {
      el.disabled = disabled;
    });
  }

  syncNumberControlValue(key, value) {
    const control = this.controls[key];
    if (!control) return;
    const slider = control.querySelector('.param-number-slider');
    const input = control.querySelector('.param-number-input');
    const uiValue = key === 't' ? value * 10 : value;
    const stepValue = slider ? parseFloat(slider.step) : parseFloat(input?.step);
    const decimals = Number.isFinite(stepValue) && stepValue % 1 !== 0
      ? Math.min((stepValue.toString().split('.')[1] || '').length, 4)
      : 0;
    const formatNumber = (num) => {
      if (!Number.isFinite(num)) return '';
      if (decimals <= 0) return Math.round(num).toString();
      const text = num.toFixed(decimals);
      return text.replace(/\.0+$/, '').replace(/(\.\d*[1-9])0+$/, '$1');
    };

    if (slider) {
      slider.value = uiValue;
      const min = parseFloat(slider.min);
      const max = parseFloat(slider.max);
      const span = (max - min) || 1;
      const pct = ((uiValue - min) / span) * 100;
      slider.style.background = `linear-gradient(90deg, #4c8dff ${pct}%, #2a3242 ${pct}%)`;
    }
    if (input) {
      input.value = formatNumber(uiValue);
    }
  }
  // Sahne kontrolleri bölümü (Grid, Eksenler, Arkaplan vb.)
  renderSceneControlsSection() {
    if (!this.scene) return;

    const section = document.createElement('div');
    section.className = 'param-section collapsed'; // Varsayılan kapalı

    const header = document.createElement('h3');
    header.className = 'param-section-title';
    header.textContent = '🌐 Sahne Ayarları';

    header.addEventListener('click', () => {
      section.classList.toggle('collapsed');
    });

    section.appendChild(header);

    const content = document.createElement('div');
    content.className = 'param-section-content';

    const grid = document.createElement('div');
    grid.className = 'param-grid';

    // Sahne parametrelerini al
    const sceneParams = this.scene.getSceneParameterDefinitions();

    sceneParams.forEach(param => {
      let control;

      if (param.type === 'checkbox') {
        control = this.createSceneCheckboxControl(param.key, param.label);
      } else if (param.type === 'color') {
        control = this.createSceneColorControl(param.key, param.label);
      }

      if (control) {
        grid.appendChild(control);
      }
    });

    // Tema değiştirme kontrolü ekle
    const themeControl = this.createThemeToggleControl();
    grid.appendChild(themeControl);

    // Sekme navigasyonu kontrolü ekle
    const layoutControl = this.createLayoutToggleControl();
    grid.appendChild(layoutControl);

    content.appendChild(grid);
    section.appendChild(content);
    this.container.appendChild(section);
  }

  createThemeToggleControl() {
    const wrapper = document.createElement('div');
    wrapper.className = 'param-control';

    const labelEl = document.createElement('label');
    labelEl.className = 'param-label';
    labelEl.textContent = 'Tema';

    const select = document.createElement('select');
    select.id = 'theme-selector';
    select.className = 'param-select';

    const themes = [
      { value: 'default', label: 'Varsayılan' },
      { value: 'modern', label: 'Modern (Glassmorphism)' },
      { value: 'emerald', label: 'Emerald Dark' }
    ];

    themes.forEach(theme => {
      const option = document.createElement('option');
      option.value = theme.value;
      option.textContent = theme.label;
      select.appendChild(option);
    });

    // Mevcut tema durumunu kontrol et
    const paramsPanel = document.querySelector('.params-panel');
    const savedTheme = localStorage.getItem('guiTheme') || 'default';
    select.value = savedTheme;

    select.addEventListener('change', (e) => {
      const panel = document.querySelector('.params-panel');
      if (panel) {
        // Tüm tema class'larını kaldır
        panel.classList.remove('theme-modern', 'theme-emerald');

        // Seçilen temayı uygula
        const selectedTheme = e.target.value;
        if (selectedTheme !== 'default') {
          panel.classList.add(`theme-${selectedTheme}`);
        }

        // Tercihi localStorage'a kaydet
        localStorage.setItem('guiTheme', selectedTheme);
      }
    });

    wrapper.appendChild(labelEl);
    wrapper.appendChild(select);

    return wrapper;
  }

  createSceneCheckboxControl(key, label) {
    const wrapper = document.createElement('div');
    wrapper.className = 'param-row checkbox-row';

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.id = `scene-${key}`;
    checkbox.className = 'param-checkbox';
    checkbox.checked = this.scene.sceneParams[key];

    checkbox.addEventListener('change', (e) => {
      this.scene.updateSceneParam(key, e.target.checked);
    });

    const labelEl = document.createElement('label');
    labelEl.htmlFor = `scene-${key}`;
    labelEl.className = 'param-label';
    labelEl.textContent = label;

    wrapper.appendChild(checkbox);
    wrapper.appendChild(labelEl);

    this.controls[`scene-${key}`] = checkbox;

    return wrapper;
  }

  createSceneColorControl(key, label) {
    const wrapper = document.createElement('div');
    wrapper.className = 'param-row';

    const labelEl = document.createElement('label');
    labelEl.className = 'param-label';
    labelEl.textContent = label;

    const input = document.createElement('input');
    input.type = 'color';
    input.className = 'param-color';

    // Convert hex number to color string
    const colorValue = this.scene.sceneParams[key];
    const hexString = '#' + colorValue.toString(16).padStart(6, '0');
    input.value = hexString;

    input.addEventListener('change', (e) => {
      this.scene.updateSceneParam(key, e.target.value);
    });

    wrapper.appendChild(labelEl);
    wrapper.appendChild(input);

    this.controls[`scene-${key}`] = input;

    return wrapper;
  }
}
