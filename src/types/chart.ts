export interface ArcCell {
  day: number;
  habitIndex: number;
  path: string;
  color: string;
}

export interface LabelPosition {
  x: number;
  y: number;
  text: string;
  anchor: string;
}

export interface ChartDimensions {
  cx: number;
  cy: number;
  innerRadius: number;
  ringWidth: number;
  ringGap: number;
  outerRadius: number;
}
