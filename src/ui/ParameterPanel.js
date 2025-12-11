// ParameterPanel - Mobil-uyumlu standart parametre paneli
export class ParameterPanel {
  constructor(container, part, onUpdate, scene = null) {
    this.container = container;
    this.part = part;
    this.onUpdate = onUpdate;
    this.scene = scene; // Scene3D instance for scene controls
    this.controls = {};
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

      if (param.type === 'number') {
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

    const currentValue = this.part.params[param.key];
    const range = Math.max(1, (param.max || 1) - (param.min || 0));
    const nudgeStep = param.nudgeStep ?? param.nudge ?? (range >= 50 ? 5 : (param.step || 1) * 5);
    const decimals = (() => {
      if (!param.step || Number.isInteger(param.step)) return 0;
      const [, fraction] = param.step.toString().split('.');
      return Math.min((fraction ? fraction.length : 2), 4);
    })();

    const slider = document.createElement('input');
    slider.type = 'range';
    slider.className = 'param-number-slider';
    slider.min = param.min;
    slider.max = param.max;
    slider.step = param.step;
    slider.value = currentValue;

    const decBtn = document.createElement('button');
    decBtn.type = 'button';
    decBtn.className = 'param-step-btn decrement';
    decBtn.textContent = `-${nudgeStep}`;

    const input = document.createElement('input');
    input.type = 'number';
    input.className = 'param-input';
    input.classList.add('param-number-input');
    input.min = param.min;
    input.max = param.max;
    input.step = param.step;
    input.value = currentValue;

    const unit = document.createElement('span');
    unit.className = 'param-unit';
    unit.textContent = param.unit;

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
      const min = param.min ?? Number.NEGATIVE_INFINITY;
      const max = param.max ?? Number.POSITIVE_INFINITY;
      const step = param.step || 1;
      let value = parseFloat(raw);
      if (Number.isNaN(value)) value = param.default ?? min ?? 0;
      value = Math.min(max, Math.max(min, value));
      const snapped = Math.round((value - min) / step) * step + min;
      const fixed = decimals > 0 ? parseFloat(snapped.toFixed(decimals)) : Math.round(snapped);
      return Math.min(max, Math.max(min, fixed));
    };

    const setValue = (val, triggerUpdate = true) => {
      const value = clampAndSnap(val);
      this.part.params[param.key] = value;
      input.value = value;
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
      setValue(this.part.params[param.key] - nudgeStep);
    });

    incBtn.addEventListener('click', () => {
      setValue(this.part.params[param.key] + nudgeStep);
    });

    updateSliderFill(currentValue);

    inputWrapper.appendChild(slider);
    inputWrapper.appendChild(decBtn);
    inputWrapper.appendChild(input);
    if (param.unit) inputWrapper.appendChild(unit);
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
