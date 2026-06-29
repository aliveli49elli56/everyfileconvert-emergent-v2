'use client';
import { useState, useRef } from 'react';
import { Upload, Download, Loader2, RotateCw } from 'lucide-react';
interface Props { toolName?: string; onFileSelected?: (f: File) => void }
type Stage = 'idle'|'processing'|'done'|'error';

export default function VideoRotatorUI({ toolName, onFileSelected }: Props) {
  const [file,setFile]=useState<File|null>(null);
  const [objUrl,setObjUrl]=useState<string|null>(null);
  const [rotation,setRotation]=useState<0|90|180|270>(0);
  const [stage,setStage]=useState<Stage>('idle');
  const [progress,setProgress]=useState(0);
  const [stageMsg,setStageMsg]=useState('');
  const [resultUrl,setResultUrl]=useState<string|null>(null);
  const [error,setError]=useState<string|null>(null);
  const fileInput=useRef<HTMLInputElement>(null);

  const loadFile=(f:File)=>{
    if(!f.type.startsWith('video/'))return;
    if(objUrl)URL.revokeObjectURL(objUrl);
    if(resultUrl)URL.revokeObjectURL(resultUrl);
    setFile(f);setObjUrl(URL.createObjectURL(f));setStage('idle');setResultUrl(null);setError(null);setRotation(0);
    onFileSelected?.(f);
  };

  const handleProcess=async()=>{
    if(!file||rotation===0)return;
    setStage('processing');setProgress(0);setError(null);
    try{
      const{Transcoder}=await import('@/lib/engine/Transcoder');
      const res=await Transcoder.run({
        files:[file],op:'video:rotate',
        options:{rotation: rotation},
        onProgress:pct=>{setProgress(pct);setStageMsg(pct<25?'Loading FFmpeg…':'Rotating…');},
      });
      setResultUrl(URL.createObjectURL(res.blob));setStage('done');
    }catch(e){setError(e instanceof Error?e.message:'Failed');setStage('error');}
  };

  if(!file)return(
    <div onDrop={e=>{e.preventDefault();const f=e.dataTransfer.files[0];if(f)loadFile(f);}} onDragOver={e=>e.preventDefault()}
      onClick={()=>fileInput.current?.click()} data-testid="vrotator-drop"
      className="group flex flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 px-8 py-14 cursor-pointer hover:border-violet-400 hover:bg-violet-50/60 transition-all">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-sm group-hover:shadow-md transition-shadow">
        <RotateCw className="h-6 w-6 text-slate-400 group-hover:text-violet-500 transition-colors"/>
      </div>
      <div className="text-center"><p className="text-sm font-semibold text-slate-700">Drop a video to rotate</p>
        <p className="text-xs text-slate-400 mt-1">or <span className="text-violet-500">click to browse</span></p></div>
      <input ref={fileInput} type="file" accept="video/*" className="sr-only" onChange={e=>{const f=e.target.files?.[0];if(f)loadFile(f);}}/>
    </div>
  );

  return(
    <div className="space-y-4" data-testid="vrotator-editor">
      {stage==='processing'?(
        <div className="flex flex-col items-center gap-4 py-12">
          <div className="relative"><svg className="h-16 w-16 -rotate-90" viewBox="0 0 64 64">
            <circle cx="32" cy="32" r="28" fill="none" stroke="#e2e8f0" strokeWidth="6"/>
            <circle cx="32" cy="32" r="28" fill="none" stroke="#7c3aed" strokeWidth="6" strokeDasharray={`${2*Math.PI*28*progress/100} 9999`} className="transition-all duration-300"/>
          </svg><span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-slate-700">{progress}%</span></div>
          <p className="text-sm text-slate-500">{stageMsg}</p>
        </div>
      ):(
        <>
          <div className="flex items-center justify-center overflow-hidden rounded-xl bg-black" style={{minHeight:220}}>
            <video src={objUrl!} className="max-w-full" style={{maxHeight:260,transform:`rotate(${rotation}deg)`,transition:'transform 0.25s ease'}} muted playsInline/>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {([0,90,180,270] as const).map(deg=>(
              <button key={deg} onClick={()=>setRotation(deg)}
                className={`rounded-xl py-3 text-sm font-bold transition-all ${rotation===deg?'bg-violet-500 text-white shadow-sm':'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>{deg}°</button>
            ))}
          </div>
          {error&&<p className="rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-600">{error}</p>}
        </>
      )}
      <div className="flex items-center justify-between border-t border-slate-100 pt-3">
        <button onClick={()=>{setFile(null);if(objUrl)URL.revokeObjectURL(objUrl);setObjUrl(null);setResultUrl(null);setStage('idle');}} className="text-xs text-slate-400 hover:text-slate-600">← Change video</button>
        {resultUrl
          ?<a href={resultUrl} download={`rotated_${file?.name}`} data-testid="vrotate-download"
              className="flex items-center gap-1.5 rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-600"><Download className="h-4 w-4"/>Download</a>
          :<button onClick={handleProcess} disabled={stage==='processing'||rotation===0} data-testid="vrotate-process"
              className="flex items-center gap-1.5 rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-violet-700 disabled:opacity-40 transition-colors">
              {stage==='processing'?<><Loader2 className="h-4 w-4 animate-spin"/>Rotating…</>:<><RotateCw className="h-4 w-4"/>Rotate Video</>}
            </button>}
      </div>
    </div>
  );
}
