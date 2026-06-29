'use client';
/**
 * components/Studio/ToolControls.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Renders tool-specific controls inside the Advanced Studio panel.
 * Each tool has a set of sliders/inputs/selects that map to TranscodeOptions.
 * ─────────────────────────────────────────────────────────────────────────────
 */
import type { TranscodeOptions } from '@/lib/engine/Transcoder';

interface Props {
  toolKey: string;
  mode: 'image' | 'video' | 'audio' | 'pdf' | 'all';
  options: TranscodeOptions;
  onChange: (opts: TranscodeOptions) => void;
}

function Slider({
  label, value, min, max, step = 1, unit = '',
  onChange,
}: {
  label: string; value: number; min: number; max: number; step?: number; unit?: string;
  onChange: (v: number) => void;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-xs text-slate-500">
        <span className="font-medium">{label}</span>
        <span className="font-mono text-slate-700">{value}{unit}</span>
      </div>
      <input
        type="range" min={min} max={max} step={step} value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full h-1.5 appearance-none rounded-full bg-slate-200 accent-cyan-500 cursor-pointer"
      />
    </div>
  );
}

function NumberInput({
  label, value, min, max, unit = '',
  onChange,
}: {
  label: string; value: number; min?: number; max?: number; unit?: string;
  onChange: (v: number) => void;
}) {
  return (
    <div className="space-y-1">
      <label className="text-xs font-medium text-slate-500">{label}</label>
      <div className="flex items-center gap-1">
        <input
          type="number" value={value} min={min} max={max}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-20 rounded-lg border border-slate-200 bg-white px-2 py-1 text-sm font-mono text-slate-700 focus:outline-none focus:border-cyan-400"
        />
        {unit && <span className="text-xs text-slate-400">{unit}</span>}
      </div>
    </div>
  );
}

function Select({
  label, value, options,
  onChange,
}: {
  label: string; value: string; options: { value: string; label: string }[];
  onChange: (v: string) => void;
}) {
  return (
    <div className="space-y-1">
      <label className="text-xs font-medium text-slate-500">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-sm text-slate-700 focus:outline-none focus:border-cyan-400"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </div>
  );
}

function Toggle({
  label, checked, onChange,
}: {
  label: string; checked: boolean; onChange: (v: boolean) => void;
}) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className={`flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-medium transition-all ${
        checked ? 'bg-cyan-50 border-cyan-300 text-cyan-700' : 'bg-white border-slate-200 text-slate-500'
      }`}
    >
      <span className={`h-3 w-3 rounded-full border-2 ${checked ? 'border-cyan-500 bg-cyan-500' : 'border-slate-300'}`} />
      {label}
    </button>
  );
}

function TextInput({
  label, value, placeholder, onChange,
}: {
  label: string; value: string; placeholder?: string; onChange: (v: string) => void;
}) {
  return (
    <div className="space-y-1">
      <label className="text-xs font-medium text-slate-500">{label}</label>
      <input
        type="text" value={value} placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:border-cyan-400"
      />
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">{title}</p>
      {children}
    </div>
  );
}

