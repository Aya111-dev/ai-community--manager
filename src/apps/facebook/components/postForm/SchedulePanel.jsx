import { useState } from 'react'
import { CalendarDays } from 'lucide-react'
import DateTimePicker from '../DateTimePicker'
import { formatDateTime } from './utils'

export function SchedulePanel({ scheduledDate, setScheduledDate, initialData, onSchedule, onDraft, buildPost }) {
  const [showDatePicker, setShowDatePicker] = useState(false)

  return (
    <div style={{
      background: '#ffffff',
      border: '1px solid #e5e7eb',
      borderRadius: 22,
      padding: '18px',
      display: 'flex',
      flexDirection: 'column',
      gap: 14,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#6b7280', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', fontSize: 12 }}>
        <CalendarDays size={18} />
        Planifier pour plus tard
      </div>

      <div style={{
        width: '100%',
        background: '#f8fafc',
        border: '1px solid #e5e7eb',
        borderRadius: 16,
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        padding: '14px 16px',
        position: 'relative',
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 10,
          flexWrap: 'wrap',
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: '#111827' }}>{formatDateTime(scheduledDate)}</span>
            <span style={{ fontSize: 12, color: '#6b7280' }}>
              Choisissez une date et une heure pour planifier le post.
            </span>
          </div>
          <button
            onClick={() => setShowDatePicker(value => !value)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 12,
              background: showDatePicker ? '#ede9fe' : '#fff',
              border: `1px solid ${showDatePicker ? '#c4b5fd' : '#d1d5db'}`,
              color: showDatePicker ? '#6d28d9' : '#475569',
              padding: '10px 14px',
              minWidth: 120,
              minHeight: 44,
              fontWeight: 700,
              gap: 8,
              cursor: 'pointer',
            }}
          >
            <span>{showDatePicker ? 'Masquer' : 'Modifier'}</span>
            <CalendarDays size={18} />
          </button>
        </div>
        {showDatePicker && (
          <div style={{
            position: 'absolute',
            top: 'calc(100% + 8px)',
            right: 0,
            zIndex: 40,
            width: 'min(100%, 360px)',
          }}>
            <DateTimePicker
              value={scheduledDate}
              onChange={(date) => {
                setScheduledDate(date)
                setShowDatePicker(false)
              }}
              onClose={() => setShowDatePicker(false)}
            />
          </div>
        )}
      </div>

      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <button
          onClick={() => onSchedule(buildPost())}
          style={{
            flex: 1,
            minWidth: 220,
            borderRadius: 14,
            background: '#dbeafe',
            color: '#1d4ed8',
            border: '1px solid #bfdbfe',
            padding: '14px 20px',
            fontWeight: 700,
            fontSize: 14,
          }}
        >
          {initialData ? 'Mettre à jour et planifier' : 'Planifier'}
        </button>
        <button
          onClick={() => onDraft(buildPost())}
          style={{
            flex: 1,
            minWidth: 160,
            borderRadius: 14,
            background: '#f8fafc',
            color: '#475569',
            border: '1px solid #e2e8f0',
            padding: '14px 20px',
            fontWeight: 700,
            fontSize: 14,
          }}
        >
          {initialData ? 'Mettre à jour le brouillon' : 'Enregistrer en brouillon'}
        </button>
      </div>
    </div>
  )
}
