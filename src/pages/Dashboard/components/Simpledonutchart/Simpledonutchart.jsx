function SimpleDonutChart({ segments }) {
  const size = 220;
  const stroke = 28;
  const svgWidth = 460;
  const svgHeight = 260;
  const radius = (size - stroke) / 2;
  const outerR = radius + stroke / 2;
  const circumference = 2 * Math.PI * radius;

  const donutCx = svgWidth / 2;
  const donutCy = svgHeight / 2;

  const defaultSegments = [
    { name: "Internal", pct: 55, color: "#008028" },
    { name: "External", pct: 45, color: "#a7a8ab" },

  ];

  const data = segments && segments.length ? segments : defaultSegments;

  if (!data.length) {
    return (
      <svg
        width={svgWidth}
        height={svgHeight}
        viewBox={`0 0 ${svgWidth} ${svgHeight}`}
      >
        <circle
          cx={donutCx}
          cy={donutCy}
          r={radius}
          fill="none"
          stroke="#f0f0f0"
          strokeWidth={stroke}
        />
      </svg>
    );
  }

  let cumPct = 0;
  const withAngles = data.map((s) => {
    const midPct = cumPct + s.pct / 2;
    cumPct += s.pct;
    const rad = (midPct / 100) * 360 * (Math.PI / 180);
    return { ...s, rad };
  });

  let offsetAcc = 0;

  return (
    <svg
      width={svgWidth}
      height={svgHeight}
      viewBox={`0 0 ${svgWidth} ${svgHeight}`}
      className="donut-chart-svg"
    >
      <g transform={`rotate(-90 ${donutCx} ${donutCy})`}>
        {data.map((s) => {
          const segLength = (s.pct / 100) * circumference;
          const dasharray = `${segLength} ${circumference - segLength}`;
          const dashoffset = -((offsetAcc / 100) * circumference);
          offsetAcc += s.pct;
          return (
            <circle
              key={s.name}
              cx={donutCx}
              cy={donutCy}
              r={radius}
              fill="none"
              stroke={s.color}
              strokeWidth={stroke}
              strokeDasharray={dasharray}
              strokeDashoffset={dashoffset}
            />
          );
        })}
      </g>

      {withAngles.map((s) => {
        const sin = Math.sin(s.rad);
        const cos = Math.cos(s.rad);
        const p1x = donutCx + sin * (outerR + 4);
        const p1y = donutCy - cos * (outerR + 4);
        const p2x = donutCx + sin * (outerR + 20);
        const p2y = donutCy - cos * (outerR + 20);
        const isRight = sin >= 0;
        const p3x = isRight ? p2x + 24 : p2x - 24;

        return (
          <g key={s.name}>
            <polyline
              points={`${p1x},${p1y} ${p2x},${p2y} ${p3x},${p2y}`}
              fill="none"
              stroke="#c9ccd1"
              strokeWidth="1"
            />
            <text
              x={isRight ? p3x + 4 : p3x - 4}
              y={p2y}
              fontSize="12"
              fill="#5a5f6a"
              textAnchor={isRight ? "start" : "end"}
              dominantBaseline="middle"
            >
              {s.pct.toFixed(1)}%
            </text>
          </g>
        );
      })}
    </svg>
  );
}

export default SimpleDonutChart;