import React from "react";

const StatusBadge = ({ status }) => {
  const styles = {
    PENDING: "bg-slate-100 text-slate-600",
    COMPLETE: "bg-emerald-100 text-emerald-600",
    "PARTIALLY RECIEVED": "bg-indigo-100 text-indigo-600",
  };

  return (
    <span
      className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
        styles[status] || styles.PENDING
      }`}
    >
      {status}
    </span>
  );
};

export default StatusBadge;
