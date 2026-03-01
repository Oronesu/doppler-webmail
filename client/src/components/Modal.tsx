import React from "react";
import ReactDOM from "react-dom";

interface ModalProps {
  children: React.ReactNode;
}

const Modal = ({ children }: ModalProps) => {
  return ReactDOM.createPortal(
    <div className="modal-overlay">
      <div className="modal-box">
        {children}
      </div>
    </div>,
    document.body
  );
};

export default Modal;
