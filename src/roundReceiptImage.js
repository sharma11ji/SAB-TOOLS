export function roundReceiptImage(receipt) {
 const canvas=document.createElement('canvas'),ctx=canvas.getContext('2d');
 const width=540,ink='#322719',teal='#397365',muted='#82745e';
 ctx.font='bold 24px sans-serif';
 const wrap=(text,maxWidth)=>{const lines=[];let line='';for(const char of text){if(ctx.measureText(line+char).width>maxWidth&&line){lines.push(line);line=char}else line+=char}if(line)lines.push(line);return lines};
 const nameLines=wrap(receipt.storeName||'Round wood receipt',460);
 ctx.font='14px sans-serif';
 const customerLines=[receipt.customerName&&`Customer: ${receipt.customerName}`,receipt.customerAddress&&`Address: ${receipt.customerAddress}`,receipt.customerPhone&&`Phone: ${receipt.customerPhone}`].filter(Boolean).flatMap(value=>value.split('\n').flatMap(line=>wrap(line,484)));
 const height=450+customerLines.length*22+(customerLines.length?14:0)+nameLines.length*31+receipt.rows.length*46+(receipt.rate===null?0:92);
 canvas.width=width*2;canvas.height=height*2;ctx.scale(2,2);
 ctx.fillStyle='#fffaf2';ctx.fillRect(0,0,width,height);
 ctx.fillStyle='#e4efea';ctx.fillRect(0,0,width,28);
 const text=(value,x,y,size=16,color=ink,bold=false,align='left',maxWidth)=>{ctx.font=`${bold?'bold ':''}${size}px sans-serif`;ctx.fillStyle=color;ctx.textAlign=align;if(maxWidth){while(ctx.measureText(String(value)).width>maxWidth&&size>7){size-=0.5;ctx.font=`${bold?'bold ':''}${size}px sans-serif`;}}ctx.fillText(String(value),x,y)};
 let y=66;for(const line of nameLines){text(line,270,y,24,teal,true,'center');y+=31}
 if(receipt.storeName){text('ROUND WOOD RECEIPT',270,y+4,13,muted,false,'center');y+=30}
 text(new Date(receipt.date).toLocaleString('en-IN',{dateStyle:'medium',timeStyle:'short'}),270,y+5,13,muted,false,'center');y+=36;
 for(const line of customerLines){text(line,28,y,14);y+=22}if(customerLines.length)y+=14;
 const rule=()=>{ctx.strokeStyle='#d9d5c6';ctx.beginPath();ctx.moveTo(28,y);ctx.lineTo(512,y);ctx.stroke()};rule();y+=26;
 text(`${receipt.unit}  ·  Length ${receipt.lengthUnit} / Girth ${receipt.girthUnit}`,28,y,14,teal);y+=23;
 ctx.fillStyle='#e4efea';ctx.fillRect(28,y,484,38);
 const cols=[42,118,225,322,495];const headers=['No.',`Length (${receipt.lengthUnit})`,`Girth (${receipt.girthUnit})`,'Qty',receipt.unit];
 headers.forEach((h,i)=>text(h,cols[i],y+24,12,teal,true,i===4?'right':i===0?'left':'center'));y+=38;
 for(const row of receipt.rows){ctx.fillStyle=row.number%2?'#fffaf2':'#f5f1ea';ctx.fillRect(28,y,484,46);[row.number,row.length,row.girth,row.pieces,row.volume.toFixed(3)].forEach((v,i)=>text(v,cols[i],y+29,15,ink,i===4,i===4?'right':i===0?'left':'center',[30,86,118,66,130][i]));y+=46}
 y+=24;rule();y+=32;text('Total wood',28,y,15);text(`${receipt.pieces} pieces`,512,y,17,teal,true,'right',280);y+=34;text(`Total ${receipt.unit}`,28,y,15);text(receipt.volume.toFixed(3),512,y,21,teal,true,'right',280);
 if(receipt.rate!==null){y+=36;text(`Rate per ${receipt.unit}`,28,y,15);text(`₹${receipt.rate.toLocaleString('en-IN',{maximumFractionDigits:8})}`,512,y,17,ink,false,'right',280);y+=22;ctx.fillStyle='#e4efea';ctx.fillRect(28,y,484,54);text('TOTAL AMOUNT',42,y+33,13,teal,true);text(receipt.amount.toLocaleString('en-IN',{style:'currency',currency:'INR'}),496,y+35,25,teal,true,'right',290);y+=54}
 y+=38;text('Quarter-girth method · Girth is circumference',270,y,11,muted,false,'center');y+=19;text('Totals use full precision before rounding.',270,y,11,muted,false,'center');y+=28;text('SAB TOOLS',270,y,12,teal,true,'center');
 return canvas;
}
export const canvasPng=canvas=>new Promise((resolve,reject)=>canvas.toBlob(blob=>blob?resolve(blob):reject(new Error('Could not create image.')),'image/png'));
