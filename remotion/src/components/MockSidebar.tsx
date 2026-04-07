import { useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";

interface MockSidebarProps {
  activeItem: string;
  items?: string[];
}

const defaultItems = ["Dashboard", "Students", "Academic Years", "Fee Setup", "Teachers", "Settings", "Student Progress"];

export const MockSidebar: React.FC<MockSidebarProps> = ({ activeItem, items = defaultItems }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const slideIn = interpolate(spring({ frame, fps, config: { damping: 25 } }), [0, 1], [-240, 0]);

  return (
    <div
      style={{
        width: 240,
        height: "100%",
        background: "linear-gradient(180deg, #1e1b4b 0%, #1a1744 100%)",
        borderRight: "1px solid rgba(255,255,255,0.08)",
        padding: "24px 0",
        transform: `translateX(${slideIn}px)`,
        flexShrink: 0,
      }}
    >
      {/* Logo */}
      <div style={{ padding: "0 20px 28px", display: "flex", alignItems: "center", gap: 10 }}>
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: 8,
            background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <span style={{ color: "#fff", fontWeight: 800, fontSize: 14, fontFamily: "sans-serif" }}>E</span>
        </div>
        <span style={{ color: "#fff", fontWeight: 700, fontSize: 18, fontFamily: "sans-serif" }}>EdZen AI</span>
      </div>
      {/* Menu items */}
      {items.map((item, i) => {
        const isActive = item === activeItem;
        const itemDelay = 5 + i * 3;
        const itemOpacity = interpolate(frame, [itemDelay, itemDelay + 10], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });
        return (
          <div
            key={item}
            style={{
              padding: "10px 20px",
              margin: "2px 10px",
              borderRadius: 10,
              background: isActive ? "rgba(99, 102, 241, 0.25)" : "transparent",
              color: isActive ? "#a5b4fc" : "rgba(255,255,255,0.5)",
              fontSize: 14,
              fontWeight: isActive ? 600 : 400,
              fontFamily: "sans-serif",
              opacity: itemOpacity,
              borderLeft: isActive ? "3px solid #6366f1" : "3px solid transparent",
            }}
          >
            {item}
          </div>
        );
      })}
    </div>
  );
};
