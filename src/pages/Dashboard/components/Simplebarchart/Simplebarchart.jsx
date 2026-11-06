function SimpleBarChart() {
  const data = [23000, 23000, 17000, 12000, 23000, 23000, 23000];

  const labels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  const max = 30000;

  const width = 560;
  const height = 200;

  const paddingLeft = 55;
  const paddingRight = 28;
  const paddingTop = 28;
  const paddingBottom = 28;

  const chartW = width - paddingLeft - paddingRight;
  const chartH = height - paddingTop - paddingBottom;

  const barGap = 14;  

  const barWidth =
    (chartW - barGap * (data.length - 1)) / data.length;

  0, 7500, 15000, 22500, 30000
  const yAxisSteps = [0, 0.25, 0.5, 0.75, 1];

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="simple-chart-svg"
      style={{ width: "90%", height: "auto" }}
    >
      {/* Grid xətləri */}
      {yAxisSteps.map((t) => (
        <line
          key={`grid-${t}`}
          x1={paddingLeft}
          x2={width - paddingRight}
          y1={paddingTop + chartH * (1 - t)}
          y2={paddingTop + chartH * (1 - t)}
          stroke="#f0f0f0"
          strokeWidth="1"
        />
      ))}

      {/* Y oxu rəqəmləri */}
      {yAxisSteps.map((t) => (
        <text
          key={`y-${t}`}
          x={paddingLeft - 8}
          y={paddingTop + chartH * (1 - t) + 4}
          fontSize="11"
          textAnchor="end"
          fill="#9ca3af"
        >
          {Math.round(max * t)}
        </text>
      ))}

      {/* Sütunlar */}
      {data.map((value, index) => {
        const barH = (value / max) * chartH;

        const x =
          paddingLeft + index * (barWidth + barGap);

        const y =
          paddingTop + chartH - barH;

        return (
          <rect
            key={index}
            x={x}
            y={y}
            width={barWidth}
            height={barH}
            rx="4"
            fill="#7fb56e"
          />
        );
      })}

      {/* X oxu */}
      {labels.map((label, index) => {
        const x =
          paddingLeft +
          index * (barWidth + barGap) +
          barWidth / 2;

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

export default SimpleBarChart;
