import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Heart, LayoutGrid, MessageCircle, Pin, Scissors, X,
  Edit3, Trash2, BarChart2, Copy, Eye, EyeOff,
  MoreHorizontal, Upload, Link, Image,
  Bookmark, Clock, CheckCircle, AlertCircle, Download,
  Plus, Search, Filter, Bell, Settings, User, UserPlus, ArrowLeft, Smile, MessageSquare, ImageIcon, Expand, RefreshCw, SendHorizontal, ChevronUp, ChevronDown,
  Undo2, Redo2, Type, PencilLine, Lock,
} from 'lucide-react';
import './pinterest.css';

/* ─── Constants ──────────────────────────────────────────────────────────── */
const PINTEREST_META = {
  id: 'pinterest',
  name: 'Pinterest',
  color: '#e60023',
  logoUrl: 'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/pinterest.svg',
};

const DEFAULT_BOARDS = [];

const SAMPLE_PINS = [
  { id: 'pin-1', title: 'Salon moderne minimal', author: 'mira design', imageUrl: 'https://picsum.photos/id/1018/900/1600', board: 'Inspiration Maison', likes: 1204, comments: 89, saves: 432, views: 12800, status: 'published', scheduled: null },
  { id: 'pin-2', title: 'Style outfit street', author: 'lina mode', imageUrl: 'https://picsum.photos/id/1005/900/1600', board: 'Fashion Board', likes: 845, comments: 64, saves: 310, views: 9200, status: 'published', scheduled: null },
  { id: 'pin-3', title: 'Setup bureau clean', author: 'sofie elisabeth', imageUrl: 'https://picsum.photos/id/1/900/1600', board: 'Workspace Ideas', likes: 2219, comments: 177, saves: 890, views: 24100, status: 'published', scheduled: null },
  { id: 'pin-4', title: 'Recette healthy bowl', author: 'nora food', imageUrl: 'https://picsum.photos/id/292/900/1600', board: 'Food Mood', likes: 679, comments: 31, saves: 215, views: 7400, status: 'scheduled', scheduled: '2025-06-15 09:00' },
  { id: 'pin-5', title: 'Décoration chambre cosy', author: 'laura home', imageUrl: 'https://picsum.photos/id/29/900/1600', board: 'Room Design', likes: 1560, comments: 94, saves: 670, views: 18300, status: 'published', scheduled: null },
  { id: 'pin-6', title: 'Photo travel sunset', author: 'worldshots', imageUrl: 'https://picsum.photos/id/1015/900/1600', board: 'Travel Goals', likes: 2031, comments: 145, saves: 780, views: 22500, status: 'draft', scheduled: null },
  { id: 'pin-7', title: 'Art abstrait couleurs', author: 'atelier nova', imageUrl: 'https://picsum.photos/id/240/900/1600', board: 'Art & Design', likes: 934, comments: 52, saves: 340, views: 10600, status: 'published', scheduled: null },
  { id: 'pin-8', title: 'Forêt de pins matinale', author: 'nature lens', imageUrl: 'https://picsum.photos/id/1043/900/1600', board: 'Nature', likes: 1788, comments: 112, saves: 560, views: 19700, status: 'published', scheduled: null },
];

function fmt(n) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

async function downloadRemoteImage(url, nameBase) {
  if (!url) return;
  const safeName = `${(nameBase || 'epingle').slice(0, 80)}`.replace(/[/\\?%*:|"<>]/g, '-').trim() || 'epingle';
  try {
    const res = await fetch(url, { mode: 'cors' });
    if (!res.ok) throw new Error('fetch failed');
    const blob = await res.blob();
    const ext = blob.type?.includes('png') ? 'png'
      : blob.type?.includes('webp') ? 'webp'
        : blob.type?.includes('gif') ? 'gif' : 'jpg';
    const blobUrl = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = `${safeName}.${ext}`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(blobUrl);
  } catch {
    window.open(url, '_blank', 'noopener,noreferrer');
  }
}

function loadImageForCollage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    if (!src.startsWith('blob:') && !src.startsWith('data:')) {
      img.crossOrigin = 'anonymous';
    }
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('image load failed'));
    img.src = src;
  });
}

function drawCover(ctx, img, x, y, w, h) {
  const ir = img.width / img.height;
  const wr = w / h;
  let sx; let sy; let sw; let sh;
  if (ir > wr) {
    sh = img.height;
    sw = sh * wr;
    sx = (img.width - sw) / 2;
    sy = 0;
  } else {
    sw = img.width;
    sh = sw / wr;
    sx = 0;
    sy = (img.height - sh) / 2;
  }
  ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h);
}

const COLLAGE_FRAMES = [
  { id: 'none', label: 'Sans cadre', padRatio: 0, cornerRatio: 0, borderW: 0, stroke: null, wrapBg: '#ffffff', bottomExtraRatio: 0 },
  { id: 'fine', label: 'Contour fin gris', padRatio: 0.022, cornerRatio: 0.05, borderW: 2, stroke: '#e5e7eb', wrapBg: '#ffffff', bottomExtraRatio: 0 },
  { id: 'blanc', label: 'Marge blanche', padRatio: 0.04, cornerRatio: 0.07, borderW: 0, stroke: null, wrapBg: '#f4f4f5', bottomExtraRatio: 0 },
  { id: 'epais', label: 'Cadre noir épais', padRatio: 0.028, cornerRatio: 0.03, borderW: 14, stroke: '#111827', wrapBg: '#ffffff', bottomExtraRatio: 0 },
  { id: 'polaroid', label: 'Polaroïd', padRatio: 0.032, cornerRatio: 0.02, borderW: 3, stroke: '#ffffff', wrapBg: '#f3f3f3', bottomExtraRatio: 0.14 },
];
const COLLAGE_FRAME_MAP = Object.fromEntries(COLLAGE_FRAMES.map((f) => [f.id, f]));

