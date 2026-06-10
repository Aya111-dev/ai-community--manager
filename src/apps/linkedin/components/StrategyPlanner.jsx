import { CalendarDays, Sparkles, Trash2 } from 'lucide-react'
import { useState } from 'react'
import DateTimePicker from '../../facebook/components/DateTimePicker'

const POST_TYPE_OPTIONS = [
  { value: 'text', label: 'Text', color: '#2563eb' },
  { value: 'image', label: 'Image', color: '#7c3aed' },
  { value: 'video', label: 'Video', color: '#ea580c' },
  { value: 'article', label: 'Article', color: '#0891b2' },
]

export function buildLinkedinPlan(index, currentTheme, id = index + 1) {
  const option = POST_TYPE_OPTIONS[index % POST_TYPE_OPTIONS.length]
  return {
    id,
    type: option.value,
    scheduledDate: addDays(new Date(), index),
    content: currentTheme
      ? `Angle ${index + 1} pour "${currentTheme}" sur LinkedIn.`
      : `Idee de contenu LinkedIn ${index + 1}.`,
    status: 'planned',
  }
}

function addDays(base, daysToAdd) {
  const next = new Date(base)
  next.setDate(next.getDate() + daysToAdd)
  return next
}

function formatDateTime(date) {
  const d = date || new Date()
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

function findTypeMeta(type) {
  return POST_TYPE_OPTIONS.find((option) => option.value === type) || POST_TYPE_OPTIONS[0]
}

function statusLabel(status) {
  if (status === 'draft') return 'Brouillon'
  if (status === 'scheduled') return 'Planifié'
  if (status === 'published') return 'Publié'
  return 'À préparer'
}

export default function LinkedinStrategyPlanner({
  theme,
  setTheme,
  postCount,
  setPostCount,
  plans,
  setPlans,
  onCreatePost,
}) {
  const [openPickerId, setOpenPickerId] = useState(null)

  const regeneratePlans = () => {
    const safeCount = Math.max(1, Math.min(12, Number(postCount) || 1))
    setPostCount(safeCount)
    setPlans(Array.from({ length: safeCount }, (_, index) => buildLinkedinPlan(index, theme)))
    setOpenPickerId(null)
  }

  const updatePlan = (id, updates) => {
    setPlans((prev) => prev.map((plan) => (plan.id === id ? { ...plan, ...updates } : plan)))
  }

  const removePlan = (id) => {
    setPlans((prev) => prev.filter((plan) => plan.id !== id))
    setOpenPickerId((prev) => (prev === id ? null : prev))
    setPostCount((prev) => Math.max(1, Number(prev) - 1))
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18, marginBottom: 22 }}>
      <section className="card" style={{ borderRadius: 28, padding: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
          <CalendarDays size={24} color="#f59e0b" />
          <div style={{ fontSize: 22, fontWeight: 800, color: '#111827' }}>Stratégie LinkedIn</div>
        </div>

        <p style={{ margin: '0 0 20px', color: '#64748b', fontSize: 14, lineHeight: 1.6, maxWidth: 760 }}>
          Commencez par définir un thème, générez quelques idées de posts, puis ouvrez l’une d’elles pour la transformer en vraie publication.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 200px', gap: 16, alignItems: 'end' }}>
          <div>
            <div style={{ color: '#64748b', fontSize: 14, fontWeight: 500, marginBottom: 8 }}>
              Thème / Sujet
            </div>
            <input
              value={theme}
              onChange={(e) => setTheme(e.target.value)}
              placeholder="Ex: lancement produit, recrutement, personal branding..."
              style={{
                width: '100%',
                height: 60,
                borderRadius: 18,
                border: '1px solid #dbe2ea',
                background: '#f8fafc',
                padding: '0 18px',
                fontSize: 16,
                color: '#334155',
                outline: 'none',
              }}
            />
          </div>

          <div>
            <div style={{ color: '#64748b', fontSize: 14, fontWeight: 500, marginBottom: 8 }}>
              Nombre de posts
            </div>
            <input
              type="number"
              min="1"
              max="12"
              value={postCount}
              onChange={(e) => setPostCount(e.target.value)}
              style={{
                width: '100%',
                height: 60,
                borderRadius: 18,
                border: '1px solid #dbe2ea',
                background: '#f8fafc',
                padding: '0 18px',
                fontSize: 18,
                color: '#111827',
                outline: 'none',
              }}
            />
          </div>
        </div>

        <div style={{ marginTop: 18 }}>
          <button
            type="button"
            onClick={regeneratePlans}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 10,
              background: '#f5f3ff',
              color: '#4f46e5',
              border: '1px solid #c4b5fd',
              borderRadius: 18,
              padding: '14px 24px',
              fontSize: 16,
              fontWeight: 700,
            }}
          >
            <Sparkles size={20} />
            Générer le plan
          </button>
        </div>
      </section>

      <section className="card" style={{ borderRadius: 28, padding: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 18, flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontSize: 20, fontWeight: 800, color: '#111827' }}>Posts planifiés</div>
            <div style={{ fontSize: 14, color: '#64748b', marginTop: 4 }}>
              Une ligne = une idée de post. Choisissez son type, sa date, puis ouvrez-la dans le créateur.
            </div>
          </div>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#64748b' }}>
            {plans.length} élément{plans.length > 1 ? 's' : ''}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {plans.map((plan, index) => {
            const typeMeta = findTypeMeta(plan.type)
            return (
              <div
                key={plan.id}
                style={{
                  border: '1px solid #e5e7eb',
                  borderRadius: 22,
                  padding: 18,
                  background: '#fff',
                  position: 'relative',
                  zIndex: openPickerId === plan.id ? 30 : 1,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 14 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                    <div style={{ fontSize: 17, fontWeight: 800, color: '#111827' }}>Post {index + 1}</div>
                    <span style={{
                      borderRadius: 999,
                      padding: '6px 10px',
                      background: `${typeMeta.color}18`,
                      color: typeMeta.color,
                      fontSize: 12,
                      fontWeight: 800,
                    }}>
                      {statusLabel(plan.status)}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => removePlan(plan.id)}
                    style={{ color: '#64748b', borderRadius: 10, padding: 6, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  >
                    <Trash2 size={20} />
                  </button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '220px minmax(0, 280px) minmax(0, 1fr)', gap: 14, alignItems: 'end' }}>
                  <div>
                    <div style={{ color: '#64748b', fontSize: 13, fontWeight: 600, marginBottom: 8 }}>Type</div>
                    <select
                      value={plan.type}
                      onChange={(e) => updatePlan(plan.id, { type: e.target.value })}
                      style={{
                        width: '100%',
                        height: 54,
                        borderRadius: 16,
                        border: '1px solid #dbe2ea',
                        background: '#f8fafc',
                        padding: '0 16px',
                        fontSize: 15,
                        color: '#111827',
                        outline: 'none',
                      }}
                    >
                      {POST_TYPE_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                  </div>

                  <div style={{ position: 'relative' }}>
                    <div style={{ color: '#64748b', fontSize: 13, fontWeight: 600, marginBottom: 8 }}>Date</div>
                    <button
                      type="button"
                      onClick={() => setOpenPickerId((prev) => (prev === plan.id ? null : plan.id))}
                      style={{
                        width: '100%',
                        height: 54,
                        borderRadius: 16,
                        border: '1px solid #dbe2ea',
                        background: '#f8fafc',
                        padding: '0 16px',
                        fontSize: 15,
                        color: '#111827',
                        outline: 'none',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        textAlign: 'left',
                      }}
                    >
                      <span>{formatDateTime(plan.scheduledDate)}</span>
                      <CalendarDays size={18} color="#475569" />
                    </button>

                    {openPickerId === plan.id && (
                      <div style={{ position: 'absolute', top: 'calc(100% + 8px)', left: 0, zIndex: 40, width: 360 }}>
                        <DateTimePicker
                          value={plan.scheduledDate}
                          onChange={(date) => {
                            updatePlan(plan.id, { scheduledDate: date })
                            setOpenPickerId(null)
                          }}
                          onClose={() => setOpenPickerId(null)}
                        />
                      </div>
                    )}
                  </div>

                  <div>
                    <div style={{ color: '#64748b', fontSize: 13, fontWeight: 600, marginBottom: 8 }}>Action</div>
                    <button
                      type="button"
                      onClick={() => onCreatePost?.(plan)}
                      style={{
                        width: '100%',
                        height: 54,
                        borderRadius: 16,
                        background: '#5b3df5',
                        color: '#fff',
                        fontSize: 14,
                        fontWeight: 700,
                      }}
                    >
                      Ouvrir dans le créateur
                    </button>
                  </div>
                </div>

                <div style={{ marginTop: 14 }}>
                  <div style={{ color: '#64748b', fontSize: 13, fontWeight: 600, marginBottom: 8 }}>Idée du post</div>
                  <textarea
                    value={plan.content}
                    onChange={(e) => updatePlan(plan.id, { content: e.target.value })}
                    rows={3}
                    placeholder="Décrivez simplement l’idée du post..."
                    style={{
                      width: '100%',
                      borderRadius: 18,
                      border: '1px solid #dbe2ea',
                      background: '#f8fafc',
                      padding: '14px 16px',
                      fontSize: 15,
                      color: '#334155',
                      outline: 'none',
                      resize: 'vertical',
                      lineHeight: 1.5,
                    }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </section>
    </div>
  )
}
