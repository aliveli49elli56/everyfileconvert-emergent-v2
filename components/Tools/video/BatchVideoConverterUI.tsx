'use client';
import { useState, useRef } from 'react';
import { Upload, Download, Loader2, X, Plus } from 'lucide-react';
interface Props { toolName?: string; onFileSelected?: (f: File) => void }
type Stage = 'idle'|'processing'|'done'|'error';
interface VItem { id:string; file:File; name:string; size:string }

export default function BatchVideoConverterUI({ toolName, onFileSelected }: Props) {
  const [files,setFiles]=useState<VItem[]>([]);
  const [format,setFormat]=useState('mp4');
  const [stage,setStage]=useState<Stage>('idle');
  const [current,setCurrent]=useState('');
  const [zipUrl,setZipUrl]=useState<string|null>(null);
  const [error,setError]=useState<string|null>(null);
  const fileInput=useRef<HTMLInputElement>(null);

  const addFiles=(incoming:File[])=>{
    const vids=incoming.filter(f=>f.type.startsWith('video/'));
    setFiles(prev=>[...prev,...vids.map(f=>({id:Math.random().toString(36).slice(2),file:f,name:f.name,size:`${(f.size/1024/1024).toFixed(1)} MB`}))]);
    if(vids[0])onFileSelected?.(vids[0]);
  };

  const handleProcess=async()=>{
    if(!files.length)return;
    setStage('processing');setError(null);
    try{
      const{Transcoder,inferOp}=await import('@/lib/engine/Transcoder');
      const JSZip=(await import('jszip')).default;
      const zip=new JSZip();
      for(const item of files){
        setCurrent(item.name);
        const srcExt=item.name.split('.').pop()||'mp4';
        const op=inferOp(srcExt,format);
        const res=await Transcoder.run({files:[item.file],op,options:{targetFormat:format},onProgress:()=>{}});
        zip.file(item.name.replace(/\.[^.]+$/,`.${format}`),res.blob);
      }
      setCurrent('');
      const zipBlob=await zip.generateAsync({type:'blob'});
      if(zipUrl)URL.revokeObjectURL(zipUrl);
      setZipUrl(URL.createObjectURL(zipBlob));
      setStage('done');
    }catch(e){setError(e instanceof Error?e.message:'Failed');setStage('error');}
  };

  return(
    <div className="space-y-4" data-testid="batch-video">
      <div onDrop={e=>{e.preventDefault();addFiles(Array.from(e.dataTransfer.files));}} onDragOver={e=>e.preventDefault()}
        onClick={()=>fileInput.current?.click()}
        className="group flex items-center justify-center gap-3 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 px-6 py-5 cursor-pointer hover:border-violet-400 hover:bg-violet-50/50 transition-all">
        <Plus className="h-5 w-5 text-slate-400 group-hover:text-violet-500"/>
        <span className="text-sm font-medium text-slate-600 group-hover:text-violet-600">Add videos — {files.length} loaded</span>
        <input ref={fileInput} type="file" accept="video/*" multiple className="sr-only" onChange={e=>addFiles(Array.from(e.target.files??[]))}/>
      </div>
      <div className="flex items-center gap-3">
        <span className="text-sm font-medium text-slate-600">Convert to:</span>
        {['mp4','webm','mkv','mov','avi'].map(f=>(
          <button key={f} onClick={()=>setFormat(f)}
            className={`rounded-lg px-3 py-1.5 text-xs font-bold uppercase transition-all ${format===f?'bg-violet-500 text-white':'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>{f}</button>
        ))}
      </div>
      {files.length>0&&(
        <div className="space-y-1.5 max-h-52 overflow-y-auto">
          {files.map(f=>(
            <div key={f.id} className="flex items-center gap-3 rounded-lg border border-slate-100 bg-white px-3 py-2">
              <div className="h-8 w-8 rounded bg-violet-100 flex items-center justify-center text-violet-600 text-xs font-bold shrink-0">
                {f.name.split('.').pop()?.toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-slate-700 truncate">{f.name}</p>
                <p className="text-xs text-slate-400">{f.size}</p>
              </div>
              {stage==='processing'&&current===f.name&&<Loader2 className="h-4 w-4 animate-spin text-violet-500 shrink-0"/>}
              {stage==='idle'&&<button onClick={()=>setFiles(p=>p.filter(x=>x.id!==f.id))} className="text-slate-300 hover:text-rose-400 transition-colors shrink-0"><X className="h-4 w-4"/></button>}
            </div>
          ))}
        </div>
      )}
      {error&&<p className="rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-600">{error}</p>}
      <div className="flex items-center justify-between border-t border-slate-100 pt-3">
        <button onClick={()=>{setFiles([]);setZipUrl(null);setStage('idle');}} className="text-xs text-slate-400 hover:text-slate-600">Clear all</button>
        {zipUrl
          ?<a href={zipUrl} download="converted_videos.zip" data-testid="batchvid-download"
              className="flex items-center gap-1.5 rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-600"><Download className="h-4 w-4"/>Download ZIP</a>
          :<button onClick={handleProcess} disabled={!files.length||stage==='processing'} data-testid="batchvid-process"
              className="flex items-center gap-1.5 rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-violet-700 disabled:opacity-40 transition-colors">
              {stage==='processing'?<><Loader2 className="h-4 w-4 animate-spin"/>Converting…</>:`Convert ${files.length} Video${files.length!==1?'s':''}`}
            </button>}
      </div>
    </div>
  );
}
