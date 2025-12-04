// ViewControls - 3D görünüm kontrolleri
import * as THREE from 'three';

export class ViewControls {
  constructor(container, scene) {
    this.container = container;
    this.scene = scene;
    this.views = {
      'Right': new THREE.Vector3(1, 0, 0),
      'Left': new THREE.Vector3(-1, 0, 0),
      'Front': new THREE.Vector3(0, 0, 1),
      'Back': new THREE.Vector3(0, 0, -1),
      'Top': new THREE.Vector3(0, 1, 0),
      'SW Iso': new THREE.Vector3(-1, 1, -1),
      'NE Iso': new THREE.Vector3(1, 1, 1)
    };

    this.render();
  }

  render() {
    this.container.innerHTML = '';
    this.container.className = 'view-controls';

    Object.entries(this.views).forEach(([name, direction]) => {
      const button = document.createElement('button');
      button.className = 'view-btn';
      button.dataset.view = name;

      const icon = this.createIcon(name);
      const label = document.createElement('span');
      label.textContent = name;

      button.appendChild(icon);
      button.appendChild(label);

      button.addEventListener('click', () => {
        this.scene.setView(direction);
      });

      this.container.appendChild(button);
    });
  }

  createIcon(viewName) {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('class', 'view-icon');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('aria-hidden', 'true');

    const stroke = '#9aa7b1';
    const face = '#263040';
    const accent = '#4cc3ff';

    switch (viewName) {
      case 'Top':
        svg.innerHTML = this.cubeIconSVG('top', stroke, face, accent);
        break;
      case 'Left':
        svg.innerHTML = this.cubeIconSVG('left', stroke, face, accent);
        break;
      case 'Right':
        svg.innerHTML = this.cubeIconSVG('right', stroke, face, accent);
        break;
      case 'Front':
        svg.innerHTML = this.faceIconSVG(stroke, accent);
        break;
      case 'Back':
        svg.innerHTML = this.backIconSVG(stroke, face, accent);
        break;
      case 'SW Iso':
      case 'NE Iso':
      default:
        svg.innerHTML = this.cubeIconSVG(null, stroke, face, accent);
    }

    return svg;
  }

  cubeIconSVG(highlight, stroke, face, accent) {
    const topFill = highlight === 'top' ? accent : face;
    const leftFill = highlight === 'left' ? accent : face;
    const rightFill = highlight === 'right' ? accent : face;

    return `
      <polygon points="6,10 12,6 18,10 12,14" fill="${topFill}" stroke="${stroke}" stroke-width="1"/>
      <polygon points="6,10 6,18 12,22 12,14" fill="${leftFill}" stroke="${stroke}" stroke-width="1"/>
      <polygon points="12,14 12,22 18,18 18,10" fill="${rightFill}" stroke="${stroke}" stroke-width="1"/>
    `;
  }

  faceIconSVG(stroke, accent) {
    return `<rect x="6" y="6" width="12" height="12" rx="2" ry="2" fill="${accent}" stroke="${stroke}" stroke-width="1"/>`;
  }

  backIconSVG(stroke, face, accent) {
    return `
      <rect x="5" y="5" width="12" height="12" rx="2" ry="2" fill="${face}" stroke="${stroke}" stroke-width="1"/>
      <rect x="7" y="7" width="12" height="12" rx="2" ry="2" fill="${accent}" stroke="${stroke}" stroke-width="1"/>
    `;
  }
}
