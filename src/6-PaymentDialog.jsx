import React, {useEffect, useRef} from 'react';
import {Dialog,Button} from './ui';
export default function PaymentDialog({title, children, onClose, busy}) {
 const ref=useRef(null);
 useEffect(()=>{const previous=document.activeElement;const dialog=ref.current;dialog.showModal();return()=>{dialog.close();previous?.focus();}},[]);
 return <Dialog ref={ref} className="payment-dialog" aria-labelledby="payment-dialog-title" onCancel={event=>{event.preventDefault();if(!busy)onClose();}}><h2 id="payment-dialog-title">{title}</h2>{children}<Button block style={{marginTop:'var(--space-3)'}} disabled={busy} onClick={onClose}>Cancel</Button></Dialog>;
}
