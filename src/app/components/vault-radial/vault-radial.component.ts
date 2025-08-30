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

  /** відсоток у центрі */
  mainPercent = 100;

  /** вузли (до 10) */
  @Input() nodes: VaultNode[] = [
    { label: 'Wallet 1', percent: 10 },
    { label: 'Wallet 2', percent: 25 },
    { label: 'Wallet 3', percent: 65 },
  ];

  /** налаштування розкладки */
  arcPaddingDeg = 20;  // як далеко від горизонталі розносити крайні
  linkGap = 16;        // “зазор” між колами = довжина лінії
  padTop = 8;          // візуальний відступ зверху всередині viewBox
  padBottom = 12;      // візуальний відступ знизу

  /** базовий розмір координат + зовнішні поля (щоб тіні не різались) */
  size = 300;
  outerPad = 16;
  get vb() {
    const s = this.size + this.outerPad * 2;
    return `${-this.outerPad} ${-this.outerPad} ${s} ${s}`;
  }

  /** центр по X */
  get centerX() { return this.size / 2; }

  /** геометрія кіл (трохи зменшені) */
  mainR  = this.size * 0.21;
  smallR = this.size * 0.145;

  /** радіус орбіти супутників (щоб лінії були довші) */
  get orbitR() { return this.mainR + this.smallR + this.linkGap; }

  /** центр по Y — рахуємо так, щоб зверху/знизу були лише невеликі відступи */
  get centerY() {
    const minCY = this.padTop + this.mainR;                      // щоб верх не прилипав
    const maxCY = this.size - this.padBottom - (this.orbitR + this.smallR); // щоб низ помістився
    // ставимо посередині допустимого діапазону
    return Math.max(minCY, Math.min(maxCY, (minCY + maxCY) / 2));
  }

  /** позиції та лінії — тільки нижня півкуля */
  get placed() {
    const items = this.nodes.slice(0, 10);
    const n = items.length || 1;

    let angles: number[] | null = null;
    if (n === 1) angles = [90];
    else if (n === 2) angles = [45, 135];
    else if (n === 3) angles = [30, 90, 150];

    if (!angles) {
      const start = 0 + this.arcPaddingDeg;        // права нижня сторона
      const end   = 180 - this.arcPaddingDeg;      // ліва нижня сторона
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
