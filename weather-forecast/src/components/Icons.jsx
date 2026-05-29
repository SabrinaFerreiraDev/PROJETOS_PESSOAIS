const iconProps = {
  width: 22,
  height: 22,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  "aria-hidden": "true",
};

export function Icon({ name, className = "" }) {
  const icons = {
    search: (
      <svg {...iconProps} className={className}>
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-3.4-3.4" />
      </svg>
    ),
    mic: (
      <svg {...iconProps} className={className}>
        <path d="M12 14a4 4 0 0 0 4-4V6a4 4 0 0 0-8 0v4a4 4 0 0 0 4 4Z" />
        <path d="M19 10a7 7 0 0 1-14 0" />
        <path d="M12 17v4" />
        <path d="M8 21h8" />
      </svg>
    ),
    location: (
      <svg {...iconProps} className={className}>
        <path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" />
        <circle cx="12" cy="10" r="3" />
      </svg>
    ),
    sun: (
      <svg {...iconProps} className={className}>
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2" />
        <path d="M12 20v2" />
        <path d="m4.9 4.9 1.4 1.4" />
        <path d="m17.7 17.7 1.4 1.4" />
        <path d="M2 12h2" />
        <path d="M20 12h2" />
        <path d="m4.9 19.1 1.4-1.4" />
        <path d="m17.7 6.3 1.4-1.4" />
      </svg>
    ),
    moon: (
      <svg {...iconProps} className={className}>
        <path d="M21 13.3A8.5 8.5 0 1 1 10.7 3a7 7 0 0 0 10.3 10.3Z" />
      </svg>
    ),
    cloud: (
      <svg {...iconProps} className={className}>
        <path d="M17.5 19H8a5 5 0 1 1 .7-10A7 7 0 0 1 22 12a4 4 0 0 1-4.5 7Z" />
      </svg>
    ),
    rain: (
      <svg {...iconProps} className={className}>
        <path d="M17.5 15H8a5 5 0 1 1 .7-10A7 7 0 0 1 22 8a4 4 0 0 1-4.5 7Z" />
        <path d="M8 19v1" />
        <path d="M12 19v2" />
        <path d="M16 19v1" />
      </svg>
    ),
    storm: (
      <svg {...iconProps} className={className}>
        <path d="M17.5 15H8a5 5 0 1 1 .7-10A7 7 0 0 1 22 8a4 4 0 0 1-4.5 7Z" />
        <path d="m13 14-3 5h4l-2 4 5-7h-4l2-2Z" />
      </svg>
    ),
    snow: (
      <svg {...iconProps} className={className}>
        <path d="M17.5 15H8a5 5 0 1 1 .7-10A7 7 0 0 1 22 8a4 4 0 0 1-4.5 7Z" />
        <path d="M8 19h.01" />
        <path d="M12 21h.01" />
        <path d="M16 19h.01" />
      </svg>
    ),
    mist: (
      <svg {...iconProps} className={className}>
        <path d="M4 9h12" />
        <path d="M8 13h12" />
        <path d="M4 17h13" />
      </svg>
    ),
    wind: (
      <svg {...iconProps} className={className}>
        <path d="M3 8h12a3 3 0 1 0-3-3" />
        <path d="M4 14h15a3 3 0 1 1-3 3" />
        <path d="M3 20h8" />
      </svg>
    ),
    humidity: (
      <svg {...iconProps} className={className}>
        <path d="M12 21a7 7 0 0 0 7-7c0-4.5-7-12-7-12S5 9.5 5 14a7 7 0 0 0 7 7Z" />
      </svg>
    ),
    gauge: (
      <svg {...iconProps} className={className}>
        <path d="M12 15l3-3" />
        <path d="M3.3 14a9 9 0 1 1 17.4 0" />
        <path d="M5 19h14" />
      </svg>
    ),
    eye: (
      <svg {...iconProps} className={className}>
        <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z" />
        <circle cx="12" cy="12" r="3" />
      </svg>
    ),
    sunrise: (
      <svg {...iconProps} className={className}>
        <path d="M12 2v8" />
        <path d="m4.9 10.9 1.4-1.4" />
        <path d="m17.7 9.5 1.4 1.4" />
        <path d="M2 18h20" />
        <path d="M5 14a7 7 0 0 1 14 0" />
      </svg>
    ),
    sunset: (
      <svg {...iconProps} className={className}>
        <path d="M12 10V2" />
        <path d="m4.9 10.9 1.4-1.4" />
        <path d="m17.7 9.5 1.4 1.4" />
        <path d="M2 18h20" />
        <path d="M5 14a7 7 0 0 1 14 0" />
      </svg>
    ),
    umbrella: (
      <svg {...iconProps} className={className}>
        <path d="M22 12a10 10 0 0 0-20 0Z" />
        <path d="M12 12v7a3 3 0 0 0 6 0" />
      </svg>
    ),
    spark: (
      <svg {...iconProps} className={className}>
        <path d="M12 2l1.8 6.2L20 10l-6.2 1.8L12 18l-1.8-6.2L4 10l6.2-1.8Z" />
        <path d="M19 16l.8 2.2L22 19l-2.2.8L19 22l-.8-2.2L16 19l2.2-.8Z" />
      </svg>
    ),
  };

  return icons[name] || icons.sun;
}