export default function ToolControls({ toolKey, mode, options, onChange }: Props) {
  const set = (partial: Partial<TranscodeOptions>) => onChange({ ...options, ...partial });

  // ── Image manipulation tools ────────────────────────────────────────────────
  if (toolKey === 'image-rotator' || toolKey === 'flip-image') {
    return (
      <div className="space-y-5">
        <Section title="Rotation">
          <Slider label="Angle" value={options.rotation ?? 0} min={-180} max={180} unit="°"
            onChange={(v) => set({ rotation: v })} />
        </Section>
        <Section title="Flip">
          <div className="flex gap-2">
            <Toggle label="Flip Horizontal" checked={options.flipH ?? false}
              onChange={(v) => set({ flipH: v })} />
            <Toggle label="Flip Vertical" checked={options.flipV ?? false}
              onChange={(v) => set({ flipV: v })} />
          </div>
        </Section>
      </div>
    );
  }

  if (toolKey === 'image-cropper' || toolKey === 'image-crop/custom') {
    return (
      <div className="space-y-5">
        <Section title="Crop Region (pixels)">
          <div className="grid grid-cols-2 gap-3">
            <NumberInput label="X" value={options.crop?.x ?? 0} min={0}
              onChange={(v) => set({ crop: { ...(options.crop ?? { x:0, y:0, w:400, h:300 }), x: v } })} />
            <NumberInput label="Y" value={options.crop?.y ?? 0} min={0}
              onChange={(v) => set({ crop: { ...(options.crop ?? { x:0, y:0, w:400, h:300 }), y: v } })} />
            <NumberInput label="Width" value={options.crop?.w ?? 400} min={1}
              onChange={(v) => set({ crop: { ...(options.crop ?? { x:0, y:0, w:400, h:300 }), w: v } })} />
            <NumberInput label="Height" value={options.crop?.h ?? 300} min={1}
              onChange={(v) => set({ crop: { ...(options.crop ?? { x:0, y:0, w:400, h:300 }), h: v } })} />
          </div>
        </Section>
        <Section title="Presets">
          <div className="flex flex-wrap gap-2">
            {[['1:1','square'],['16:9','wide'],['9:16','story'],['4:3','standard']].map(([label, id]) => (
              <button key={id} className="rounded-lg border border-slate-200 px-3 py-1 text-xs text-slate-600 hover:border-cyan-300 hover:text-cyan-700 transition-all">
                {label}
              </button>
            ))}
          </div>
        </Section>
      </div>
    );
  }

  if (toolKey === 'image-compressor' || toolKey === 'bulk-image-resizer' || toolKey === 'image-resizer') {
    return (
      <div className="space-y-5">
        <Section title="Quality / Compression">
          <Slider label="Quality" value={options.quality ?? 85} min={10} max={100} unit="%"
            onChange={(v) => set({ quality: v })} />
        </Section>
        <Section title="Dimensions">
          <div className="grid grid-cols-2 gap-3">
            <NumberInput label="Width" value={options.width ?? 0} min={1} unit="px"
              onChange={(v) => set({ width: v })} />
            <NumberInput label="Height" value={options.height ?? 0} min={1} unit="px"
              onChange={(v) => set({ height: v })} />
          </div>
        </Section>
      </div>
    );
  }

  if (toolKey === 'blur-image') {
    return (
      <div className="space-y-5">
        <Section title="Blur Effect">
          <Slider label="Blur Radius" value={options.blurRadius ?? 5} min={0} max={30} unit="px"
            onChange={(v) => set({ blurRadius: v })} />
        </Section>
      </div>
    );
  }

  if (toolKey === 'color-adjustments') {
    return (
      <div className="space-y-5">
        <Section title="Color Adjustments">
          <Slider label="Brightness" value={options.brightness ?? 0} min={-100} max={100}
            onChange={(v) => set({ brightness: v })} />
          <Slider label="Contrast" value={options.contrast ?? 0} min={-100} max={100}
            onChange={(v) => set({ contrast: v })} />
          <Slider label="Saturation" value={options.saturation ?? 0} min={-100} max={100}
            onChange={(v) => set({ saturation: v })} />
          <Slider label="Hue Rotate" value={options.hue ?? 0} min={-180} max={180} unit="°"
            onChange={(v) => set({ hue: v })} />
        </Section>
      </div>
    );
  }

  if (toolKey === 'add-watermark') {
    return (
      <div className="space-y-5">
        <Section title="Watermark Text">
          <TextInput label="Text" value={options.watermarkText ?? ''} placeholder="© Your Name"
            onChange={(v) => set({ watermarkText: v })} />
          <Slider label="Opacity" value={(options.watermarkOpacity ?? 0.4) * 100} min={5} max={100} unit="%"
            onChange={(v) => set({ watermarkOpacity: v / 100 })} />
        </Section>
        <Section title="Position">
          <Select label="Position" value={options.watermarkPosition ?? 'bottom-right'}
            options={[
              { value: 'center', label: 'Center' },
              { value: 'bottom-right', label: 'Bottom Right' },
              { value: 'bottom-left', label: 'Bottom Left' },
              { value: 'top-right', label: 'Top Right' },
              { value: 'top-left', label: 'Top Left' },
            ]}
            onChange={(v) => set({ watermarkPosition: v as TranscodeOptions['watermarkPosition'] })} />
        </Section>
      </div>
    );
  }

  // ── Video tools ─────────────────────────────────────────────────────────────
  if (toolKey === 'video-trimmer' || toolKey === 'audio-trimmer') {
    return (
      <div className="space-y-5">
        <Section title="Trim Range">
          <NumberInput label="Start (seconds)" value={options.startTime ?? 0} min={0} unit="s"
            onChange={(v) => set({ startTime: v })} />
          <NumberInput label="End (seconds)" value={options.endTime ?? 30} min={0} unit="s"
            onChange={(v) => set({ endTime: v })} />
        </Section>
      </div>
    );
  }

  if (toolKey === 'video-compressor' || toolKey === 'audio-compressor') {
    return (
      <div className="space-y-5">
        <Section title="Quality">
          <Slider label="Quality" value={options.quality ?? 70} min={10} max={100} unit="%"
            onChange={(v) => set({ quality: v })} />
        </Section>
        {toolKey === 'audio-compressor' && (
          <Section title="Bitrate">
            <Slider label="Bitrate" value={options.bitrate ?? 128} min={32} max={320} step={32} unit=" kbps"
              onChange={(v) => set({ bitrate: v })} />
          </Section>
        )}
      </div>
    );
  }

  if (toolKey === 'audio-speed-changer') {
    return (
      <div className="space-y-5">
        <Section title="Playback Speed">
          <Slider label="Speed" value={options.speed ?? 1.0} min={0.5} max={2.0} step={0.1} unit="x"
            onChange={(v) => set({ speed: v })} />
        </Section>
      </div>
    );
  }

  if (toolKey === 'audio-pitch-changer') {
    return (
      <div className="space-y-5">
        <Section title="Pitch Shift">
          <Slider label="Semitones" value={options.pitch ?? 0} min={-12} max={12} step={1} unit=" st"
            onChange={(v) => set({ pitch: v })} />
        </Section>
      </div>
    );
  }

  // ── PDF tools ───────────────────────────────────────────────────────────────
  if (toolKey === 'pdf-splitter') {
    return (
      <div className="space-y-5">
        <Section title="Page Range">
          <TextInput label="Pages (e.g. 1-3,5,7-9)" value={options.pageRange ?? ''}
            placeholder="Leave empty to split all"
            onChange={(v) => set({ pageRange: v })} />
        </Section>
      </div>
    );
  }

  if (toolKey === 'pdf-protect') {
    return (
      <div className="space-y-5">
        <Section title="Password">
          <TextInput label="User Password" value={options.password ?? ''} placeholder="Enter password"
            onChange={(v) => set({ password: v })} />
          <TextInput label="Owner Password (optional)" value={options.ownerPassword ?? ''} placeholder="Same as user password"
            onChange={(v) => set({ ownerPassword: v })} />
        </Section>
      </div>
    );
  }

  if (toolKey === 'pdf-unlock') {
    return (
      <div className="space-y-5">
        <Section title="Unlock PDF">
          <TextInput label="Current Password" value={options.password ?? ''} placeholder="Enter the PDF password"
            onChange={(v) => set({ password: v })} />
        </Section>
      </div>
    );
  }

  if (toolKey === 'pdf-page-numbers') {
    return (
      <div className="space-y-5">
        <Section title="Page Numbers">
          <Select label="Position" value={options.pageNumberPosition ?? 'bottom-center'}
            options={[
              { value: 'bottom-center', label: 'Bottom Center' },
              { value: 'bottom-right', label: 'Bottom Right' },
              { value: 'bottom-left', label: 'Bottom Left' },
            ]}
            onChange={(v) => set({ pageNumberPosition: v as TranscodeOptions['pageNumberPosition'] })} />
          <NumberInput label="Starting Number" value={options.pageNumberStart ?? 1} min={1}
            onChange={(v) => set({ pageNumberStart: v })} />
        </Section>
      </div>
    );
  }

  if (toolKey === 'pdf-watermark') {
    return (
      <div className="space-y-5">
        <Section title="Watermark">
          <TextInput label="Watermark Text" value={options.watermarkText ?? ''} placeholder="CONFIDENTIAL"
            onChange={(v) => set({ watermarkText: v })} />
          <Slider label="Opacity" value={(options.watermarkOpacity ?? 0.2) * 100} min={5} max={80} unit="%"
            onChange={(v) => set({ watermarkOpacity: v / 100 })} />
        </Section>
      </div>
    );
  }

  // ── Default: Quality slider ─────────────────────────────────────────────────
  return (
    <div className="space-y-5">
      <Section title="Output Settings">
        <Slider label="Quality" value={options.quality ?? 85} min={10} max={100} unit="%"
          onChange={(v) => set({ quality: v })} />
      </Section>
    </div>
  );
}
