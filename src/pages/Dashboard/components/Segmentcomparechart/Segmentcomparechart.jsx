function SegmentCompareChart({
  segments,
  internalColor = "#6fae64",
  externalColor = "#3730d6",
}) {
  const defaultSegments = [
    { name: "Premium", internal: 50, external: 12 },
    { name: "Orta", internal: 32, external: 18 },
    { name: "Ekonomik", internal: 45, external: 14 },
  ];

  const data = segments && segments.length ? segments : defaultSegments;
  const maxVal = Math.max(
    ...data.map((s) => Math.max(s.internal, s.external)),
    1
  );
  const axisMax = Math.ceil(maxVal / 15) * 15 || 55;
  const axisSteps = [0, 0.25, 0.5, 0.75, 1].map((t) => Math.round(axisMax * t));
  
  return (
    <div className="segment-compare">
      {data.map((s) => (
        <div className="segment-compare-row" key={s.name}>
          <div className="segment-name">{s.name}</div>
          <div className="segment-compare-bars">
            <div className="segment-bar-track">
              <div
                className="segment-bar-fill"
                style={{
                  width: `${(s.internal / axisMax) * 100}%`,
                  background: internalColor,
                }}
              />
            </div>
            <div className="segment-bar-track">
              <div
                className="segment-bar-fill"
                style={{
                  width: `${(s.external / axisMax) * 100}%`,
                  background: externalColor,
                }}
              />
            </div>
          </div>
        </div>
      ))}
      <div className="segment-axis">
        {axisSteps.map((v) => (
          <span key={v}>{v}%</span>
        ))}
      </div>
    </div>
  );
}

export default SegmentCompareChart;