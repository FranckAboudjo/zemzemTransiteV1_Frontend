// Modal.jsx - Structure de base pour nos modaux
const Modal = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white w-full max-w-md rounded-[32px] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="p-8 border-b border-slate-50 flex justify-between items-center">
          <h3 className="text-lg font-black text-slate-900 uppercase tracking-tighter">
            {title}
          </h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-red-500 transition-colors"
          >
            ✕
          </button>
        </div>
        <div className="p-8">{children}</div>
      </div>
    </div>
  );
};

export default Modal;
