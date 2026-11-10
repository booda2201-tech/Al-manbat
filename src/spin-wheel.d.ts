declare module 'spin-wheel' {
  export class Wheel {
    constructor(container: HTMLElement, props?: WheelProps);
    spinToItem(
      itemIndex?: number,
      duration?: number,
      spinToCenter?: boolean,
      numberOfRevolutions?: number,
      direction?: number
    ): void;
    remove(): void;
    resize(): void;
    rotation: number;
  }

  export interface WheelProps {
    items?: Array<{ label: string; backgroundColor?: string; labelColor?: string }>;
    borderColor?: string;
    borderWidth?: number;
    isInteractive?: boolean;
    itemLabelAlign?: 'left' | 'center' | 'right';
    itemLabelFont?: string;
    itemLabelFontSizeMax?: number;
    itemLabelRadius?: number;
    itemLabelRadiusMax?: number;
    itemLabelRotation?: number;
    lineColor?: string;
    lineWidth?: number;
    pixelRatio?: number;
    pointerAngle?: number;
    radius?: number;
    onRest?: () => void;
  }
}
