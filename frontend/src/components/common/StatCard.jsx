export default function StatCard({ label, value, tone = "default", icon: Icon, detail }) {
  return (
    <div className={`stat-card stat-${tone}`}>
      <div className="stat-card-top">
        <span>{label}</span>
        {Icon && <span className="stat-icon"><Icon size={18} /></span>}
      </div>
      <strong>{value}</strong>
      {detail && <small>{detail}</small>}
    </div>
  );
}
