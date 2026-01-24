import { useMemo } from "react";

interface GaugeChartProps {
  value: number;
  min?: number;
  max?: number;
  thresholds?: {
    low: number;
    medium: number;
    high: number;
  };
  label?: string;
  unit?: string;
  size?: number;
  className?: string;
}

export function GaugeChart({
  value,
  min = 0,
  max = 300,
  thresholds = { low: 70, medium: 140, high: 180 },
  label = "Valeur",
  unit = "mg/dL",
  size = 200,
  className = "",
}: GaugeChartProps) {
  const percentage = useMemo(() => {
    return ((value - min) / (max - min)) * 100;
  }, [value, min, max]);

  const color = useMemo(() => {
    if (value < thresholds.low || value > thresholds.high) {
      return "#e74c3c"; // Rouge - Critique
    } else if (value >= thresholds.medium && value <= thresholds.high) {
      return "#f39c12"; // Orange - Avertissement
    }
    return "#27ae60"; // Vert - Normal
  }, [value, thresholds]);

  const angle = useMemo(() => {
    return (percentage / 100) * 180 - 90; // -90 à 90 degrés
  }, [percentage]);

  const radius = size / 2 - 20;
  const centerX = size / 2;
  const centerY = size / 2; // Centre du cercle complet, mais on n'affiche que le demi-cercle supérieur

  // Calcul des points pour l'arc
  const getArcPath = (startAngle: number, endAngle: number, innerRadius: number, outerRadius: number) => {
    const start = {
      x: centerX + outerRadius * Math.cos((startAngle * Math.PI) / 180),
      y: centerY + outerRadius * Math.sin((startAngle * Math.PI) / 180),
    };
    const end = {
      x: centerX + outerRadius * Math.cos((endAngle * Math.PI) / 180),
      y: centerY + outerRadius * Math.sin((endAngle * Math.PI) / 180),
    };
    const largeArcFlag = endAngle - startAngle > 180 ? 1 : 0;

    return `M ${start.x} ${start.y} A ${outerRadius} ${outerRadius} 0 ${largeArcFlag} 1 ${end.x} ${end.y}`;
  };

  // Zones colorées
  const lowZone = getArcPath(-90, -90 + ((thresholds.low - min) / (max - min)) * 180, radius - 15, radius);
  const normalZone = getArcPath(
    -90 + ((thresholds.low - min) / (max - min)) * 180,
    -90 + ((thresholds.medium - min) / (max - min)) * 180,
    radius - 15,
    radius
  );
  const warningZone = getArcPath(
    -90 + ((thresholds.medium - min) / (max - min)) * 180,
    -90 + ((thresholds.high - min) / (max - min)) * 180,
    radius - 15,
    radius
  );
  const criticalZone = getArcPath(
    -90 + ((thresholds.high - min) / (max - min)) * 180,
    90,
    radius - 15,
    radius
  );

  // Aiguille
  const needleLength = radius - 10;
  const needleX = centerX + needleLength * Math.cos((angle * Math.PI) / 180);
  const needleY = centerY + needleLength * Math.sin((angle * Math.PI) / 180);

  return (
    <div className={`flex flex-col items-center ${className}`}>
      <svg width={size} height={size / 2 + 30} viewBox={`0 0 ${size} ${size / 2 + 30}`}>
        {/* Zones de couleur */}
        <path d={lowZone} fill="#e74c3c" opacity={0.2} />
        <path d={normalZone} fill="#27ae60" opacity={0.2} />
        <path d={warningZone} fill="#f39c12" opacity={0.2} />
        <path d={criticalZone} fill="#e74c3c" opacity={0.2} />

        {/* Arc principal */}
        <path
          d={getArcPath(-90, 90, radius - 15, radius)}
          fill="none"
          stroke="#e9ecef"
          strokeWidth="2"
        />

        {/* Aiguille */}
        <line
          x1={centerX}
          y1={centerY}
          x2={needleX}
          y2={needleY}
          stroke={color}
          strokeWidth="3"
          strokeLinecap="round"
        />
        <circle cx={centerX} cy={centerY} r="8" fill={color} />

        {/* Marqueurs */}
        {[min, thresholds.low, thresholds.medium, thresholds.high, max].map((mark, index) => {
          const markAngle = -90 + ((mark - min) / (max - min)) * 180;
          const markX = centerX + (radius + 5) * Math.cos((markAngle * Math.PI) / 180);
          const markY = centerY + (radius + 5) * Math.sin((markAngle * Math.PI) / 180);
          return (
            <g key={index}>
              <line
                x1={centerX + (radius - 15) * Math.cos((markAngle * Math.PI) / 180)}
                y1={centerY + (radius - 15) * Math.sin((markAngle * Math.PI) / 180)}
                x2={centerX + radius * Math.cos((markAngle * Math.PI) / 180)}
                y2={centerY + radius * Math.sin((markAngle * Math.PI) / 180)}
                stroke="#95a5a6"
                strokeWidth="1"
              />
              <text
                x={markX}
                y={markY}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize="10"
                fill="#95a5a6"
              >
                {mark}
              </text>
            </g>
          );
        })}
      </svg>
      <div className="mt-4 text-center">
        <div className="text-3xl font-bold" style={{ color }}>
          {value.toFixed(1)}
        </div>
        <div className="text-sm text-muted-foreground mt-1">
          {label} ({unit})
        </div>
      </div>
    </div>
  );
}
