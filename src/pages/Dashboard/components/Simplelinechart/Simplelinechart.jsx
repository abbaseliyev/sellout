function SimpleLineChart({ data, labels, color = "#6fae8a" }) {
  const defaultData = [12, 19, 14, 22, 18, 25, 20];
  const defaultLabels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  const chartData = data && data.length ? data : defaultData;
  const chartLabels = labels && labels.length ? labels : defaultLabels;

  const max = Math.max(...chartData, 1);
  const width = 560;
  const height = 200;
  const padding = 28;
  const chartW = width - padding * 2;
  const chartH = height - padding * 2;

  const points = chartData.map((v, i) => {
    const x = padding + (i / Math.max(chartData.length - 1, 1)) * chartW;
    const y = padding + chartH - (max > 0 ? (v / max) * chartH : 0);
    return [x, y];
  });

  const linePath = points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${p[0]} ${p[1]}`)
    .join(" ");

  const areaPath =
    `M ${points[0][0]} ${padding + chartH} ` +
    points.map((p) => `L ${p[0]} ${p[1]}`).join(" ") +
    ` L ${points[points.length - 1][0]} ${padding + chartH} Z`;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="simple-chart-svg">
      {[0, 0.25, 0.5, 0.75, 1].map((t) => (
        <line
          key={t}
          x1={padding}
          x2={width - padding}
          y1={padding + chartH * (1 - t)}
          y2={padding + chartH * (1 - t)}
          stroke="#f0f0f0"
          strokeWidth="1"
        />
      ))}
      <path d={areaPath} fill={color} opacity="0.12" stroke="none" />
      <path d={linePath} fill="none" stroke={color} strokeWidth="2.5" />
      {points.map((p, i) => (
        <circle key={i} cx={p[0]} cy={p[1]} r="3.5" fill={color} />
      ))}
      {chartLabels.map((label, i) => {
        const x = points[i] ? points[i][0] : 0;
        return (
          <text
            key={label}
            x={x}
            y={height - 6}
            fontSize="11"
            textAnchor="middle"
            fill="#9ca3af"
          >
            {label}
          </text>
        );
      })}
    </svg>
  );
}

export default SimpleLineChart;