import { LEGEND_ITEMS } from './utils/colors';

export function ChartLegend() {
  return (
    <div className="flex flex-wrap gap-3 justify-center mt-4">
      {LEGEND_ITEMS.map((item, i) => (
        <div key={i} className="flex items-center gap-1.5">
          <div
            className="w-3 h-3 rounded-sm"
            style={{ backgroundColor: item.color }}
          />
          <span className="text-xs text-gray-600">{item.label}</span>
        </div>
      ))}
    </div>
  );
}
