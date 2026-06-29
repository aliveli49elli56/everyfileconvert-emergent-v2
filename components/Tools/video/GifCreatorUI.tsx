'use client';
import { useState, useRef } from 'react';
import { Upload, Download, Loader2 } from 'lucide-react';
interface Props { toolName?: string; onFileSelected?: (f: File) => void }
type Stage = 'idle'|'processing'|'done'|'error';
function fmt(s:number){const m=Math.floor(s/60),sec=Math.floor(s%60);return`${m}:${String(sec).padStart(2,'0')}`;}

export default function GifCreatorUI({ toolName, onFileSelected }: Props) {
  const [file,setFile]=useState<File|null>(null);
  const [objUrl,setObjUrl]=useState<string|null>(null);
  const [duration,setDuration]=useState(10);
  const [start,setStart]=useState(0);
  const [end,setEnd]=useState(10);
  const [fps,setFps]=useState(10);
  const [width,setWidth]=useState(480);
  const [stage,setStage]=useState<Stage>('idle');
  const [progress,setProgress]=useState(0);
  const [stageMsg,setStageMsg]=useState('');
  const [resultUrl,setResultUrl]=useState<string|null>(null);
  const [error,setError]=useState<string|null>(null);
  const videoRef=useRef<HTMLVideoElement>(null);
  const fileInput=useRef<HTMLInputElement>(null);

  const loadFile=(f:File)=>{
    if(!f.type.startsWith('video/'))return;
    if(objUrl)URL.revokeObjectURL(objUrl);
    if(resultUrl)URL.revokeObjectURL(resultUrl);
    setFile(f);setObjUrl(URL.createObjectURL(f));setStage('idle');setResultUrl(null);setError(null);
    onFileSelected?.(f);
  };

  const handleMeta=()=>{const d=videoRef.current?.duration??10;setDuration(d);setEnd(Math.min(d,10));};

  const handleProcess=async()=>{
    if(!file)return;
    setStage('processing');setProgress(0);setError(null);
    try{
      const{Transcoder}=await import('@/lib/engine/Transcoder');
      const res=await Transcoder.run({
        files:[file],op:'video:gif',
        options:{startTime: start, endTime: end, fps, width},
        onProgress:pct=>{setProgress(pct);setStageMsg(pct<25?'Loading FFmpeg…':'Creating GIF…');},
      });
      setResultUrl(URL.createObjectURL(res.blob));setStage('done');
    }catch(e){setError(e instanceof Error?e.message:'Failed');setStage('error');}
  };

  if(!file)return(
    <div onDrop={e=>{e.preventDefault();const f=e.dataTransfer.files[0];if(f)loadFile(f);}} onDragOver={e=>e.preventDefault()}
      onClick={()=>fileInput.current?.click()} data-testid="gif-drop"
      className="group flex flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 px-8 py-14 cursor-pointer hover:border-violet-400 hover:bg-violet-50/60 transition-all">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-sm group-hover:shadow-md transition-shadow">
        <Upload className="h-6 w-6 text-slate-400 group-hover:text-violet-500 transition-colors"/>
      </div>
      <div className="text-center"><p className="text-sm font-semibold text-slate-700">Drop a video to create GIF</p>
        <p className="text-xs text-slate-400 mt-1">or <span className="text-violet-500">click to browse</span></p></div>
      <input ref={fileInput} type="file" accept="video/*" className="sr-only" onChange={e=>{const f=e.target.files?.[0];if(f)loadFile(f);}}/>
    </div>
  );

  return(
    <div className="space-y-4" data-testid="gif-editor">
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
          {resultUrl?<img src={resultUrl} alt="GIF preview" className="w-full rounded-xl border border-slate-200"/>:
            <video ref={videoRef} src={objUrl!} controls className="w-full rounded-xl bg-black" style={{maxHeight:240}} onLoadedMetadata={handleMeta}/>}
          <div className="space-y-3">
            {/* Trim range */}
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>Start: <span className="font-bold text-violet-600">{fmt(start)}</span></span>
              <span>Duration: <span className="font-bold">{fmt(end-start)}</span></span>
              <span>End: <span className="font-bold text-violet-600">{fmt(end)}</span></span>
            </div>
            <div className="relative h-6 flex items-center">
              <div className="absolute h-1.5 w-full rounded-full bg-slate-200"/>
              <div className="absolute h-1.5 rounded-full bg-violet-400" style={{left:`${(start/duration)*100}%`,right:`${100-(end/duration)*100}%`}}/>
              <input type="range" min={0} max={duration} step={0.1} value={start} onChange={e=>setStart(Math.min(+e.target.value,end-0.5))}
                className="absolute w-full appearance-none bg-transparent cursor-pointer" style={{height:'6px'}}/>
              <input type="range" min={0} max={duration} step={0.1} value={end} onChange={e=>setEnd(Math.max(+e.target.value,start+0.5))}
                className="absolute w-full appearance-none bg-transparent cursor-pointer" style={{height:'6px',zIndex:2}}/>
            </div>
            {/* FPS & Width */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1"><label className="text-xs font-medium text-slate-500">FPS</label>
                <input type="range" min={5} max={30} step={1} value={fps} onChange={e=>setFps(+e.target.value)} className="w-full h-1.5 accent-violet-500 cursor-pointer"/>
                <div className="text-right text-xs font-mono text-slate-600">{fps} fps</div></div>
              <div className="space-y-1"><label className="text-xs font-medium text-slate-500">Width</label>
                <input type="range" min={160} max={720} step={80} value={width} onChange={e=>setWidth(+e.target.value)} className="w-full h-1.5 accent-violet-500 cursor-pointer"/>
                <div className="text-right text-xs font-mono text-slate-600">{width}px</div></div>
            </div>
          </div>
          {error&&<p className="rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-600">{error}</p>}
        </>
      )}
      <div className="flex items-center justify-between border-t border-slate-100 pt-3">
        <button onClick={()=>{setFile(null);if(objUrl)URL.revokeObjectURL(objUrl);setObjUrl(null);setResultUrl(null);setStage('idle');}} className="text-xs text-slate-400 hover:text-slate-600">← Change video</button>
        {resultUrl
          ?<a href={resultUrl} download={`animated_${file?.name?.replace(/\.[^.]+$/,'.gif')}`} data-testid="gif-download"
              className="flex items-center gap-1.5 rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-600"><Download className="h-4 w-4"/>Download GIF</a>
          :<button onClick={handleProcess} disabled={stage==='processing'||end<=start} data-testid="gif-process"
              className="flex items-center gap-1.5 rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-violet-700 disabled:opacity-40 transition-colors">
              {stage==='processing'?<><Loader2 className="h-4 w-4 animate-spin"/>Creating…</>:'Create GIF'}
            </button>}
      </div>
    </div>
  );
}
