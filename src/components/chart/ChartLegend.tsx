import { LEGEND_ITEMS } from './utils/colors';

export function ChartLegend() {
  return (
    <div className="flex flex-row flex-wrap gap-3 justify-center mt-4 lg:mt-0 lg:flex-col lg:gap-2 lg:justify-start">
      {LEGEND_ITEMS.map((item, i) => (
        <div key={i} className="flex items-center gap-1.5">
          <div
            className="w-3 h-3 rounded-sm flex-shrink-0"
            style={{ backgroundColor: item.color }}
          />
          <span className="text-xs text-gray-600 whitespace-nowrap">{item.label}</span>
        </div>
      ))}
    </div>
  );
}
