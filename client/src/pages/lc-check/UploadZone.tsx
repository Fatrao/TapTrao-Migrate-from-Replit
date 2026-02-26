import { useState, useRef } from "react";

export function UploadZone({ icon, title, subtitle, accept, onFileSelect }: {
  icon: string;
  title: string;
  subtitle: string;
  accept?: string;
  onFileSelect: (file: File) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  return (
    <div
      className={`upload-zone${dragOver ? " drag-over" : ""}`}
      onClick={() => inputRef.current?.click()}
      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragOver(false);
        const f = e.dataTransfer.files[0];
        if (f) onFileSelect(f);
      }}
      data-testid="upload-zone"
    >
      <div style={{ fontSize: 28, marginBottom: 8, color: "#bbb" }}>{icon}</div>
      <div style={{ fontSize: 14, fontWeight: 500, color: "#2a3d40", marginBottom: 4 }}>{title}</div>
      <div style={{ fontSize: 13, color: "var(--app-acapulco)" }}>
        <em style={{ fontStyle: "normal", fontWeight: 600 }}>{subtitle}</em>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept={accept || ".pdf,.jpg,.jpeg,.png"}
        onChange={(e) => { const f = e.target.files?.[0]; if (f) onFileSelect(f); e.target.value = ""; }}
        style={{ display: "none" }}
      />
    </div>
  );
}

export function FilePill({ name, size, onRemove }: { name: string; size: number; onRemove: () => void }) {
  return (
    <div className="lc-fp">
      <span>📄</span>
      <span className="lc-fp-name">{name}</span>
      <span className="lc-fp-size">{(size / 1024).toFixed(0)}KB</span>
      <span className="lc-fp-ok">✓ Uploaded</span>
      <button className="lc-fp-x" onClick={onRemove} data-testid="button-remove-file">×</button>
    </div>
  );
}