function roundRectPath(ctx, x, y, w, h, r) {
  const rr = Math.min(Math.max(0, r), w / 2, h / 2);
  if (rr < 0.5) {
    ctx.rect(x, y, w, h);
    return;
  }
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

async function tryLoadCollageImage(src) {
  try {
    return await loadImageForCollage(src);
  } catch {
    return null;
  }
}

/** Exporte l’éditeur collage (fond, points, calques, cadre) en JPEG. */
async function exportCollageToDataUrl({ bgColor, frameId, layers }, outW = 900, outH = 1600) {
  const frame = COLLAGE_FRAME_MAP[frameId] || COLLAGE_FRAME_MAP.none;
  const m = Math.min(outW, outH);
  const pad = Math.round((frame.padRatio || 0) * m);
  const bottomExtra = Math.round((frame.bottomExtraRatio || 0) * outH);
  const contentX = pad;
  const contentY = pad;
  const contentW = Math.max(40, outW - pad * 2);
  const contentH = Math.max(40, outH - pad * 2 - bottomExtra);
  const r = Math.max(0, Math.round((frame.cornerRatio || 0) * m));

  const canvas = document.createElement('canvas');
  canvas.width = outW;
  canvas.height = outH;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return '';

  ctx.fillStyle = frame.wrapBg || '#ffffff';
  ctx.fillRect(0, 0, outW, outH);

  ctx.save();
  ctx.beginPath();
  roundRectPath(ctx, contentX, contentY, contentW, contentH, r);
  ctx.clip();

  ctx.fillStyle = bgColor || '#e8eaed';
  ctx.fillRect(contentX, contentY, contentW, contentH);

  ctx.fillStyle = 'rgba(0, 0, 0, 0.07)';
  const dotStep = 11;
  for (let px = contentX; px < contentX + contentW; px += dotStep) {
    for (let py = contentY; py < contentY + contentH; py += dotStep) {
      ctx.beginPath();
      ctx.arc(px, py, 1.1, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  for (const layer of layers) {
    if (layer.type === 'photo' && layer.src) {
      const img = await tryLoadCollageImage(layer.src);
      const lx = contentX + Number(layer.x) * contentW;
      const ly = contentY + Number(layer.y) * contentH;
      const lw = Math.max(4, Number(layer.w) * contentW);
      const lh = Math.max(4, Number(layer.h) * contentH);
      const rot = Number(layer.rotation) || 0;
      if (img) {
        if (rot !== 0) {
          ctx.save();
          ctx.translate(lx + lw / 2, ly + lh / 2);
          ctx.rotate((rot * Math.PI) / 180);
          drawCover(ctx, img, -lw / 2, -lh / 2, lw, lh);
          ctx.restore();
        } else {
          drawCover(ctx, img, lx, ly, lw, lh);
        }
      } else {
        ctx.save();
        if (rot !== 0) {
          ctx.translate(lx + lw / 2, ly + lh / 2);
          ctx.rotate((rot * Math.PI) / 180);
          ctx.fillStyle = '#cbd5e1';
          ctx.fillRect(-lw / 2, -lh / 2, lw, lh);
          ctx.strokeStyle = '#94a3b8';
          ctx.lineWidth = 2;
          ctx.strokeRect(-lw / 2 + 1, -lh / 2 + 1, lw - 2, lh - 2);
        } else {
          ctx.fillStyle = '#cbd5e1';
          ctx.fillRect(lx, ly, lw, lh);
          ctx.strokeStyle = '#94a3b8';
          ctx.lineWidth = 2;
          ctx.strokeRect(lx + 1, ly + 1, lw - 2, lh - 2);
        }
        ctx.restore();
      }
    } else if (layer.type === 'text') {
      const fs = Math.max(14, (Number(layer.fontSize) || 22) / 420 * contentW);
      ctx.font = `600 ${fs}px system-ui, -apple-system, "Segoe UI", sans-serif`;
      ctx.fillStyle = layer.color || '#111827';
      const lx = contentX + Number(layer.x) * contentW;
      const ly = contentY + Number(layer.y) * contentH;
      ctx.fillText(String(layer.text || ''), lx, ly + fs * 0.88);
    } else if (layer.type === 'drawing' && layer.paths?.length) {
      for (const path of layer.paths) {
        const pts = path.points;
        if (!pts || pts.length < 2) continue;
        ctx.strokeStyle = path.color || '#111827';
        ctx.lineWidth = Math.max(1.2, (path.lineWidth || 0.004) * contentW);
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        let started = false;
        ctx.beginPath();
        for (let i = 0; i < pts.length; i++) {
          const px = contentX + Number(pts[i].x) * contentW;
          const py = contentY + Number(pts[i].y) * contentH;
          if (!Number.isFinite(px) || !Number.isFinite(py)) continue;
          if (!started) {
            ctx.moveTo(px, py);
            started = true;
          } else {
            ctx.lineTo(px, py);
          }
        }
        if (started) ctx.stroke();
      }
    }
  }

  ctx.restore();

  if (frame.borderW > 0 && frame.stroke) {
    ctx.save();
    ctx.beginPath();
    roundRectPath(ctx, contentX, contentY, contentW, contentH, r);
    ctx.strokeStyle = frame.stroke;
    ctx.lineWidth = frame.borderW;
    ctx.stroke();
    ctx.restore();
  }

  if (bottomExtra > 0) {
    const bandTop = contentY + contentH;
    ctx.fillStyle = '#fafafa';
    ctx.fillRect(contentX, bandTop, contentW, bottomExtra + 2);
  }

  try {
    return canvas.toDataURL('image/jpeg', 0.92);
  } catch {
    return canvas.toDataURL('image/png');
  }
}

const STATUS_CONFIG = {
  published: { label: 'Publié', color: '#16a34a', bg: '#dcfce7', icon: CheckCircle },
  scheduled: { label: 'Programmé', color: '#d97706', bg: '#fef3c7', icon: Clock },
  draft:     { label: 'Brouillon', color: '#6b7280', bg: '#f3f4f6', icon: Edit3 },
};

/* ─── Sub-components ─────────────────────────────────────────────────────── */

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.draft;
  const Icon = cfg.icon;
  return (
    <span className="pin-status-badge" style={{ color: cfg.color, background: cfg.bg }}>
      <Icon size={10} />
      {cfg.label}
    </span>
  );
}

function DiscardConfirmDialog({ open, onContinue, onAbandon }) {
  if (!open) return null;
  return (
    <div
      className="pn-discard-layer"
      role="dialog"
      aria-modal="true"
      aria-labelledby="pn-discard-title"
      onClick={onContinue}
    >
      <div className="pn-discard-card" onClick={e => e.stopPropagation()}>
        <h3 id="pn-discard-title">Continuer ou abandonner ?</h3>
        <p>Tu peux continuer la modification, ou abandonner pour revenir en arrière.</p>
        <button type="button" className="pn-discard-btn-continue" onClick={onContinue}>
          Continuer
        </button>
        <button type="button" className="pn-discard-btn-abandon" onClick={onAbandon}>
          Abandonner
        </button>
      </div>
    </div>
  );
}

function CreateTypeModal({ onClose, onPick }) {
  return (
    <div className="pn-modal-overlay" onClick={onClose}>
      <div className="pn-modal pn-modal-sm pn-create-type-modal" onClick={e => e.stopPropagation()}>
        <div className="pn-modal-header pn-create-type-header">
          <h2>Créer</h2>
          <button type="button" className="pn-icon-btn" aria-label="Fermer" onClick={onClose}><X size={18} /></button>
        </div>
        <div className="pn-create-type-list">
          <button type="button" className="pn-create-type-item" onClick={() => onPick('pin')}>
            <span className="pn-create-type-icon" aria-hidden><Pin size={22} strokeWidth={1.75} /></span>
            <div>
              <strong>Épingle</strong>
              <span>Publiez vos photos ou vidéos avec liens et effets.</span>
            </div>
          </button>
          <button type="button" className="pn-create-type-item" onClick={() => onPick('board')}>
            <span className="pn-create-type-icon" aria-hidden><LayoutGrid size={22} strokeWidth={1.75} /></span>
            <div>
              <strong>Tableau</strong>
              <span>Organisez une collection de vos épingles favorites.</span>
            </div>
          </button>
          <button type="button" className="pn-create-type-item pn-create-type-item-collage" onClick={() => onPick('collage')}>
            <span className="pn-create-type-icon" aria-hidden><Scissors size={22} strokeWidth={1.75} /></span>
            <div>
              <strong>Collage</strong>
              <span>Mélangez et associez des idées dans une composition.</span>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}

function BoardCreateModal({ onClose, onCreate }) {
  const [boardName, setBoardName] = useState('');
  const [isSecret, setIsSecret] = useState(false);
  const [isCollaborative, setIsCollaborative] = useState(false);
  const [showDiscard, setShowDiscard] = useState(false);

  const canCreate = boardName.trim().length > 0;
  const isDirty = boardName.trim() !== '' || isSecret || isCollaborative;

  const tryClose = () => {
    if (isDirty) setShowDiscard(true);
    else onClose();
  };

  const handleCreate = () => {
    if (!canCreate) return;
    onCreate?.({
      id: `board-${Date.now()}`,
      name: boardName.trim(),
      isSecret,
      isCollaborative,
    });
    onClose();
  };

  return (
    <div className="pn-modal-overlay" onClick={tryClose}>
      <div className="pn-modal pn-board-create-modal" onClick={e => e.stopPropagation()}>
        <div className="pn-modal-header pn-board-create-header">
          <h2>Créer un tableau</h2>
          <button type="button" className="pn-icon-btn" onClick={tryClose}><X size={22} /></button>
        </div>

        <div className="pn-modal-body pn-board-create-body">
          <div className="pn-board-cover-preview" aria-hidden>
            <span className="cell cell-a" />
            <span className="cell cell-b" />
            <span className="cell cell-c" />
          </div>

          <label className="pn-board-name-field">
            <span>Nom du tableau</span>
            <input
              className="pn-input"
              value={boardName}
              onChange={(e) => { setBoardName(e.target.value); }}
              placeholder="Attribuez un nom a votre tableau"
              maxLength={80}
              autoFocus
            />
          </label>

          <div className="pn-board-option-row">
            <div>
              <strong>Rendre ce tableau secret</strong>
              <p>Seuls vous et vos collaborateurs verrez ce tableau</p>
            </div>
            <button
              type="button"
              className={`pn-switch ${isSecret ? 'active' : ''}`}
              aria-label="Basculer tableau secret"
              aria-pressed={isSecret}
              onClick={() => setIsSecret(v => !v)}
            />
          </div>

          <div className="pn-board-option-row">
            <div>
              <strong>Tableau collaboratif</strong>
              <p>Inviter d'autres membres a participer a ce tableau</p>
            </div>
            <button
              type="button"
              className={`pn-board-collab-btn ${isCollaborative ? 'active' : ''}`}
              aria-label="Activer collaboration"
              onClick={() => setIsCollaborative(v => !v)}
            >
              <UserPlus size={22} />
            </button>
          </div>
        </div>

        <div className="pn-modal-footer pn-board-create-footer">
          <button
            type="button"
            className="pn-board-create-btn"
            disabled={!canCreate}
            onClick={handleCreate}
          >
            Créer
          </button>
        </div>
      </div>
      <DiscardConfirmDialog
        open={showDiscard}
        onContinue={() => setShowDiscard(false)}
        onAbandon={() => {
          setShowDiscard(false);
          onClose();
        }}
      />
    </div>
  );
}

function PinCreateModal({ onClose, onSave, boards }) {
  const [mode, setMode] = useState('ai'); // ai | manual
  const [prompt, setPrompt] = useState('');
  const [uploadedPreview, setUploadedPreview] = useState('');
  const fileInputRef = useRef(null);
  const [scheduleAt, setScheduleAt] = useState('');
  const [showDiscard, setShowDiscard] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [form, setForm] = useState({
    title: '',
    description: '',
    link: '',
    board: boards[0]?.name || '',
  });

  const set = (k, v) => {
    setDirty(true);
    setForm(prev => ({ ...prev, [k]: v }));
  };

  const tryClose = () => {
    if (dirty || prompt.trim() || uploadedPreview || form.title.trim() || form.description.trim() || form.link.trim() || scheduleAt) {
      setShowDiscard(true);
    } else {
      onClose();
    }
  };

  useEffect(() => {
    if (!form.board && boards.length > 0) {
      setForm(prev => ({ ...prev, board: boards[0].name }));
    }
  }, [boards, form.board]);

  const handleGenerate = () => {
    setDirty(true);
    const base = prompt.trim() || 'Inspiration Pinterest';
    set('title', `${base} — idée créative`);
    set('description', `Créez un visuel autour de "${base}" avec un style moderne et engageant.`);
    set('link', 'https://example.com');
    setUploadedPreview(`https://picsum.photos/900/1600?seed=${encodeURIComponent(base)}`);
  };

  const handlePickPhoto = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setDirty(true);
    const nextUrl = URL.createObjectURL(file);
    setUploadedPreview(nextUrl);
  };

  const handleSubmit = (action = 'publish') => {
    if (!form.title.trim()) return alert('Titre requis');
    if (!form.board) return alert('Creez d abord un tableau');
    if (action === 'schedule' && !scheduleAt) return alert('Choisissez la date/heure de planification');
    const status = action === 'publish' ? 'published' : (action === 'schedule' ? 'scheduled' : 'draft');
    onSave({
      id: `pin-${Date.now()}`,
      title: form.title,
      description: form.description,
      board: form.board,
      link: form.link,
      imageUrl: uploadedPreview || ('https://picsum.photos/900/1600?random=' + Date.now()),
      likes: 0,
      comments: 0,
      saves: 0,
      views: 0,
      status,
      scheduled: action === 'schedule' ? scheduleAt : null,
    });
    onClose();
  };

  return (
    <div className="pn-modal-overlay" onClick={tryClose}>
      <div className="pn-modal pn-pin-create-modal" onClick={e => e.stopPropagation()}>
        <div className="pn-modal-header">
          <h2>Créer une Épingle</h2>
          <button type="button" className="pn-icon-btn" onClick={tryClose}><X size={18} /></button>
        </div>

        <div className="pn-create-mode-row">
          <button type="button" className={mode === 'ai' ? 'active' : ''} onClick={() => { setDirty(true); setMode('ai'); }}>Avec IA</button>
          <button type="button" className={mode === 'manual' ? 'active' : ''} onClick={() => { setDirty(true); setMode('manual'); }}>Manuel</button>
        </div>

        {mode === 'ai' && (
          <div className="pn-ai-generate-bar">
            <input
              value={prompt}
              onChange={e => { setDirty(true); setPrompt(e.target.value); }}
              placeholder="Décrivez votre post, l'IA génère titre et description..."
            />
            <button onClick={handleGenerate}>Generer</button>
          </div>
        )}

        <div className="pn-pin-create-grid">
          <div className="pn-upload-big-box" onClick={handlePickPhoto} role="button" tabIndex={0} onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              handlePickPhoto();
            }
          }}>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,video/mp4"
              onChange={handleFileChange}
              style={{ display: 'none' }}
            />
            {uploadedPreview ? (
              <img src={uploadedPreview} alt="Preview upload" className="pn-upload-preview-media" />
            ) : (
              <>
                <Upload size={28} />
                <strong>Choisissez un fichier ou glissez-le ici</strong>
                <span>.jpg jusqu'à 20 Mo ou .mp4 jusqu'à 200 Mo</span>
              </>
            )}
            <button type="button" className="pn-upload-choose-btn" onClick={(e) => {
              e.stopPropagation();
              handlePickPhoto();
            }}>
              Choisir photo
            </button>
          </div>

          <div className="pn-fields">
            <label className="pn-label">Titre</label>
            <input className="pn-input" value={form.title} onChange={e => set('title', e.target.value)} placeholder="Ajoutez un titre" />

            <label className="pn-label">Description</label>
            <textarea className="pn-textarea" rows={4} value={form.description} onChange={e => set('description', e.target.value)} placeholder="Ajoutez une description détaillée" />

            <label className="pn-label">Lien</label>
            <input className="pn-input" value={form.link} onChange={e => set('link', e.target.value)} placeholder="Ajouter un lien" />

            <label className="pn-label">Tableau</label>
            <select
              className="pn-select"
              value={form.board}
              onChange={e => set('board', e.target.value)}
              disabled={boards.length === 0}
            >
              {boards.length === 0
                ? <option value="">Aucun tableau cree</option>
                : boards.map((b) => <option key={b.id} value={b.name}>{b.name}</option>)}
            </select>
          </div>
        </div>

        <div className="pn-publish-panel">
          <button className="pn-publish-now-btn" onClick={() => handleSubmit('publish')}>
            ✈ Publier maintenant
          </button>
          <div className="pn-planify-card">
            <p>PLANIFIER POUR PLUS TARD</p>
            <input
              type="datetime-local"
              className="pn-input"
              value={scheduleAt}
              onChange={(e) => { setDirty(true); setScheduleAt(e.target.value); }}
            />
            <div className="pn-planify-actions">
              <button type="button" onClick={() => handleSubmit('schedule')}>📅 Planifier</button>
              <button type="button" onClick={() => handleSubmit('draft')}>Garder en reserve</button>
            </div>
          </div>
        </div>

        <div className="pn-modal-footer">
          <button type="button" className="pn-btn pn-btn-ghost" onClick={tryClose}>Annuler</button>
        </div>
      </div>
      <DiscardConfirmDialog
        open={showDiscard}
        onContinue={() => setShowDiscard(false)}
        onAbandon={() => {
          setShowDiscard(false);
          onClose();
        }}
      />
    </div>
  );
}

