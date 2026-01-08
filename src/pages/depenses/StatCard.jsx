// StatCard.jsx - Pour les indicateurs clés (KPI)
const StatCard = ({
  label,
  value,
  subValue,
  color = "text-slate-900",
  icon: Icon,
}) => (
  <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col gap-4">
    <div className="flex justify-between items-start">
      <div
        className={`p-3 rounded-2xl ${
          color === "text-red-500" ? "bg-red-50" : "bg-slate-50"
        }`}
      >
        <Icon size={20} className={color} />
      </div>
      <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
        {label}
      </span>
    </div>
    <div>
      <h3 className={`text-2xl font-black tracking-tight ${color}`}>{value}</h3>
      {subValue && (
        <p className="text-xs font-bold text-slate-400 mt-1">{subValue}</p>
      )}
    </div>
  </div>
);

export default StatCard;
