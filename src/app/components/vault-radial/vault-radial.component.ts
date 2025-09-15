import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

export interface VaultNode { label: string; percent: number; }

@Component({
  selector: 'app-vault-radial',
  standalone: true,
  imports: [CommonModule],
  templateUrl: 'vault-radial.component.html',
  styleUrl: 'vault-radial.component.scss'
})
export class VaultRadialComponent {
  width = 300;

  mainPercent = 100;

  @Input() nodes: VaultNode[] = [
    { label: 'Wallet 1', percent: 10 },
    { label: 'Wallet 2', percent: 25 },
    { label: 'Wallet 3', percent: 65 },
  ];

  arcPaddingDeg = 20; 
  linkGap = 16;   
  padTop = 8;   
  padBottom = 12;

  size = 300;
  outerPad = 16;
  get vb() {
    const s = this.size + this.outerPad * 2;
    return `${-this.outerPad} ${-this.outerPad} ${s} ${s}`;
  }

  get centerX() { return this.size / 2; }

  mainR  = this.size * 0.21;
  smallR = this.size * 0.145;

  get orbitR() { return this.mainR + this.smallR + this.linkGap; }

  get centerY() {
    const minCY = this.padTop + this.mainR;  
    const maxCY = this.size - this.padBottom - (this.orbitR + this.smallR); 
    return Math.max(minCY, Math.min(maxCY, (minCY + maxCY) / 2));
  }

  get placed() {
    const items = this.nodes.slice(0, 10);
    const n = items.length || 1;

    let angles: number[] | null = null;
    if (n === 1) angles = [90];
    else if (n === 2) angles = [45, 135];
    else if (n === 3) angles = [30, 90, 150];

    if (!angles) {
      const start = 0 + this.arcPaddingDeg; 
      const end   = 180 - this.arcPaddingDeg; 
      const step  = (end - start) / (n - 1);
      angles = Array.from({ length: n }, (_, i) => start + i * step);
    }

    return items.map((data, i) => {
      const rad = (angles![i] * Math.PI) / 180;
      const ux = Math.cos(rad), uy = Math.sin(rad);

      const x  = this.centerX + this.orbitR * ux;
      const y  = this.centerY + this.orbitR * uy;

      const x1 = this.centerX + this.mainR * ux;
      const y1 = this.centerY + this.mainR * uy;
      const x2 = x - this.smallR * ux;
      const y2 = y - this.smallR * uy;

      const id = `${data.label}-${i}`;

      return { id, x, y, data, line: { x1, y1, x2, y2 } };
    });
  }
}
