import React,{useId} from "react";
import "./tokens.css";

export const cx=(...parts)=>parts.filter(Boolean).join(" ");

export function Button({variant="secondary",block,small,className,type="button",...props}){
 return <button type={type} className={cx("ui-btn","ui-btn--"+variant,block&&"ui-btn--block",small&&"ui-btn--sm",className)} {...props}/>;
}
export const PrimaryButton=props=><Button variant="primary" {...props}/>;
export const SecondaryButton=props=><Button variant="secondary" {...props}/>;
export function IconButton({label,className,type="button",children,...props}){
 return <button type={type} aria-label={label} className={cx("ui-icon-btn",className)} {...props}>{children}</button>;
}
export function ButtonRow({stack,children,className}){return <div className={cx("ui-btn-row",stack&&"ui-btn-row--stack",className)}>{children}</div>}

export function Card({as:Tag="section",variant,className,...props}){
 return <Tag className={cx("ui-card",variant&&"ui-card--"+variant,className)} {...props}/>;
}
export function ToolCard({className,...props}){return <button type="button" className={cx("ui-card","ui-card--tool",className)} {...props}/>}

export function PageHeader({title,onBack,backLabel="Back",badge,subtitle,children,className}){
 return <div className={cx("ui-page-header",className)}>
  {onBack&&<button type="button" className="ui-back" onClick={onBack}><span aria-hidden="true">‹</span> {backLabel}</button>}
  <h1>{title}{badge&&<span className="ui-badge">{badge}</span>}</h1>
  {subtitle&&<p className="ui-page-sub">{subtitle}</p>}
  {children}
 </div>;
}
export function SectionHeader({title,aside,className}){
 return <div className={cx("ui-section-header",className)}><h2>{title}</h2>{aside!=null&&<span className="ui-aside">{aside}</span>}</div>;
}

// One input for every calculator: label above, optional unit inside, hint and error below.
export const InputField=React.forwardRef(function InputField({label,unit,hint,error,multiline,select,className,children,id,...props},ref){
 const auto=useId(),fieldId=id||auto,msgId=fieldId+"-msg";
 const describedBy=error||hint?msgId:undefined;
 const common={ref,id:fieldId,"aria-describedby":describedBy,"aria-invalid":error?true:undefined,...props};
 let control;
 if(select)control=<select className="ui-input" {...common}>{children}</select>;
 else if(multiline)control=<textarea className="ui-input ui-input--multiline" {...common}/>;
 else if(unit)control=<span className="ui-control"><input className="ui-input" {...common}/><span className="ui-unit">{unit}</span></span>;
 else control=<input className="ui-input" {...common}/>;
 return <div className={cx("ui-field",error&&"ui-field--error",className)}>
  {label&&<label className="ui-label" htmlFor={fieldId}>{label}</label>}
  {control}
  {error?<span id={msgId} className="ui-field-error" role="alert">{error}</span>:hint?<span id={msgId} className="ui-hint">{hint}</span>:null}
 </div>;
});
export function FieldGrid({cols=2,className,children}){return <div className={cx("ui-fields",cols===3&&"ui-fields--3",cols===1&&"ui-fields--1",className)}>{children}</div>}

export function Segmented({options,value,onChange,label}){
 return <div className="ui-segmented" role="group" aria-label={label}>{options.map(([v,text])=><button key={v} type="button" aria-pressed={value===v} onClick={()=>onChange(v)}>{text}</button>)}</div>;
}

// items: [{label, value, unit}]
export function ResultCard({items,tone,className,...props}){
 return <div className={cx("ui-result",items.length>1&&"ui-result--2",tone&&"ui-result--"+tone,className)} role="group" {...props}>
  {items.map(({label,value,unit})=><div className="ui-result-item" key={label}><span className="ui-result-label">{label}</span><strong className="ui-result-value">{value}{unit&&<span className="ui-result-unit">{unit}</span>}</strong></div>)}
 </div>;
}

export function EmptyState({title,children,image,className}){
 return <div className={cx("ui-empty",className)}>{image&&<img src={image} alt=""/>}<b>{title}</b>{children&&<span>{children}</span>}</div>;
}

export const Dialog=React.forwardRef(function Dialog({className,...props},ref){return <dialog ref={ref} className={cx("ui-dialog",className)} {...props}/>});
