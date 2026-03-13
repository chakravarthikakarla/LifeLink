import React from "react";
import { X } from "lucide-react";

const Modal = ({ isOpen, onClose, onConfirm, title, message, type = "confirm" }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-md transition-opacity">
            <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-white/20 transform transition-all scale-100">
                <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100">
                    <h3 className="text-xl font-bold text-gray-900">{title}</h3>
                    <button
                        onClick={onClose}
                        className="p-1 rounded-full hover:bg-gray-100 transition-colors text-gray-400"
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6">
                    <p className="text-gray-600 leading-relaxed">
                        {message}
                    </p>
                </div>

                <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
                    {type === "confirm" ? (
                        <>
                            <button
                                onClick={onClose}
                                className="px-5 py-2 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-200 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={onConfirm}
                                className="px-5 py-2 rounded-lg text-sm font-semibold bg-black text-white hover:opacity-90 transition-opacity"
                            >
                                Confirm
                            </button>
                        </>
                    ) : (
                        <button
                            onClick={onClose}
                            className="px-5 py-2 rounded-lg text-sm font-semibold bg-black text-white hover:opacity-90 transition-opacity"
                        >
                            Close
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Modal;
