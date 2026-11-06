function DualLineChart({
  internalData,
  externalData,
  labels,
  internalColor = "#6fae64",
  externalColor = "#8b5cf6",
}) {
  const defaultInternal = [40000, 80000, 65000, 45000, 105000, 85000, 120000];
  const defaultExternal = [60000, 118000, 95000, 113000, 132000, 88000, 148000];
  const defaultLabels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  const dataA = internalData && internalData.length ? internalData : defaultInternal;
  const dataB = externalData && externalData.length ? externalData : defaultExternal;
  const chartLabels = labels && labels.length ? labels : defaultLabels;

  const max = Math.max(...dataA, ...dataB, 1);
  const width = 560;
  const height = 220;
  const padding = 32;
  const chartW = width - padding * 2;
  const chartH = height - padding * 2;

  const toPoints = (arr) =>
    arr.map((v, i) => {
      const x = padding + (i / Math.max(arr.length - 1, 1)) * chartW;
      const y = padding + chartH - (max > 0 ? (v / max) * chartH : 0);
      return [x, y];
    });

  const pointsA = toPoints(dataA);
  const pointsB = toPoints(dataB);

  const toPath = (pts) =>
    pts.map((p, i) => `${i === 0 ? "M" : "L"} ${p[0]} ${p[1]}`).join(" ");

  const yTicks = [0, 0.25, 0.5, 0.75, 1];

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="simple-chart-svg">
      {yTicks.map((t) => (
        <g key={t}>
          <line
            x1={padding}
            x2={width - padding}
            y1={padding + chartH * (1 - t)}
            y2={padding + chartH * (1 - t)}
            stroke="#f0f0f0"
            strokeWidth="1"
          />
          <text
            x={padding - 8}
            y={padding + chartH * (1 - t) + 4}
            fontSize="10"
            textAnchor="end"
            fill="#9ca3af"
          >
            {Math.round(max * t)}
          </text>
        </g>
      ))}

      <path d={toPath(pointsB)} fill="none" stroke={externalColor} strokeWidth="2.5" />
      <path d={toPath(pointsA)} fill="none" stroke={internalColor} strokeWidth="2.5" />

      {pointsA.map((p, i) => (
        <circle key={`a-${i}`} cx={p[0]} cy={p[1]} r="3.5" fill={internalColor} />
      ))}
      {pointsB.map((p, i) => (
        <circle key={`b-${i}`} cx={p[0]} cy={p[1]} r="3.5" fill={externalColor} />
      ))}

      {chartLabels.map((label, i) => (
        <text
          key={label}
          x={pointsA[i] ? pointsA[i][0] : 0}
          y={height - 8}
          fontSize="11"
          textAnchor="middle"
          fill="#9ca3af"
        >
          {label}
        </text>
      ))}
    </svg>
  );
}

export default DualLineChart;