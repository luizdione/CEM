export interface NavItem {
  id: string;
  label: string;
  icon: string;
}

export interface NavGroup {
  group: string;
  items: NavItem[];
}

export function Sidebar({
  groups,
  active,
  onSelect,
  version,
}: {
  groups: NavGroup[];
  active: string;
  onSelect: (id: string) => void;
  version: string;
}): JSX.Element {
  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="brand-badge">C</div>
        <div>
          <div className="brand-title">CEM</div>
          <div className="brand-sub">Environment Manager</div>
        </div>
      </div>

      {groups.map((group) => (
        <div key={group.group}>
          <div className="nav-group-label">{group.group}</div>
          {group.items.map((item) => (
            <button
              key={item.id}
              className={`nav-item${active === item.id ? ' active' : ''}`}
              onClick={() => onSelect(item.id)}
            >
              <span className="nav-icon">{item.icon}</span>
              {item.label}
            </button>
          ))}
        </div>
      ))}

      <div className="spacer" />
      <div className="brand-sub" style={{ padding: '12px 8px 0' }}>
        v{version} · read-only &amp; local
      </div>
    </aside>
  );
}
