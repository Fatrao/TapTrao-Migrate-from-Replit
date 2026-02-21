interface TabBarProps {
  tabs: string[];
  activeTab: string;
  onChange: (tab: string) => void;
}

export function TabBar({ tabs, activeTab, onChange }: TabBarProps) {
  return (
    <div
      style={{
        background: "var(--s0)",
        borderBottom: "1px solid var(--s5)",
        padding: "0 28px",
        display: "flex",
        alignItems: "center",
      }}
      data-testid="tab-bar"
    >
      {tabs.map((tab) => {
        const isActive = tab === activeTab;
        return (
          <button
            key={tab}
            onClick={() => onChange(tab)}
            style={{
              padding: "10px 16px",
              fontSize: 12,
              fontWeight: 600,
              cursor: "pointer",
              background: "none",
              border: "none",
              borderBottom: isActive ? "2px solid var(--blue)" : "2px solid transparent",
              marginBottom: isActive ? -1 : 0,
              color: isActive ? "var(--t1)" : "var(--t3)",
              whiteSpace: "nowrap",
            }}
            data-testid={`tab-${tab.toLowerCase().replace(/\s+/g, "-")}`}
          >
            {tab}
          </button>
        );
      })}
    </div>
  );
}
