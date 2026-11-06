function GroupedBarChart({
  internalData,
  externalData,
  labels,
  internalColor = "#6fae64",
  externalColor = "#6a5bd1",
}) {
  const defaultInternal = [22500, 22000, 17000, 10000, 22800, 21500, 21000];
  const defaultExternal = [15000, 15500, 10000, 9000, 16000, 15500, 14500];
  const defaultLabels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  const dataA = internalData && internalData.length ? internalData : defaultInternal;
  const dataB = externalData && externalData.length ? externalData : defaultExternal;
  const chartLabels = labels && labels.length ? labels : defaultLabels;

  const max = Math.max(...dataA, ...dataB, 1);
  const width = 460;
  const height = 220;
  const padding = 32;
  const chartW = width - padding * 2;
  const chartH = height - padding * 2;

  const groupGap = 18;
  const groupWidth = (chartW - groupGap * (dataA.length - 1)) / dataA.length;
  const barGap = 4;
  const barWidth = (groupWidth - barGap) / 2;

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

      {dataA.map((v, i) => {
        const x = padding + i * (groupWidth + groupGap);
        const hA = max > 0 ? (v / max) * chartH : 0;
        const hB = max > 0 ? (dataB[i] / max) * chartH : 0;
        return (
          <g key={i}>
            <rect
              x={x}
              y={padding + chartH - hA}
              width={barWidth}
              height={Math.max(hA, 1)}
              rx="3"
              fill={internalColor}
            />
            <rect
              x={x + barWidth + barGap}
              y={padding + chartH - hB}
              width={barWidth}
              height={Math.max(hB, 1)}
              rx="3"
              fill={externalColor}
            />
            <text
              x={x + groupWidth / 2}
              y={height - 8}
              fontSize="11"
              textAnchor="middle"
              fill="#9ca3af"
            >
              {chartLabels[i]}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

export default GroupedBarChart;