const COLLAGE_DEFAULT_BG = '#e8eaed';
const COLLAGE_MAX_LAYERS = 12;
const COLLAGE_INK_SWATCHES = ['#111827', '#e60023', '#2563eb', '#16a34a', '#ca8a04', '#9333ea', '#db2777', '#ffffff'];

function collageLayerId() {
  return `cl-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function collageLayerLabel(layer) {
  if (layer.type === 'photo') return 'Photo';
  if (layer.type === 'text') return (layer.text || 'Texte').slice(0, 22);
  return 'Dessin';
}

function CollageCreateModal({ onClose, onSave, boards }) {
  const [step, setStep] = useState(1);
  const [bgColor, setBgColor] = useState(COLLAGE_DEFAULT_BG);
  const [frameId, setFrameId] = useState('none');
  const [layers, setLayers] = useState([]);
  const [selectedId, setSelectedId] = useState('bg');
  const [activeTool, setActiveTool] = useState(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [board, setBoard] = useState(boards[0]?.name || '');
  const [publishStatus, setPublishStatus] = useState('published');
  const [scheduledAt, setScheduledAt] = useState('');
  const [showDiscard, setShowDiscard] = useState(false);
  const [stitching, setStitching] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [past, setPast] = useState([]);
  const [future, setFuture] = useState([]);
  const [nextTextColor, setNextTextColor] = useState('#111827');
  const [nextTextSize, setNextTextSize] = useState(26);
  const [nextDrawColor, setNextDrawColor] = useState('#111827');
  const [nextDrawLineWidth, setNextDrawLineWidth] = useState(0.0035);

  const fileInputRef = useRef(null);
  const stageRef = useRef(null);
  const drawOverlayRef = useRef(null);
  const layersPaintRef = useRef(null);
  const blobUrlsRef = useRef([]);
  const strokeRef = useRef(null);
  const dragRef = useRef(null);

  useEffect(() => {
    if (!board && boards.length > 0) setBoard(boards[0].name);
  }, [boards, board]);

  const snap = () => JSON.stringify({ bgColor, frameId, layers });

  const applySnap = (raw) => {
    const s = typeof raw === 'string' ? JSON.parse(raw) : raw;
    setBgColor(s.bgColor);
    setFrameId(s.frameId);
    setLayers(s.layers);
  };

  const commitMutation = (mutator) => {
    setPast((p) => [...p, snap()].slice(-35));
    setFuture([]);
    mutator();
  };

  const undo = () => {
    if (past.length === 0) return;
    const now = snap();
    const prev = past[past.length - 1];
    setFuture((f) => [now, ...f]);
    applySnap(prev);
    setPast((p) => p.slice(0, -1));
  };

  const redo = () => {
    if (future.length === 0) return;
    const now = snap();
    const next = future[0];
    setPast((p) => [...p, now]);
    applySnap(next);
    setFuture((f) => f.slice(1));
  };

  const revokeBlob = (url) => {
    if (url && url.startsWith('blob:')) {
      URL.revokeObjectURL(url);
      blobUrlsRef.current = blobUrlsRef.current.filter((u) => u !== url);
    }
  };

  const revokeAllBlobsInLayers = (list) => {
    list.forEach((L) => {
      if (L.type === 'photo' && L.src?.startsWith('blob:')) revokeBlob(L.src);
    });
  };

  const isDirty = step === 2
    || title.trim() !== ''
    || bgColor !== COLLAGE_DEFAULT_BG
    || frameId !== 'none'
    || layers.length > 0;

  const tryClose = () => {
    if (isDirty) setShowDiscard(true);
    else onClose();
  };

  const canSuivant = layers.length > 0;

  const stageFrameClass = `pn-collage-stage-frame pn-collage-frame--${frameId}`;

  useEffect(() => {
    if (!showMoreMenu) return;
    const close = () => setShowMoreMenu(false);
    document.addEventListener('pointerdown', close);
    return () => document.removeEventListener('pointerdown', close);
  }, [showMoreMenu]);

  const clearDrawOverlay = () => {
    const c = drawOverlayRef.current;
    if (!c) return;
    const ctx = c.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, c.width, c.height);
  };

  const fitDrawOverlay = () => {
    const stage = stageRef.current;
    const c = drawOverlayRef.current;
    if (!stage || !c) return;
    const r = stage.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    c.width = Math.max(1, Math.floor(r.width * dpr));
    c.height = Math.max(1, Math.floor(r.height * dpr));
    c.style.width = `${r.width}px`;
    c.style.height = `${r.height}px`;
    const ctx = c.getContext('2d');
    if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };

  const paintCommittedDrawings = () => {
    const stage = stageRef.current;
    const c = layersPaintRef.current;
    if (!stage || !c) return;
    const r = stage.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    c.width = Math.max(1, Math.floor(r.width * dpr));
    c.height = Math.max(1, Math.floor(r.height * dpr));
    c.style.width = `${r.width}px`;
    c.style.height = `${r.height}px`;
    const ctx = c.getContext('2d');
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, r.width, r.height);
    const W = r.width;
    const H = r.height;
    layers.filter((l) => l.type === 'drawing').forEach((layer) => {
      layer.paths?.forEach((path) => {
        const pts = path.points;
        if (!pts || pts.length < 2) return;
        ctx.strokeStyle = path.color || '#111827';
        ctx.lineWidth = Math.max(1.2, (path.lineWidth || 0.004) * W);
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.beginPath();
        ctx.moveTo(pts[0].x * W, pts[0].y * H);
        for (let i = 1; i < pts.length; i++) {
          ctx.lineTo(pts[i].x * W, pts[i].y * H);
        }
        ctx.stroke();
      });
    });
  };

  useEffect(() => {
    fitDrawOverlay();
    paintCommittedDrawings();
    const ro = new ResizeObserver(() => {
      fitDrawOverlay();
      paintCommittedDrawings();
    });
    if (stageRef.current) ro.observe(stageRef.current);
    return () => ro.disconnect();
  }, [layers, frameId, bgColor]);

  const addTextLayer = () => {
    const tc = nextTextColor;
    const tf = Math.max(14, Math.min(96, Number(nextTextSize) || 26));
    commitMutation(() => {
      const id = collageLayerId();
      setLayers((prev) => [...prev, {
        id,
        type: 'text',
        text: 'Double-cliquez pour modifier',
        x: 0.12,
        y: 0.42,
        fontSize: tf,
        color: tc,
      }]);
      setSelectedId(id);
      setActiveTool('text');
    });
  };

  const addPhotoFromFiles = (e) => {
    const files = [...(e.target.files || [])].filter((f) => f.type.startsWith('image/'));
    e.target.value = '';
    if (files.length === 0) return;
    commitMutation(() => {
      setLayers((prev) => {
        if (prev.length >= COLLAGE_MAX_LAYERS) return prev;
        const next = [...prev];
        let i = 0;
        for (const file of files) {
          if (next.length >= COLLAGE_MAX_LAYERS) break;
          const url = URL.createObjectURL(file);
          blobUrlsRef.current.push(url);
          const idx = next.length;
          next.push({
            id: collageLayerId(),
            type: 'photo',
            src: url,
            x: 0.08 + (idx % 2) * 0.12 + i * 0.02,
            y: 0.14 + (idx % 3) * 0.08,
            w: 0.52,
            h: 0.36,
            rotation: 0,
          });
          i += 1;
        }
        return next;
      });
    });
    setActiveTool('photo');
  };

  const deleteSelectedLayer = () => {
    if (selectedId === 'bg') return;
    const layer = layers.find((l) => l.id === selectedId);
    if (!layer) return;
    commitMutation(() => {
      if (layer.type === 'photo') revokeBlob(layer.src);
      setLayers((prev) => prev.filter((l) => l.id !== selectedId));
      setSelectedId('bg');
    });
  };

  const onStagePointerDownDraw = (e) => {
    if (activeTool !== 'draw' || step !== 1) return;
    e.preventDefault();
    fitDrawOverlay();
    const stage = stageRef.current;
    const c = drawOverlayRef.current;
    if (!stage || !c) return;
    const rect = stage.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const pxLineWidth = Math.max(1.2, nextDrawLineWidth * rect.width);
    strokeRef.current = { points: [[x, y]], color: nextDrawColor, lw: pxLineWidth };
    const ctx = c.getContext('2d');
    if (!ctx) return;

    const onMove = (ev) => {
      if (!strokeRef.current) return;
      const xx = ev.clientX - rect.left;
      const yy = ev.clientY - rect.top;
      strokeRef.current.points.push([xx, yy]);
      ctx.strokeStyle = strokeRef.current.color;
      ctx.lineWidth = strokeRef.current.lw;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      const pts = strokeRef.current.points;
      if (pts.length >= 2) {
        ctx.beginPath();
        ctx.moveTo(pts[pts.length - 2][0], pts[pts.length - 2][1]);
        ctx.lineTo(pts[pts.length - 1][0], pts[pts.length - 1][1]);
        ctx.stroke();
      }
    };

    const onUp = () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      const stroke = strokeRef.current;
      strokeRef.current = null;
      if (!stroke || stroke.points.length < 2) {
        clearDrawOverlay();
        return;
      }
      const w = rect.width;
      const h = rect.height;
      const norm = stroke.points.map(([px, py]) => ({ x: px / w, y: py / h }));
      commitMutation(() => {
        setLayers((prev) => [...prev, {
          id: collageLayerId(),
          type: 'drawing',
          paths: [{ points: norm, color: stroke.color, lineWidth: nextDrawLineWidth }],
        }]);
      });
      clearDrawOverlay();
    };

    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  };

  const onLayerPointerDown = (e, layer) => {
    if (step !== 1 || activeTool === 'draw') return;
    e.stopPropagation();
    setSelectedId(layer.id);
    const stage = stageRef.current;
    if (!stage) return;
    const rect = stage.getBoundingClientRect();
    const nx = (e.clientX - rect.left) / rect.width;
    const ny = (e.clientY - rect.top) / rect.height;
    dragRef.current = {
      id: layer.id,
      startNX: nx,
      startNY: ny,
      ox: layer.x,
      oy: layer.y,
    };
    setPast((p) => [...p, snap()].slice(-35));
    setFuture([]);

    const onMove = (ev) => {
      if (!dragRef.current) return;
      const r = stage.getBoundingClientRect();
      const nnx = (ev.clientX - r.left) / r.width;
      const nny = (ev.clientY - r.top) / r.height;
      const d = dragRef.current;
      const dx = nnx - d.startNX;
      const dy = nny - d.startNY;
      setLayers((prev) => prev.map((L) => (
        L.id === d.id ? { ...L, x: d.ox + dx, y: d.oy + dy } : L
      )));
    };

    const onUp = () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      dragRef.current = null;
    };

    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  };

  const startPhotoResize = (layer, corner) => {
    const stage = stageRef.current;
    if (!stage) return;
    const minS = 0.05;
    const L0 = { x: layer.x, y: layer.y, w: layer.w, h: layer.h };
    setPast((p) => [...p, snap()].slice(-35));
    setFuture([]);

    const onMove = (ev) => {
      const r = stage.getBoundingClientRect();
      const nx = (ev.clientX - r.left) / r.width;
      const ny = (ev.clientY - r.top) / r.height;
      let { x, y, w, h } = L0;
      if (corner === 'nw') {
        const fixedR = L0.x + L0.w;
        const fixedB = L0.y + L0.h;
        w = Math.max(minS, fixedR - nx);
        h = Math.max(minS, fixedB - ny);
        x = fixedR - w;
        y = fixedB - h;
      } else if (corner === 'ne') {
        const fixedL = L0.x;
        const fixedB = L0.y + L0.h;
        w = Math.max(minS, nx - fixedL);
        h = Math.max(minS, fixedB - ny);
        x = fixedL;
        y = fixedB - h;
      } else if (corner === 'sw') {
        const fixedR = L0.x + L0.w;
        const fixedT = L0.y;
        w = Math.max(minS, fixedR - nx);
        h = Math.max(minS, ny - fixedT);
        x = fixedR - w;
        y = fixedT;
      } else if (corner === 'se') {
        const fixedL = L0.x;
        const fixedT = L0.y;
        w = Math.max(minS, nx - fixedL);
        h = Math.max(minS, ny - fixedT);
        x = fixedL;
        y = fixedT;
      }
      x = Math.max(0, Math.min(1 - minS, x));
      y = Math.max(0, Math.min(1 - minS, y));
      w = Math.max(minS, Math.min(1 - x, w));
      h = Math.max(minS, Math.min(1 - y, h));
      setLayers((prev) => prev.map((Li) => (
        Li.id === layer.id ? { ...Li, x, y, w, h, rotation: Li.rotation ?? 0 } : Li
      )));
    };

    const onUp = () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  };

  const startPhotoRotate = (e, layer) => {
    const stage = stageRef.current;
    if (!stage) return;
    const rect = stage.getBoundingClientRect();
    const cx = rect.left + (layer.x + layer.w / 2) * rect.width;
    const cy = rect.top + (layer.y + layer.h / 2) * rect.height;
    const startAngle = Math.atan2(e.clientY - cy, e.clientX - cx);
    const startRot = Number(layer.rotation) || 0;
    setPast((p) => [...p, snap()].slice(-35));
    setFuture([]);

    const onMove = (ev) => {
      const ang = Math.atan2(ev.clientY - cy, ev.clientX - cx);
      let deltaDeg = ((ang - startAngle) * 180) / Math.PI;
      if (deltaDeg > 180) deltaDeg -= 360;
      if (deltaDeg < -180) deltaDeg += 360;
      let newR = startRot + deltaDeg;
      newR = ((newR % 360) + 360) % 360;
      setLayers((prev) => prev.map((Li) => (
        Li.id === layer.id ? { ...Li, rotation: newR } : Li
      )));
    };

    const onUp = () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  };

  const onPhotoLayerPointerDown = (e, layer) => {
    if (step !== 1 || activeTool === 'draw') return;
    e.stopPropagation();
    const handleEl = e.target?.closest?.('[data-photo-handle]');
    const handle = handleEl?.getAttribute?.('data-photo-handle');
    if (handle === 'nw' || handle === 'ne' || handle === 'sw' || handle === 'se') {
      e.preventDefault();
      setSelectedId(layer.id);
      startPhotoResize(layer, handle);
      return;
    }
    if (handle === 'rotate') {
      e.preventDefault();
      setSelectedId(layer.id);
      startPhotoRotate(e, layer);
      return;
    }
    onLayerPointerDown(e, layer);
  };

  const handlePublish = async () => {
    if (!title.trim()) {
      window.alert('Donnez un titre à votre collage.');
      return;
    }
    if (!board) {
      window.alert('Créez d’abord un tableau pour enregistrer ce collage.');
      return;
    }
    if (publishStatus === 'scheduled' && !scheduledAt) {
      window.alert('Choisissez une date de programmation.');
      return;
    }
    setStitching(true);
    try {
      const imageUrl = await exportCollageToDataUrl({ bgColor, frameId, layers });
      if (!imageUrl) throw new Error('export failed');
      onSave({
        id: `pin-${Date.now()}`,
        title: title.trim(),
        author: 'Vous',
        description: description.trim() || 'Collage — fond, texte, dessin et photos.',
        board,
        link: '',
        imageUrl,
        likes: 0,
        comments: 0,
        saves: 0,
        views: 0,
        status: publishStatus,
        scheduled: publishStatus === 'scheduled' ? scheduledAt : null,
      });
      revokeAllBlobsInLayers(layers);
      onClose();
    } catch {
      window.alert('Impossible d’exporter le collage. Réessayez.');
    } finally {
      setStitching(false);
    }
  };

  const resetEditor = () => {
    commitMutation(() => {
      revokeAllBlobsInLayers(layers);
      setLayers([]);
      setBgColor(COLLAGE_DEFAULT_BG);
      setFrameId('none');
      setSelectedId('bg');
    });
    setShowMoreMenu(false);
  };

  const selectedLayer = layers.find((l) => l.id === selectedId);

  useEffect(() => {
    if (selectedLayer?.type === 'text' && selectedLayer.color) {
      setNextTextColor(selectedLayer.color);
    }
  }, [selectedLayer?.id, selectedLayer?.type, selectedLayer?.color]);

  useEffect(() => {
    if (selectedLayer?.type === 'text' && Number.isFinite(selectedLayer.fontSize)) {
      setNextTextSize(Math.max(14, Math.min(96, Number(selectedLayer.fontSize))));
    }
  }, [selectedLayer?.id, selectedLayer?.type, selectedLayer?.fontSize]);

  useEffect(() => {
    if (selectedLayer?.type === 'drawing') {
      const drawColor = selectedLayer.paths?.[selectedLayer.paths.length - 1]?.color;
      if (drawColor) setNextDrawColor(drawColor);
      const drawWidth = selectedLayer.paths?.[selectedLayer.paths.length - 1]?.lineWidth;
      if (Number.isFinite(drawWidth)) setNextDrawLineWidth(Math.max(0.0015, Math.min(0.012, Number(drawWidth))));
    }
  }, [selectedLayer?.id, selectedLayer?.type, selectedLayer?.paths]);

  return (
    <div className="pn-modal-overlay pn-collage-overlay" onClick={tryClose}>
      <div className="pn-collage-app" onClick={(e) => e.stopPropagation()}>
        {step === 1 && (
          <>
            <header className="pn-collage-topbar">
              <div className="pn-collage-topbar-left">
                <button type="button" className="pn-icon-btn" aria-label="Fermer" onClick={tryClose}>
                  <X size={22} />
                </button>
                <h1 className="pn-collage-title">Créer un collage</h1>
              </div>
              <div className="pn-collage-topbar-right">
                <button type="button" className="pn-icon-btn" aria-label="Annuler" disabled={past.length === 0} onClick={undo}>
                  <Undo2 size={20} />
                </button>
                <button type="button" className="pn-icon-btn" aria-label="Rétablir" disabled={future.length === 0} onClick={redo}>
                  <Redo2 size={20} />
                </button>
                <div className="pn-collage-more-wrap">
                  <button
                    type="button"
                    className="pn-icon-btn"
                    aria-label="Plus d’options"
                    aria-expanded={showMoreMenu}
                    onClick={(e) => { e.stopPropagation(); setShowMoreMenu((v) => !v); }}
                  >
                    <MoreHorizontal size={20} />
                  </button>
                  {showMoreMenu && (
                    <div className="pn-collage-more-menu" role="menu" onPointerDown={(e) => e.stopPropagation()}>
                      <button type="button" role="menuitem" onClick={resetEditor}>Réinitialiser le collage</button>
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  className="pn-collage-suivant"
                  disabled={!canSuivant}
                  onClick={() => setStep(2)}
                >
                  Suivant
                </button>
              </div>
            </header>

            <div className="pn-collage-workspace">
              <aside className="pn-collage-sidebar">
                <div className="pn-collage-sidebar-header">
                  <h2 className="pn-collage-sidebar-title">Découpages</h2>
                  <p className="pn-collage-sidebar-hint">
                    Sélectionnez un découpage à modifier ou à faire glisser pour réorganiser.
                  </p>
                </div>

                <div className="pn-collage-panel">
                  <div className="pn-collage-layer-list">
                    <button
                      type="button"
                      className={`pn-collage-layer-row ${selectedId === 'bg' ? 'is-selected' : ''}`}
                      onClick={() => { setSelectedId('bg'); setActiveTool(null); }}
                    >
                      <Lock size={14} className="pn-collage-layer-lock" aria-hidden />
                      <span className="pn-collage-layer-thumb pn-collage-layer-thumb-dots" aria-hidden />
                      <span className="pn-collage-layer-name">Arrière-plan</span>
                    </button>
                    {layers.map((layer) => (
                      <button
                        key={layer.id}
                        type="button"
                        className={`pn-collage-layer-row ${selectedId === layer.id ? 'is-selected' : ''}`}
                        onClick={() => { setSelectedId(layer.id); setActiveTool(null); }}
                      >
                        <span className="pn-collage-layer-thumb" aria-hidden>
                          {layer.type === 'photo' && <img src={layer.src} alt="" />}
                          {layer.type === 'text' && <Type size={16} />}
                          {layer.type === 'drawing' && <PencilLine size={16} />}
                        </span>
                        <span className="pn-collage-layer-name">{collageLayerLabel(layer)}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {selectedId === 'bg' && (
                  <div className="pn-collage-side-controls pn-collage-panel">
                    <span className="pn-collage-control-label">Couleur du fond</span>
                    <div className="pn-collage-color-row">
                      {['#e8eaed', '#ffffff', '#fef3c7', '#dbeafe', '#fce7f3', '#d1fae5', '#111827'].map((c) => (
                        <button
                          key={c}
                          type="button"
                          className={`pn-collage-swatch ${bgColor === c ? 'is-active' : ''}`}
                          style={{ background: c }}
                          aria-label={`Couleur ${c}`}
                          onClick={() => commitMutation(() => setBgColor(c))}
                        />
                      ))}
                    </div>
                    <label className="pn-collage-color-native">
                      <span>Autre couleur</span>
                      <input
                        type="color"
                        value={bgColor}
                        onChange={(e) => commitMutation(() => setBgColor(e.target.value))}
                      />
                    </label>

                    <span className="pn-collage-control-label">Cadre</span>
                    <div className="pn-collage-frame-chips">
                      {COLLAGE_FRAMES.map((f) => (
                        <button
                          key={f.id}
                          type="button"
                          className={`pn-collage-frame-chip ${frameId === f.id ? 'is-active' : ''}`}
                          onClick={() => commitMutation(() => setFrameId(f.id))}
                        >
                          {f.label}
                        </button>
                      ))}
                    </div>
                    {activeTool === 'draw' && (
                      <>
                        <span className="pn-collage-control-label">Couleur du crayon</span>
                        <div className="pn-collage-ink-swatches" role="group" aria-label="Couleurs du crayon">
                          {COLLAGE_INK_SWATCHES.map((c) => (
                            <button
                              key={c}
                              type="button"
                              className={`pn-collage-ink-swatch ${nextDrawColor === c ? 'is-active' : ''}`}
                              style={{ background: c }}
                              title={c}
                              aria-label={`Couleur ${c}`}
                              onClick={() => setNextDrawColor(c)}
                            />
                          ))}
                          <label className="pn-collage-ink-picker pn-collage-ink-picker-sidebar">
                            <span className="pn-sr-only">Autre couleur du crayon</span>
                            <input
                              type="color"
                              value={nextDrawColor}
                              onChange={(e) => setNextDrawColor(e.target.value)}
                            />
                          </label>
                        </div>
                        <span className="pn-collage-control-label">Taille du crayon</span>
                        <div className="pn-collage-size-row">
                          <input
                            className="pn-collage-size-slider"
                            type="range"
                            min="0.0015"
                            max="0.012"
                            step="0.0005"
                            value={nextDrawLineWidth}
                            onChange={(e) => setNextDrawLineWidth(Number(e.target.value))}
                            aria-label="Taille du crayon"
                          />
                          <span className="pn-collage-size-value">
                            {Math.round(nextDrawLineWidth * 1000)}
                          </span>
                        </div>
                      </>
                    )}
                  </div>
                )}

                {selectedId !== 'bg' && selectedLayer && (
                  <div className="pn-collage-side-controls pn-collage-panel">
                    {selectedLayer.type === 'text' && (
                      <>
                        <label className="pn-label">Texte</label>
                        <input
                          className="pn-input"
                          value={selectedLayer.text}
                          onChange={(e) => {
                            const v = e.target.value;
                            setLayers((prev) => prev.map((L) => (L.id === selectedId ? { ...L, text: v } : L)));
                          }}
                          onBlur={() => {
                            setPast((p) => [...p, snap()].slice(-35));
                            setFuture([]);
                          }}
                          maxLength={120}
                        />
                        <span className="pn-collage-control-label">Taille du texte</span>
                        <div className="pn-collage-size-row">
                          <input
                            className="pn-collage-size-slider"
                            type="range"
                            min="14"
                            max="96"
                            step="1"
                            value={selectedLayer.fontSize ?? nextTextSize}
                            onChange={(e) => {
                              const v = Number(e.target.value);
                              setNextTextSize(v);
                              commitMutation(() => {
                                setLayers((prev) => prev.map((L) => (
                                  L.id === selectedId ? { ...L, fontSize: v } : L
                                )));
                              });
                            }}
                            aria-label="Taille du texte"
                          />
                          <span className="pn-collage-size-value">{Math.round(selectedLayer.fontSize ?? nextTextSize)} px</span>
                        </div>
                        <span className="pn-collage-control-label">Couleur du texte</span>
                        <div className="pn-collage-ink-swatches" role="group" aria-label="Couleurs rapides">
                          {COLLAGE_INK_SWATCHES.map((c) => (
                            <button
                              key={c}
                              type="button"
                              className={`pn-collage-ink-swatch ${selectedLayer.color === c ? 'is-active' : ''}`}
                              style={{ background: c }}
                              title={c}
                              aria-label={`Couleur ${c}`}
                              onClick={() => {
                                const v = c;
                                setNextTextColor(v);
                                commitMutation(() => {
                                  setLayers((prev) => prev.map((L) => (
                                    L.id === selectedId ? { ...L, color: v } : L
                                  )));
                                });
                              }}
                            />
                          ))}
                          <label className="pn-collage-ink-picker pn-collage-ink-picker-sidebar">
                            <span className="pn-sr-only">Autre couleur</span>
                            <input
                              type="color"
                              value={selectedLayer.color}
                              onChange={(e) => {
                                const v = e.target.value;
                                setNextTextColor(v);
                                commitMutation(() => {
                                  setLayers((prev) => prev.map((L) => (
                                    L.id === selectedId ? { ...L, color: v } : L
                                  )));
                                });
                              }}
                            />
                          </label>
                        </div>
                      </>
                    )}
                    {selectedLayer.type === 'drawing' && (
                      <>
                        <span className="pn-collage-control-label">Couleur du crayon</span>
                        <div className="pn-collage-ink-swatches" role="group" aria-label="Couleurs du crayon">
                          {COLLAGE_INK_SWATCHES.map((c) => (
                            <button
                              key={c}
                              type="button"
                              className={`pn-collage-ink-swatch ${nextDrawColor === c ? 'is-active' : ''}`}
                              style={{ background: c }}
                              title={c}
                              aria-label={`Couleur ${c}`}
                              onClick={() => {
                                const v = c;
                                setNextDrawColor(v);
                                commitMutation(() => {
                                  setLayers((prev) => prev.map((L) => (
                                    L.id === selectedId
                                      ? { ...L, paths: (L.paths || []).map((p) => ({ ...p, color: v })) }
                                      : L
                                  )));
                                });
                              }}
                            />
                          ))}
                          <label className="pn-collage-ink-picker pn-collage-ink-picker-sidebar">
                            <span className="pn-sr-only">Autre couleur du crayon</span>
                            <input
                              type="color"
                              value={nextDrawColor}
                              onChange={(e) => {
                                const v = e.target.value;
                                setNextDrawColor(v);
                                commitMutation(() => {
                                  setLayers((prev) => prev.map((L) => (
                                    L.id === selectedId
                                      ? { ...L, paths: (L.paths || []).map((p) => ({ ...p, color: v })) }
                                      : L
                                  )));
                                });
                              }}
                            />
                          </label>
                        </div>
                        <span className="pn-collage-control-label">Taille du crayon</span>
                        <div className="pn-collage-size-row">
                          <input
                            className="pn-collage-size-slider"
                            type="range"
                            min="0.0015"
                            max="0.012"
                            step="0.0005"
                            value={nextDrawLineWidth}
                            onChange={(e) => {
                              const v = Number(e.target.value);
                              setNextDrawLineWidth(v);
                              commitMutation(() => {
                                setLayers((prev) => prev.map((L) => (
                                  L.id === selectedId
                                    ? { ...L, paths: (L.paths || []).map((p) => ({ ...p, lineWidth: v })) }
                                    : L
                                )));
                              });
                            }}
                            aria-label="Taille du crayon"
                          />
                          <span className="pn-collage-size-value">
                            {Math.round(nextDrawLineWidth * 1000)}
                          </span>
                        </div>
                      </>
                    )}
                    <button type="button" className="pn-btn pn-btn-outline pn-collage-delete-layer" onClick={deleteSelectedLayer}>
                      <Trash2 size={14} /> Supprimer ce calque
                    </button>
                  </div>
                )}
              </aside>

              <div className="pn-collage-canvas-col">
                <div className={stageFrameClass}>
                  <div
                    ref={stageRef}
                    className={`pn-collage-stage pn-collage-stage-dots${activeTool === 'draw' ? ' is-draw-tool' : ''}`}
                    style={{ backgroundColor: bgColor }}
                    onPointerDown={(e) => {
                      if (activeTool === 'draw') onStagePointerDownDraw(e);
                      else setSelectedId('bg');
                    }}
                  >
                    <canvas ref={layersPaintRef} className="pn-collage-layers-paint" aria-hidden />
                    <div className="pn-collage-dots-overlay" aria-hidden />
                    {layers.map((layer) => {
                      if (layer.type === 'photo') {
                        const rot = Number(layer.rotation) || 0;
                        return (
                          <div
                            key={layer.id}
                            className={`pn-collage-float pn-collage-float-photo ${selectedId === layer.id ? 'is-selected' : ''}`}
                            style={{
                              left: `${layer.x * 100}%`,
                              top: `${layer.y * 100}%`,
                              width: `${layer.w * 100}%`,
                              height: `${layer.h * 100}%`,
                              transform: rot !== 0 ? `rotate(${rot}deg)` : undefined,
                              transformOrigin: 'center center',
                            }}
                            onPointerDown={(e) => onPhotoLayerPointerDown(e, layer)}
                          >
                            <img src={layer.src} alt="" draggable={false} />
                            {selectedId === layer.id && (
                              <div className="pn-photo-selection" aria-hidden>
                                <div className="pn-photo-selection-border" />
                                <button
                                  type="button"
                                  className="pn-photo-handle pn-photo-handle-nw"
                                  data-photo-handle="nw"
                                  aria-label="Redimensionner depuis le coin haut gauche"
                                />
                                <button
                                  type="button"
                                  className="pn-photo-handle pn-photo-handle-ne"
                                  data-photo-handle="ne"
                                  aria-label="Redimensionner depuis le coin haut droit"
                                />
                                <button
                                  type="button"
                                  className="pn-photo-handle pn-photo-handle-sw"
                                  data-photo-handle="sw"
                                  aria-label="Redimensionner depuis le coin bas gauche"
                                />
                                <button
                                  type="button"
                                  className="pn-photo-handle pn-photo-handle-se"
                                  data-photo-handle="se"
                                  aria-label="Redimensionner depuis le coin bas droit"
                                />
                                <div className="pn-photo-rotate-arm" />
                                <button
                                  type="button"
                                  className="pn-photo-handle pn-photo-handle-rotate"
                                  data-photo-handle="rotate"
                                  aria-label="Pivoter la photo"
                                />
                              </div>
                            )}
                          </div>
                        );
                      }
                      if (layer.type === 'text') {
                        return (
                          <div
                            key={layer.id}
                            className={`pn-collage-float pn-collage-float-text ${selectedId === layer.id ? 'is-selected' : ''}`}
                            style={{
                              left: `${layer.x * 100}%`,
                              top: `${layer.y * 100}%`,
                              fontSize: `${layer.fontSize}px`,
                              color: layer.color,
                            }}
                            onPointerDown={(e) => onLayerPointerDown(e, layer)}
                          >
                            {layer.text}
                          </div>
                        );
                      }
                      return null;
                    })}
                    <canvas
                      ref={drawOverlayRef}
                      className="pn-collage-draw-overlay"
                      aria-hidden
                    />
                  </div>
                </div>

                <div className="pn-collage-dock" role="toolbar" aria-label="Outils collage">
                  <button
                    type="button"
                    className={`pn-collage-dock-btn ${activeTool === 'text' ? 'is-active' : ''}`}
                    aria-label="Texte"
                    onClick={() => { setActiveTool('text'); addTextLayer(); }}
                  >
                    <Type size={26} strokeWidth={1.75} />
                  </button>
                  <button
                    type="button"
                    className={`pn-collage-dock-btn ${activeTool === 'draw' ? 'is-active' : ''}`}
                    aria-label="Dessiner"
                    onClick={() => setActiveTool((t) => (t === 'draw' ? null : 'draw'))}
                  >
                    <PencilLine size={26} strokeWidth={1.75} />
                  </button>
                  <button
                    type="button"
                    className={`pn-collage-dock-btn ${activeTool === 'photo' ? 'is-active' : ''}`}
                    aria-label="Photo"
                    onClick={() => { setActiveTool('photo'); fileInputRef.current?.click(); }}
                  >
                    <Image size={26} strokeWidth={1.75} />
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    className="pn-collage-file-input"
                    onChange={addPhotoFromFiles}
                  />
                </div>
                {activeTool === 'draw' && (
                  <p className="pn-collage-draw-hint">Tracez sur la toile avec la souris ou le doigt.</p>
                )}
              </div>
            </div>
          </>
        )}

        {step === 2 && (
          <div className="pn-collage-step2">
            <header className="pn-collage-topbar">
              <div className="pn-collage-topbar-left">
                <button type="button" className="pn-icon-btn" aria-label="Retour" onClick={() => setStep(1)}>
                  <ArrowLeft size={22} />
                </button>
                <h1 className="pn-collage-title">Publier le collage</h1>
              </div>
            </header>
            <div className="pn-collage-step2-body">
              <label className="pn-label">Titre</label>
              <input className="pn-input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex. : Moodboard idées" maxLength={100} />
              <label className="pn-label">Description</label>
              <textarea
                className="pn-textarea pn-collage-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Ajoutez une description de votre collage"
                rows={4}
                maxLength={500}
              />
              <span className="pn-char">{description.length}/500</span>
              <label className="pn-label">Tableau</label>
              <select className="pn-select" value={board} onChange={(e) => setBoard(e.target.value)} disabled={boards.length === 0}>
                {boards.length === 0
                  ? <option value="">Aucun tableau créé</option>
                  : boards.map((b) => <option key={b.id} value={b.name}>{b.name}</option>)}
              </select>
              <label className="pn-label">Action de publication</label>
              <div className="pn-status-row pn-collage-status-row">
                <button
                  type="button"
                  className={`pn-status-option pn-collage-status-option ${publishStatus === 'published' ? 'active' : ''}`}
                  style={publishStatus === 'published' ? { borderColor: STATUS_CONFIG.published.color, background: STATUS_CONFIG.published.bg, color: STATUS_CONFIG.published.color } : {}}
                  onClick={() => setPublishStatus('published')}
                >
                  🚀 Publier
                </button>
                <button
                  type="button"
                  className={`pn-status-option pn-collage-status-option ${publishStatus === 'scheduled' ? 'active' : ''}`}
                  style={publishStatus === 'scheduled' ? { borderColor: STATUS_CONFIG.scheduled.color, background: STATUS_CONFIG.scheduled.bg, color: STATUS_CONFIG.scheduled.color } : {}}
                  onClick={() => setPublishStatus('scheduled')}
                >
                  📅 Programmer
                </button>
                <button
                  type="button"
                  className={`pn-status-option pn-collage-status-option ${publishStatus === 'draft' ? 'active' : ''}`}
                  style={publishStatus === 'draft' ? { borderColor: STATUS_CONFIG.draft.color, background: STATUS_CONFIG.draft.bg, color: STATUS_CONFIG.draft.color } : {}}
                  onClick={() => setPublishStatus('draft')}
                >
                  📝 Brouillon
                </button>
              </div>
              {publishStatus === 'scheduled' && (
                <>
                  <label className="pn-label">Date de programmation</label>
                  <input
                    className="pn-input"
                    type="datetime-local"
                    value={scheduledAt}
                    onChange={(e) => setScheduledAt(e.target.value)}
                  />
                </>
              )}
              <div className="pn-collage-step2-actions">
                <button type="button" className="pn-btn pn-btn-ghost" onClick={tryClose} disabled={stitching}>Annuler</button>
                <button type="button" className="pn-btn pn-btn-primary" onClick={handlePublish} disabled={stitching}>
                  {stitching
                    ? 'Publication…'
                    : publishStatus === 'scheduled'
                      ? 'Programmer'
                      : publishStatus === 'draft'
                        ? 'Enregistrer brouillon'
                        : 'Publier'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <DiscardConfirmDialog
        open={showDiscard}
        onContinue={() => setShowDiscard(false)}
        onAbandon={() => {
          setShowDiscard(false);
          revokeAllBlobsInLayers(layers);
          onClose();
        }}
      />
    </div>
  );
}

/* ── Create / Edit Modal ──────────────────────────────────────────────────── */
function CreateEditModal({ pin, onClose, onSave, boards }) {
  const isEdit = !!pin;
  const [showDiscard, setShowDiscard] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [form, setForm] = useState({
    title: pin?.title || '',
    description: '',
    board: pin?.board || boards[0]?.name || '',
    link: '',
    imageUrl: pin?.imageUrl || '',
    status: pin?.status || 'published',
    scheduled: pin?.scheduled || '',
  });
  const touch = () => setDirty(true);
  const set = (k, v) => {
    touch();
    setForm(f => ({ ...f, [k]: v }));
  };

  useEffect(() => {
    if (!form.board && boards.length > 0) {
      setForm(f => ({ ...f, board: boards[0].name }));
    }
  }, [boards, form.board]);

  const tryClose = () => {
    if (dirty) setShowDiscard(true);
    else onClose();
  };

  const handleSave = () => {
    if (!form.title.trim()) return alert('Titre requis');
    if (!form.board) return alert('Creez d abord un tableau');
    if (form.status === 'scheduled' && !form.scheduled) {
      return alert('Choisissez une date pour programmer');
    }
    const scheduled = form.status === 'scheduled' ? form.scheduled : null;
    onSave({ ...pin, ...form, scheduled, id: pin?.id || `pin-${Date.now()}` });
    onClose();
  };

  return (
    <div className="pn-modal-overlay" onClick={tryClose}>
      <div className="pn-modal" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="pn-modal-header">
          <h2>{isEdit ? 'Modifier l\'épingle' : 'Créer une épingle'}</h2>
          <button type="button" className="pn-icon-btn" onClick={tryClose}><X size={18} /></button>
        </div>

        <div className="pn-modal-body">
          <div className="pn-form-grid">
            {/* Image preview / upload */}
            <div className="pn-image-upload">
              {form.imageUrl
                ? <img src={form.imageUrl} alt="preview" />
                : <div className="pn-image-placeholder"><Image size={32} /><span>Ajouter une image</span></div>
              }
              <div className="pn-image-actions">
                <button className="pn-btn-sm pn-btn-outline"><Upload size={14} /> Importer</button>
                <button className="pn-btn-sm pn-btn-outline"><Link size={14} /> URL</button>
              </div>
            </div>

            {/* Fields */}
            <div className="pn-fields">
              <label className="pn-label">Titre *</label>
              <input className="pn-input" value={form.title} onChange={e => set('title', e.target.value)} placeholder="Titre accrocheur…" maxLength={100} />
              <span className="pn-char">{form.title.length}/100</span>

              <label className="pn-label">Description</label>
              <textarea className="pn-textarea" value={form.description} onChange={e => set('description', e.target.value)} placeholder="Décrivez votre épingle…" rows={3} maxLength={500} />
              <span className="pn-char">{form.description.length}/500</span>

              <label className="pn-label">Tableau</label>
                <select className="pn-select" value={form.board} onChange={e => set('board', e.target.value)} disabled={boards.length === 0}>
                  {boards.length === 0
                    ? <option value="">Aucun tableau cree</option>
                    : boards.map((b) => <option key={b.id} value={b.name}>{b.name}</option>)}
              </select>

              <label className="pn-label">Lien de destination</label>
              <input className="pn-input" value={form.link} onChange={e => set('link', e.target.value)} placeholder="https://…" />

              <label className="pn-label">Statut</label>
              <div className="pn-status-row">
                {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
                  <button
                    type="button"
                    key={key}
                    className={`pn-status-option ${form.status === key ? 'active' : ''}`}
                    style={form.status === key ? { borderColor: cfg.color, background: cfg.bg, color: cfg.color } : {}}
                    onClick={() => {
                      touch();
                      setForm(f => ({
                        ...f,
                        status: key,
                        scheduled: key === 'scheduled' ? f.scheduled : '',
                      }));
                    }}
                  >
                    {cfg.label}
                  </button>
                ))}
              </div>

              {form.status === 'scheduled' && (
                <>
                  <label className="pn-label">Date de programmation</label>
                  <input
                    className="pn-input"
                    type="datetime-local"
                    value={form.scheduled}
                    onChange={e => set('scheduled', e.target.value)}
                  />
                </>
              )}
            </div>
          </div>
        </div>

        <div className="pn-modal-footer">
          <button type="button" className="pn-btn pn-btn-ghost" onClick={tryClose}>Annuler</button>
          <button type="button" className="pn-btn pn-btn-primary" onClick={handleSave}>
            {form.status === 'scheduled' ? '📅 Programmer' : form.status === 'draft' ? '📝 Enregistrer brouillon' : '🚀 Publier'}
          </button>
        </div>
      </div>
      <DiscardConfirmDialog
        open={showDiscard}
        onContinue={() => setShowDiscard(false)}
        onAbandon={() => {
          setShowDiscard(false);
          onClose();
        }}
      />
    </div>
  );
}

/* ── Analytics Modal ─────────────────────────────────────────────────────── */
function AnalyticsModal({ pin, onClose }) {
  const bars = [
    { label: 'Impressions', value: pin.views, max: 30000, color: '#e60023' },
    { label: 'Sauvegardes', value: pin.saves, max: 1000, color: '#6d28d9' },
    { label: 'J\'aime', value: pin.likes, max: 3000, color: '#db2777' },
    { label: 'Commentaires', value: pin.comments, max: 200, color: '#d97706' },
  ];
  return (
    <div className="pn-modal-overlay" onClick={onClose}>
      <div className="pn-modal pn-modal-sm" onClick={e => e.stopPropagation()}>
        <div className="pn-modal-header">
          <h2>📊 Analytics</h2>
          <button className="pn-icon-btn" onClick={onClose}><X size={18} /></button>
        </div>
        <div className="pn-analytics-pin-preview">
          <img src={pin.imageUrl} alt={pin.title} />
          <div>
            <strong>{pin.title}</strong>
            <span>{pin.board}</span>
            <StatusBadge status={pin.status} />
          </div>
        </div>
        <div className="pn-stats-grid">
          {bars.map(b => (
            <div key={b.label} className="pn-stat-card">
              <span className="pn-stat-value" style={{ color: b.color }}>{fmt(b.value)}</span>
              <span className="pn-stat-label">{b.label}</span>
              <div className="pn-stat-bar-bg">
                <div className="pn-stat-bar-fill" style={{ width: `${Math.min(100, (b.value / b.max) * 100)}%`, background: b.color }} />
              </div>
            </div>
          ))}
        </div>
        <div className="pn-taux">
          <span>Taux d'engagement</span>
          <strong style={{ color: '#e60023' }}>
            {(((pin.likes + pin.comments + pin.saves) / pin.views) * 100).toFixed(1)}%
          </strong>
        </div>
      </div>
    </div>
  );
}

/* ── Pin Viewer (fullscreen) ─────────────────────────────────────────────── */
function PinViewer({
  pins,
  activeIndex,
  deviceView,
  onClose,
  onNavigate,
  onSelectPin,
  isSaved,
  commentsByPin,
  onToggleSave,
  onAddComment,
  onEditPin,
  onDeletePin,
}) {
  const pin = pins[activeIndex];
  const [liked, setLiked] = useState(false);
  const relatedPins = pins.filter(p => p.id !== pin.id && p.status === 'published');
  const relatedVariant = (related, idx) => {
    const h = [...String(pin.id), ...String(related.id)].reduce((a, c) => a + c.charCodeAt(0), 0);
    const seed = (h + idx * 17) % 7;
    if (seed === 0) return 'p1';
    if (seed === 1) return 'p2';
    if (seed === 2) return 'p3';
    if (seed === 3) return 'p4';
    if (seed === 4) return 'p5';
    if (seed === 5) return 'p6';
    return 'p7';
  };
  const pinComments = commentsByPin[pin.id] || [];
  const [commentInput, setCommentInput] = useState('');
  const [commentsCollapsed, setCommentsCollapsed] = useState(false);
  const [likedCommentIds, setLikedCommentIds] = useState(() => new Set());
  const commentInputRef = useRef(null);
  const commentsBlockRef = useRef(null);
  const moreMenuRef = useRef(null);
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);

  const isDragging = useRef(false);
  const dragStartY = useRef(null);
  const touchStartY = useRef(null);

  useEffect(() => {
    setCommentInput('');
    setCommentsCollapsed(false);
    setLikedCommentIds(new Set());
    setMoreMenuOpen(false);
  }, [pin.id]);

  useEffect(() => {
    if (!moreMenuOpen) return;
    const close = (e) => {
      if (moreMenuRef.current && !moreMenuRef.current.contains(e.target)) {
        setMoreMenuOpen(false);
      }
    };
    const onKey = (e) => {
      if (e.key === 'Escape') setMoreMenuOpen(false);
    };
    document.addEventListener('mousedown', close);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', close);
      document.removeEventListener('keydown', onKey);
    };
  }, [moreMenuOpen]);

  const navigate = (deltaY) => {
    if (Math.abs(deltaY) < 50) return;
    onNavigate(deltaY < 0 ? 'next' : 'prev');
  };

  const isMobile = deviceView === 'Mobile';
  const handleCommentSubmit = () => {
    const next = commentInput.trim();
    if (!next) return;
    onAddComment(pin.id, next);
    setCommentInput('');
    setCommentsCollapsed(false);
    requestAnimationFrame(() => commentInputRef.current?.focus());
  };

  const toggleCommentLike = (commentId) => {
    setLikedCommentIds((prev) => {
      const next = new Set(prev);
      if (next.has(commentId)) next.delete(commentId);
      else next.add(commentId);
      return next;
    });
  };

  const handleReplyTo = (author) => {
    const handle = String(author || 'user').split(/\s+/)[0];
    setCommentInput(`@${handle} `);
    setCommentsCollapsed(false);
    commentInputRef.current?.focus();
  };

  const scrollToCommentsAndFocus = () => {
    setCommentsCollapsed(false);
    requestAnimationFrame(() => {
      commentsBlockRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      commentInputRef.current?.focus({ preventScroll: true });
    });
  };

  const handleSharePin = async () => {
    const title = pin.title || 'Épingle';
    const url = pin.imageUrl || '';
    try {
      if (typeof navigator !== 'undefined' && navigator.share) {
        await navigator.share({ title, text: title, url });
        return;
      }
    } catch (e) {
      if (e?.name === 'AbortError') return;
    }
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url || title);
      }
    } catch {
      /* ignore */
    }
  };

  return (
    <div className="pn-viewer-overlay">
      <div className={`pn-viewer ${isMobile ? 'mobile' : ''}`}>
        <div className="pn-viewer-content">
          <div className="pn-post-column">
            <section className="pn-post-panel">
              <div className="pn-post-topbar">
                <div className="pn-post-topbar-left">
                  <button type="button" className="pn-action-btn-circle pn-topbar-back" onClick={onClose} aria-label="Retour">
                    <ArrowLeft size={17} strokeWidth={2} />
                  </button>
                  <button
                    type="button"
                    className={`pn-action-like-pill ${liked ? 'liked' : ''}`}
                    onClick={() => setLiked((l) => !l)}
                    aria-pressed={liked}
                    aria-label="J’aime"
                  >
                    <Heart size={16} strokeWidth={1.75} fill={liked ? 'currentColor' : 'none'} />
                    <span>{fmt(pin.likes + (liked ? 1 : 0))}</span>
                  </button>
                  <button type="button" className="pn-action-btn-circle" aria-label="Commentaires" onClick={scrollToCommentsAndFocus}>
                    <MessageCircle size={17} strokeWidth={1.75} />
                  </button>
                  <button type="button" className="pn-action-btn-circle" aria-label="Partager" onClick={handleSharePin}>
                    <Upload size={17} strokeWidth={1.75} />
                  </button>
                  <div className="pn-topbar-more-wrap" ref={moreMenuRef}>
                    <button
                      type="button"
                      className={`pn-action-btn-more ${moreMenuOpen ? 'active' : ''}`}
                      aria-label="Plus d’options"
                      aria-expanded={moreMenuOpen}
                      aria-haspopup="true"
                      onClick={() => setMoreMenuOpen((v) => !v)}
                    >
                      <MoreHorizontal size={18} strokeWidth={2} />
                    </button>
                    {moreMenuOpen && (
                      <div className="pn-topbar-more-menu" role="menu">
                        <button
                          type="button"
                          className="pn-topbar-more-item"
                          role="menuitem"
                          onClick={() => {
                            setMoreMenuOpen(false);
                            onEditPin?.(pin);
                          }}
                        >
                          <Edit3 size={16} strokeWidth={2} aria-hidden />
                          Modifier
                        </button>
                        <button
                          type="button"
                          className="pn-topbar-more-item"
                          role="menuitem"
                          onClick={() => {
                            setMoreMenuOpen(false);
                            downloadRemoteImage(pin.imageUrl, pin.title);
                          }}
                        >
                          <Download size={16} strokeWidth={2} aria-hidden />
                          Télécharger
                        </button>
                        <button
                          type="button"
                          className="pn-topbar-more-item pn-topbar-more-item-danger"
                          role="menuitem"
                          onClick={() => {
                            setMoreMenuOpen(false);
                            onDeletePin?.(pin.id);
                          }}
                        >
                          <Trash2 size={16} strokeWidth={2} aria-hidden />
                          Supprimer
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                <div className="pn-post-topbar-right">
                  <button type="button" className={`pn-save-cta ${isSaved ? 'saved' : ''}`} onClick={() => onToggleSave(pin.id)}>
                    {isSaved ? 'Enregistré' : 'Enregistrer'}
                  </button>
                </div>
              </div>

              <div
                className={`pn-viewer-media ${isMobile ? 'gesture' : ''} ${isDragging.current ? 'dragging' : ''}`}
                onMouseDown={isMobile ? e => { isDragging.current = true; dragStartY.current = e.clientY; } : undefined}
                onMouseUp={isMobile ? e => { if (isDragging.current) navigate(dragStartY.current - e.clientY); isDragging.current = false; } : undefined}
                onMouseLeave={isMobile ? () => { isDragging.current = false; } : undefined}
                onTouchStart={isMobile ? e => { touchStartY.current = e.touches[0].clientY; } : undefined}
                onTouchEnd={isMobile ? e => { navigate(touchStartY.current - e.changedTouches[0].clientY); } : undefined}
              >
                <div className="pn-viewer-media-inner">
                  <img src={pin.imageUrl} alt={pin.title} />
                  <div className="pn-media-fab-stack">
                    <button className="pn-media-fab"><Expand size={15} /></button>
                    <button className="pn-media-fab"><RefreshCw size={15} /></button>
                  </div>
                </div>
              </div>

              <div className="pn-post-panel-scroll" aria-label="Détails et commentaires du post">
                <div className="pn-post-comments-wrap pn-post-comments-wrap-author">
                  <div className="pn-post-author-row">
                    <span className="pn-author-dot">{(pin.author || 'p').charAt(0).toUpperCase()}</span>
                    <div>
                      <strong>{pin.author || 'utilisateur'}</strong>
                    </div>
                  </div>
                </div>

                <div ref={commentsBlockRef} className="pn-viewer-comments-block pn-viewer-comments-block-standalone">
                  <div className="pn-comment-header">
                    <strong>{pinComments.length === 0 ? 'Pas de commentaire pour le moment' : `${fmt(pinComments.length)} commentaire${pinComments.length > 1 ? 's' : ''}`}</strong>
                    <button
                      className="pn-comment-collapse-btn"
                      type="button"
                      aria-expanded={!commentsCollapsed}
                      aria-label={commentsCollapsed ? 'Afficher les commentaires' : 'Réduire les commentaires'}
                      onClick={() => setCommentsCollapsed((c) => !c)}
                    >
                      {commentsCollapsed ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
                    </button>
                  </div>
                  {!commentsCollapsed && (
                    <div className="pn-comment-list">
                      {pinComments.map((comment) => {
                        const liked = likedCommentIds.has(comment.id);
                        return (
                          <article key={comment.id} className="pn-comment-item">
                            <div className="pn-comment-user">{comment.author}</div>
                            <p>{comment.text}</p>
                            <div className="pn-comment-meta">
                              <span>{comment.timeLabel || 'A l’instant'}</span>
                              <button type="button" onClick={() => handleReplyTo(comment.author)}>Répondre</button>
                              <button
                                type="button"
                                aria-label={liked ? 'Ne plus aimer' : 'Aimer ce commentaire'}
                                aria-pressed={liked}
                                className={liked ? 'pn-comment-like-active' : ''}
                                onClick={() => toggleCommentLike(comment.id)}
                              >
                                <Heart size={13} fill={liked ? 'currentColor' : 'none'} />
                              </button>
                              <button type="button" aria-label="Plus"><MoreHorizontal size={13} /></button>
                            </div>
                          </article>
                        );
                      })}
                    </div>
                  )}
                  <form
                    className="pn-comment-input-row pn-comment-input-pill-wrap"
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleCommentSubmit();
                    }}
                  >
                    <input
                      ref={commentInputRef}
                      className="pn-input pn-comment-field"
                      placeholder="Ajouter un commentaire"
                      value={commentInput}
                      onChange={(e) => setCommentInput(e.target.value)}
                      autoComplete="off"
                      enterKeyHint="send"
                    />
                    <button type="button" className="pn-comment-icon-btn" aria-label="Emoji"><Smile size={16} /></button>
                    <button type="button" className="pn-comment-icon-btn" aria-label="Mention"><MessageSquare size={16} /></button>
                    <button type="button" className="pn-comment-icon-btn" aria-label="Image"><ImageIcon size={16} /></button>
                    <button type="submit" className="pn-comment-send-btn" aria-label="Envoyer le commentaire"><SendHorizontal size={15} /></button>
                  </form>
                </div>
              </div>
            </section>
          </div>

          <aside className="pn-viewer-related">
            {relatedPins.map((related, i) => (
              <button
                key={related.id}
                className={`pn-related-card pn-related-${relatedVariant(related, i)}`}
                onClick={() => onSelectPin(pins.indexOf(related))}
              >
                <img src={related.imageUrl} alt={related.title} />
              </button>
            ))}
          </aside>
        </div>
      </div>
    </div>
  );
}

/* ── Pin Card (grid) ─────────────────────────────────────────────────────── */
function PinCard({ pin, index, onOpen, onEdit, onDelete, onAnalytics }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const sizeVariant = (() => {
    const n = (index + String(pin.id || '').length) % 7;
    if (n === 0) return 'tall';
    if (n === 1) return 'wide';
    if (n === 2) return 'compact';
    if (n === 3) return 'mini';
    if (n === 4) return 'poster';
    return 'regular';
  })();

  return (
    <article className={`pn-card pn-card-${sizeVariant}`} onClick={() => onOpen(index)}>
      <div className="pn-card-top">
        <div className="pn-card-menu-wrap" onClick={e => e.stopPropagation()}>
          <button
            className="pn-card-menu-toggle"
            aria-label="Plus d'actions"
            onClick={() => setMenuOpen(v => !v)}
          >
            <MoreHorizontal size={16} />
          </button>
          {menuOpen && (
            <div className="pn-card-menu-popover" role="menu">
              <button className="pn-card-menu-item" role="menuitem" onClick={() => { setMenuOpen(false); onEdit(pin); }}>
                <Edit3 size={14} /> Modifier
              </button>
              <button className="pn-card-menu-item" role="menuitem" onClick={() => { setMenuOpen(false); downloadRemoteImage(pin.imageUrl, pin.title); }}>
                <Download size={14} /> Télécharger
              </button>
              <button className="pn-card-menu-item danger" role="menuitem" onClick={() => { setMenuOpen(false); onDelete(pin.id); }}>
                <Trash2 size={14} /> Supprimer
              </button>
            </div>
          )}
        </div>
        <StatusBadge status={pin.status} />
      </div>
      <div className="pn-card-img-wrap">
        <img src={pin.imageUrl} alt={pin.title} loading="lazy" />
      </div>
      <div className="pn-card-meta">
        <strong>{pin.title}</strong>
        <span>{pin.board}</span>
        <div className="pn-card-stats">
          <span><Heart size={11} /> {fmt(pin.likes)}</span>
          <span><Eye size={11} /> {fmt(pin.views)}</span>
          <span><Bookmark size={11} /> {fmt(pin.saves)}</span>
        </div>
      </div>
    </article>
  );
}

/* ─── Main Component ─────────────────────────────────────────────────────── */
export default function PinterestApp({ onBack }) {
  const [pins, setPins] = useState(SAMPLE_PINS);
  const [boards, setBoards] = useState(DEFAULT_BOARDS);
  const [libraryView, setLibraryView] = useState('pins'); // pins | boards
  const [selectedBoardName, setSelectedBoardName] = useState('');
  const [savedPinIds, setSavedPinIds] = useState(() => new Set());
  const [commentsByPin, setCommentsByPin] = useState(() => Object.fromEntries(
    SAMPLE_PINS.map((pin) => [pin.id, pin.comments > 0 ? [{ id: `${pin.id}-seed`, author: 'Aya', text: 'hey', timeLabel: 'A l’instant' }] : []]),
  ));
  const [activePinIndex, setActivePinIndex] = useState(null);
  const [deviceView, setDeviceView] = useState('Mobile');
  const [modal, setModal] = useState(null); // null | { type: 'create-picker'|'create-pin'|'create-board'|'create-collage'|'edit'|'analytics', pin? }
  const [filterStatus, setFilterStatus] = useState('published');
  const [searchQ, setSearchQ] = useState('');

  const isViewerOpen = activePinIndex != null;

  const filteredPins = useMemo(() => pins.filter(p => {
    const matchStatus = selectedBoardName ? true : p.status === filterStatus;
    const matchSearch = !searchQ || p.title.toLowerCase().includes(searchQ.toLowerCase()) || p.board.toLowerCase().includes(searchQ.toLowerCase());
    const matchBoard = !selectedBoardName || p.board === selectedBoardName;
    return matchStatus && matchSearch && matchBoard;
  }), [pins, filterStatus, searchQ, selectedBoardName]);

  const handleSave = (updated) => {
    setPins(prev => {
      const idx = prev.findIndex(p => p.id === updated.id);
      if (idx === -1) return [{ ...updated, likes: 0, comments: 0, saves: 0, views: 0 }, ...prev];
      const next = [...prev]; next[idx] = { ...prev[idx], ...updated }; return next;
    });
  };

  const handleDelete = (id) => {
    if (!confirm('Supprimer cette épingle ?')) return;
    setPins(prev => prev.filter(p => p.id !== id));
    setSavedPinIds(prev => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
    setCommentsByPin(prev => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
    setActivePinIndex(null);
  };

  const handleToggleSave = (pinId) => {
    setSavedPinIds(prev => {
      const next = new Set(prev);
      const wasSaved = next.has(pinId);
      if (wasSaved) next.delete(pinId);
      else next.add(pinId);
      setPins(currentPins => currentPins.map(p => (
        p.id === pinId ? { ...p, saves: Math.max(0, p.saves + (wasSaved ? -1 : 1)) } : p
      )));
      return next;
    });
  };

  const handleAddComment = (pinId, text) => {
    const comment = { id: `${pinId}-${Date.now()}`, author: 'Vous', text, timeLabel: 'A l’instant' };
    setCommentsByPin(prev => ({
      ...prev,
      [pinId]: [...(prev[pinId] || []), comment],
    }));
    setPins(prev => prev.map(p => (
      p.id === pinId ? { ...p, comments: p.comments + 1 } : p
    )));
  };

  const navigate = (dir) => {
    setActivePinIndex(prev => {
      const list = filteredPins;
      const cur = list.findIndex(p => p.id === pins[prev]?.id);
      if (dir === 'next') return pins.indexOf(list[(cur + 1) % list.length]);
      return pins.indexOf(list[(cur - 1 + list.length) % list.length]);
    });
  };

  return (
    <main className={`pn-screen ${deviceView === 'Mobile' ? 'is-mobile' : 'is-desktop'}`}>
      {/* ── Header ── */}
      <header className="pn-header">
        <div className="pn-header-left">
          <button className="pn-back-btn" onClick={() => onBack?.()}>
            <ArrowLeft size={16} /> Retour
          </button>
          <div className="pn-platform-pill">
            <span className="pn-logo-dot" style={{ background: PINTEREST_META.color }}>
              <img src={PINTEREST_META.logoUrl} alt="Pinterest" />
            </span>
            Pinterest
          </div>
        </div>

        <div className="pn-header-center">
          <div className="pn-search-bar">
            <Search size={14} />
            <input value={searchQ} onChange={e => setSearchQ(e.target.value)} placeholder="Rechercher une épingle…" />
          </div>
        </div>

        <div className="pn-header-right">
          <button className="pn-btn pn-btn-ghost pn-btn-sm">Stratégie</button>
          <div className="pn-device-toggle">
            {['Desktop', 'Mobile'].map(d => (
              <button key={d} className={deviceView === d ? 'active' : ''} onClick={() => setDeviceView(d)}>{d}</button>
            ))}
          </div>
          <button className="pn-btn pn-btn-primary" onClick={() => setModal({ type: 'create-picker' })}>
            <Plus size={15} /> Créer
          </button>
        </div>
      </header>

      {!isViewerOpen && (
        <>
          {!selectedBoardName ? (
            <>
              {libraryView === 'boards' && (
                <div className="pn-page-return-wrap">
                  <button
                    type="button"
                    className="pn-btn pn-btn-ghost pn-btn-sm pn-page-return-btn"
                    onClick={() => setLibraryView('pins')}
                  >
                    <ArrowLeft size={14} /> Retour
                  </button>
                </div>
              )}
              {/* ── Filter bar ── */}
              <div className="pn-filter-row">
                <div className="pn-filter-bar">
                  {[['published', 'Publiés'], ['scheduled', 'Programmés'], ['draft', 'Brouillons']].map(([key, label]) => (
                    <button key={key} className={`pn-filter-btn ${filterStatus === key ? 'active' : ''}`} onClick={() => setFilterStatus(key)}>
                      {label}
                      <span className="pn-filter-count">
                        {pins.filter(p => p.status === key).length}
                      </span>
                    </button>
                  ))}
                </div>
                <div className="pn-tableau-actions-box" aria-label="Actions tableau">
                  <strong>Tableau</strong>
                  <div className="pn-tableau-actions-list">
                    <button type="button" onClick={() => setLibraryView('boards')}>
                      <LayoutGrid size={14} /> Voir tableaux
                    </button>
                    <button type="button" onClick={() => { setLibraryView('pins'); setSelectedBoardName(''); }}>
                      <Pin size={14} /> Voir epingles
                    </button>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="pn-board-page-top">
              <div>
                <h2>{selectedBoardName}</h2>
                <p>{filteredPins.length} épingle{filteredPins.length > 1 ? 's' : ''}</p>
              </div>
              <div className="pn-board-page-actions">
                <button
                  type="button"
                  className="pn-btn pn-btn-ghost pn-btn-sm pn-page-return-btn"
                  onClick={() => {
                    setSelectedBoardName('');
                    setLibraryView('boards');
                  }}
                >
                  <ArrowLeft size={14} /> Retour
                </button>
                <button type="button" className="pn-btn pn-btn-outline pn-btn-sm" onClick={() => { setLibraryView('boards'); }}>
                  <LayoutGrid size={14} /> Tableaux
                </button>
                <button
                  type="button"
                  className="pn-btn pn-btn-primary pn-btn-sm"
                  onClick={() => {
                    setSelectedBoardName('');
                    setLibraryView('pins');
                  }}
                >
                  <Pin size={14} /> Vos epingles
                </button>
              </div>
            </div>
          )}

          {libraryView === 'pins' && (
            <>
              {/* ── Pin Grid ── */}
              {filteredPins.length === 0
                ? (
                  <div className="pn-empty">
                    <Pin size={36} />
                    <p>Aucune épingle trouvée</p>
                    <button
                      className="pn-btn pn-btn-primary"
                      onClick={() => setModal({ type: selectedBoardName ? 'create-pin' : 'create-picker' })}
                    >
                      <Plus size={14} /> {selectedBoardName ? 'Ajouter épingles' : 'Créer une épingle'}
                    </button>
                  </div>
                )
                : <section className="pn-grid">
                    {filteredPins.map((pin) => {
                      const realIdx = pins.indexOf(pin);
                      return (
                        <PinCard
                          key={pin.id}
                          pin={pin}
                          index={realIdx}
                          onOpen={setActivePinIndex}
                          onEdit={pin => setModal({ type: 'edit', pin })}
                          onDelete={handleDelete}
                          onAnalytics={pin => setModal({ type: 'analytics', pin })}
                        />
                      );
                    })}
                  </section>
              }
            </>
          )}

          {libraryView === 'pins' && selectedBoardName && (
            <button
              type="button"
              className="pn-add-pin-fab"
              aria-label="Ajouter une épingle"
              onClick={() => setModal({ type: 'create-pin' })}
            >
              <Plus size={28} />
            </button>
          )}

          {libraryView === 'boards' && (
            <>
              <div className="pn-boards-toolbar">
                <div className="pn-boards-toolbar-left">
                  <button type="button" className="pn-boards-filter-btn" aria-label="Filtrer"><Filter size={16} /></button>
                  <button type="button" className="pn-boards-group-btn">Groupe</button>
                </div>
                <button className="pn-btn pn-btn-primary pn-btn-sm" onClick={() => setModal({ type: 'create-board' })}>
                  <Plus size={14} /> Créer
                </button>
              </div>

              <section className="pn-boards-grid">
                {boards.map((board) => {
                  const boardPins = pins.filter((p) => p.board === board.name);
                  const pinCount = boardPins.length;
                  return (
                    <article
                      key={board.id}
                      className="pn-board-card"
                      role="button"
                      tabIndex={0}
                      onClick={() => {
                        setSelectedBoardName(board.name);
                        setLibraryView('pins');
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          setSelectedBoardName(board.name);
                          setLibraryView('pins');
                        }
                      }}
                    >
                      <div className="pn-board-card-cover">
                        {boardPins.slice(0, 4).map((p, idx) => (
                          <img
                            key={p.id}
                            src={p.imageUrl}
                            alt={p.title}
                            className={`pn-board-card-thumb pn-board-card-thumb-${idx}`}
                            loading="lazy"
                          />
                        ))}
                        {boardPins.length === 0 && <div className="pn-board-card-cover-empty" />}
                      </div>
                      <strong>{board.name}</strong>
                      <span>{pinCount} épingle{pinCount > 1 ? 's' : ''}</span>
                    </article>
                  );
                })}

              </section>

              {boards.length === 0 && (
                <div className="pn-empty">
                  <LayoutGrid size={36} />
                  <p>Aucun tableau cree</p>
                </div>
              )}
            </>
          )}
        </>
      )}

      {isViewerOpen && (
        <PinViewer
          pins={pins}
          activeIndex={activePinIndex}
          deviceView={deviceView}
          onClose={() => setActivePinIndex(null)}
          onNavigate={navigate}
          onSelectPin={setActivePinIndex}
          isSaved={savedPinIds.has(pins[activePinIndex]?.id)}
          commentsByPin={commentsByPin}
          onToggleSave={handleToggleSave}
          onAddComment={handleAddComment}
          onEditPin={(p) => {
            setActivePinIndex(null);
            setModal({ type: 'edit', pin: p });
          }}
          onDeletePin={handleDelete}
        />
      )}

      {/* ── Modals ── */}
      {modal?.type === 'create-picker' && (
        <CreateTypeModal
          onClose={() => setModal(null)}
          onPick={(type) => {
            if (type === 'pin') {
              setModal({ type: 'create-pin' });
              return;
            }
            if (type === 'board') {
              setModal({ type: 'create-board' });
              return;
            }
            if (type === 'collage') {
              setModal({ type: 'create-collage' });
              return;
            }
          }}
        />
      )}
      {modal?.type === 'create-collage' && (
        <CollageCreateModal onClose={() => setModal(null)} onSave={handleSave} boards={boards} />
      )}
      {modal?.type === 'create-pin' && (
        <PinCreateModal onClose={() => setModal(null)} onSave={handleSave} boards={boards} />
      )}
      {modal?.type === 'create-board' && (
        <BoardCreateModal
          onClose={() => setModal(null)}
          onCreate={(board) => {
            setBoards(prev => prev.some(b => b.name.toLowerCase() === board.name.toLowerCase()) ? prev : [board, ...prev]);
          }}
        />
      )}
      {modal?.type === 'edit' && (
        <CreateEditModal pin={modal.pin} onClose={() => setModal(null)} onSave={handleSave} boards={boards} />
      )}
      {modal?.type === 'analytics' && (
        <AnalyticsModal pin={modal.pin} onClose={() => setModal(null)} />
      )}
    </main>
  );
}