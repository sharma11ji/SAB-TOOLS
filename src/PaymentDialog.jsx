import React, {useEffect, useRef} from 'react';
export default function PaymentDialog({title, children, onClose, busy}) {
 const ref=useRef(null);
 useEffect(()=>{const previous=document.activeElement;const dialog=ref.current;dialog.showModal();return()=>{dialog.close();previous?.focus();}},[]);
 return <dialog ref={ref} className="payment-dialog" aria-labelledby="payment-dialog-title" onCancel={event=>{event.preventDefault();if(!busy)onClose();}}><h2 id="payment-dialog-title">{title}</h2>{children}<button className="secondary wide" disabled={busy} onClick={onClose}>Cancel</button></dialog>;
}
