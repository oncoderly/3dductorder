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
  }

  render() {
    this.container.innerHTML = '';
    const definitions = this.part.getParameterDefinitions();

    // SAHNE KONTROLLERI (en üstte, tüm parçalar için ortak)
    if (this.scene) {
      this.renderSceneControlsSection();
    }

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
    this.updateSheetScaleDisplay();
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

    input.addEventListener('input', (e) => {
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
    faces.forEach(face => {
      const section = document.createElement('div');
      section.className = 'param-section face-section collapsed';
      section.dataset.faceKey = face.key;

      const header = document.createElement('h3');
      header.className = 'param-section-title';
      header.textContent = face.label;

      // Accordion click handler
      header.addEventListener('click', () => {
        section.classList.toggle('collapsed');
      });

      section.appendChild(header);

      const content = document.createElement('div');
      content.className = 'param-section-content';

      // Adet kontrolü
      const countControl = document.createElement('div');
      countControl.className = 'param-control';

      const countLabel = document.createElement('label');
      countLabel.className = 'param-label';
      countLabel.textContent = 'Adet';

      const countInput = document.createElement('input');
      countInput.type = 'number';
      countInput.className = 'param-input';
      countInput.min = 0;
      countInput.max = 20;
      countInput.step = 1;
      countInput.value = this.part.params.faces[face.key].count || 0;

      countInput.addEventListener('input', (e) => {
        const count = parseInt(e.target.value) || 0;
        this.part.ensureFacePorts(face.key, count);
        this.renderFacePortsInputs(face.key, section);
        this.onUpdate();
      });

      countControl.appendChild(countLabel);
      countControl.appendChild(countInput);
      content.appendChild(countControl);

      // Çaplar container
      const portsContainer = document.createElement('div');
      portsContainer.className = 'face-ports-container';
      portsContainer.dataset.faceKey = face.key;
      content.appendChild(portsContainer);

      section.appendChild(content);

      // İlk render için çapları göster
      this.renderFacePortsInputs(face.key, section);

      this.container.appendChild(section);
    });
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
    section.className = 'param-section';

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
    section.className = 'param-section';

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

    content.appendChild(grid);
    section.appendChild(content);
    this.container.appendChild(section);
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
