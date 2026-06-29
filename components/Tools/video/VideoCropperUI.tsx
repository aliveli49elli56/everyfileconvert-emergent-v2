'use client';
import { useState, useRef, useCallback } from 'react';
import { Upload, Download, Loader2 } from 'lucide-react';
interface Props { toolName?: string; onFileSelected?: (f: File) => void }
type Stage = 'idle'|'processing'|'done'|'error';
type Rect = { x:number; y:number; w:number; h:number };

export default function VideoCropperUI({ toolName, onFileSelected }: Props) {
  const [file,setFile]=useState<File|null>(null);
  const [objUrl,setObjUrl]=useState<string|null>(null);
  const [cropBox,setCropBox]=useState<Rect|null>(null);
  const [dragging,setDragging]=useState(false);
  const [dragSt,setDragSt]=useState({x:0,y:0});
  const [stage,setStage]=useState<Stage>('idle');
  const [progress,setProgress]=useState(0);
  const [stageMsg,setStageMsg]=useState('');
  const [resultUrl,setResultUrl]=useState<string|null>(null);
  const [error,setError]=useState<string|null>(null);
  const videoRef=useRef<HTMLVideoElement>(null);
  const containerRef=useRef<HTMLDivElement>(null);
  const fileInput=useRef<HTMLInputElement>(null);

  const loadFile=(f:File)=>{
    if(!f.type.startsWith('video/'))return;
    if(objUrl)URL.revokeObjectURL(objUrl);
    if(resultUrl)URL.revokeObjectURL(resultUrl);
    setFile(f);setObjUrl(URL.createObjectURL(f));setStage('idle');setResultUrl(null);setError(null);setCropBox(null);
    onFileSelected?.(f);
  };

  const posOnContainer=useCallback((e:React.PointerEvent)=>{
    if(!containerRef.current)return{x:0,y:0};
    const r=containerRef.current.getBoundingClientRect();
    return{x:Math.max(0,Math.min(e.clientX-r.left,r.width)),y:Math.max(0,Math.min(e.clientY-r.top,r.height))};
  },[]);

  const onDown=useCallback((e:React.PointerEvent)=>{
    e.currentTarget.setPointerCapture(e.pointerId);
    const p=posOnContainer(e);setDragSt(p);setDragging(true);setCropBox(null);
  },[posOnContainer]);
  const onMove=useCallback((e:React.PointerEvent)=>{
    if(!dragging)return;
    const p=posOnContainer(e);
    const x=Math.min(dragSt.x,p.x),y=Math.min(dragSt.y,p.y);
    setCropBox({x,y,w:Math.abs(p.x-dragSt.x),h:Math.abs(p.y-dragSt.y)});
  },[dragging,dragSt,posOnContainer]);
  const onUp=useCallback(()=>setDragging(false),[]);

  const handleProcess=async()=>{
    if(!file||!cropBox||!containerRef.current)return;
    const cw=containerRef.current.clientWidth,ch=containerRef.current.clientHeight;
    setStage('processing');setProgress(0);setError(null);
    try{
      const{Transcoder}=await import('@/lib/engine/Transcoder');
      const res=await Transcoder.run({
        files:[file],op:'video:crop',
        options:{ crop: { x: Math.round(cropBox.x/cw*100)/100, y: Math.round(cropBox.y/ch*100)/100, w: Math.round(cropBox.w/cw*100)/100, h: Math.round(cropBox.h/ch*100)/100 } },
        onProgress:pct=>{setProgress(pct);setStageMsg(pct<25?'Loading FFmpeg…':'Cropping…');},
      });
      setResultUrl(URL.createObjectURL(res.blob));setStage('done');
    }catch(e){setError(e instanceof Error?e.message:'Failed');setStage('error');}
  };

  if(!file)return(
    <div onDrop={e=>{e.preventDefault();const f=e.dataTransfer.files[0];if(f)loadFile(f);}} onDragOver={e=>e.preventDefault()}
      onClick={()=>fileInput.current?.click()} data-testid="vcropper-drop"
      className="group flex flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 px-8 py-14 cursor-pointer hover:border-violet-400 hover:bg-violet-50/60 transition-all">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-sm group-hover:shadow-md transition-shadow">
        <Upload className="h-6 w-6 text-slate-400 group-hover:text-violet-500 transition-colors"/>
      </div>
      <div className="text-center"><p className="text-sm font-semibold text-slate-700">Drop a video to crop</p>
        <p className="text-xs text-slate-400 mt-1">Drag on the video to select crop region</p></div>
      <input ref={fileInput} type="file" accept="video/*" className="sr-only" onChange={e=>{const f=e.target.files?.[0];if(f)loadFile(f);}}/>
    </div>
  );

  return(
    <div className="space-y-4" data-testid="vcropper-editor">
      {stage==='processing'?(
        <div className="flex flex-col items-center gap-4 py-12">
          <div className="relative"><svg className="h-16 w-16 -rotate-90" viewBox="0 0 64 64">
            <circle cx="32" cy="32" r="28" fill="none" stroke="#e2e8f0" strokeWidth="6"/>
            <circle cx="32" cy="32" r="28" fill="none" stroke="#7c3aed" strokeWidth="6" strokeDasharray={`${2*Math.PI*28*progress/100} 9999`} className="transition-all duration-300"/>
          </svg><span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-slate-700">{progress}%</span></div>
          <p className="text-sm text-slate-500">{stageMsg}</p>
        </div>
      ):(
        <div ref={containerRef} className="relative overflow-hidden rounded-xl bg-black" style={{cursor:'crosshair'}}
          onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp}>
          <video src={objUrl!} className="w-full pointer-events-none" style={{maxHeight:300}} muted playsInline/>
          {cropBox&&cropBox.w>4&&cropBox.h>4&&(
            <div className="absolute pointer-events-none border-2 border-violet-400 bg-violet-400/10"
              style={{left:cropBox.x,top:cropBox.y,width:cropBox.w,height:cropBox.h,boxShadow:'0 0 0 9999px rgba(0,0,0,0.5)'}}>
              {[{top:-4,left:-4},{top:-4,right:-4},{bottom:-4,left:-4},{bottom:-4,right:-4}].map((s,i)=>(
                <div key={i} className="absolute w-3 h-3 bg-white border-2 border-violet-400 rounded-sm" style={s as React.CSSProperties}/>
              ))}
            </div>
          )}
        </div>
      )}
      {cropBox&&<p className="text-center text-xs text-slate-400">Selection: {Math.round(cropBox.w)} × {Math.round(cropBox.h)} px (display)</p>}
      {error&&<p className="rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-600">{error}</p>}
      <div className="flex items-center justify-between border-t border-slate-100 pt-3">
        <button onClick={()=>{setFile(null);if(objUrl)URL.revokeObjectURL(objUrl);setObjUrl(null);setResultUrl(null);setStage('idle');}} className="text-xs text-slate-400 hover:text-slate-600">← Change video</button>
        {resultUrl
          ?<a href={resultUrl} download={`cropped_${file?.name}`} data-testid="vcrop-download"
              className="flex items-center gap-1.5 rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-600"><Download className="h-4 w-4"/>Download</a>
          :<button onClick={handleProcess} disabled={stage==='processing'||!cropBox||cropBox.w<5} data-testid="vcrop-process"
              className="flex items-center gap-1.5 rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-violet-700 disabled:opacity-40 transition-colors">
              {stage==='processing'?<><Loader2 className="h-4 w-4 animate-spin"/>Cropping…</>:'Crop Video'}
            </button>}
      </div>
    </div>
  );
}
