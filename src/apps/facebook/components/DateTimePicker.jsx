import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

const DAYS_FR = ['lu', 'ma', 'me', 'je', 've', 'sa', 'di']
const MONTHS_FR = ['janvier', 'fevrier', 'mars', 'avril', 'mai', 'juin', 'juillet', 'aout', 'septembre', 'octobre', 'novembre', 'decembre']

function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate()
}

function getFirstDayOfMonth(year, month) {
  const day = new Date(year, month, 1).getDay()
  return day === 0 ? 6 : day - 1
}

export default function DateTimePicker({ value, onChange, onClose }) {
  const now = value ? new Date(value) : new Date()
  const [viewYear, setViewYear] = useState(now.getFullYear())
  const [viewMonth, setViewMonth] = useState(now.getMonth())
  const [selectedDate, setSelectedDate] = useState(now)
  const [hour, setHour] = useState(now.getHours())
  const [minute, setMinute] = useState(now.getMinutes())

  const daysInMonth = getDaysInMonth(viewYear, viewMonth)
  const firstDay = getFirstDayOfMonth(viewYear, viewMonth)

  const cells = []
  const prevDays = getDaysInMonth(viewYear, viewMonth - 1)

  for (let i = firstDay - 1; i >= 0; i -= 1) cells.push({ day: prevDays - i, cur: false })
  for (let day = 1; day <= daysInMonth; day += 1) cells.push({ day, cur: true })
  while (cells.length < 42) cells.push({ day: cells.length - daysInMonth - firstDay + 1, cur: false })

  const isToday = (day) => {
    const today = new Date()
    return viewYear === today.getFullYear() && viewMonth === today.getMonth() && day === today.getDate()
  }

  const isSelected = (day) =>
    viewYear === selectedDate.getFullYear() &&
    viewMonth === selectedDate.getMonth() &&
    day === selectedDate.getDate()

  const selectDay = (day) => {
    setSelectedDate(new Date(viewYear, viewMonth, day, hour, minute))
  }

  const confirm = () => {
    onChange(new Date(viewYear, viewMonth, selectedDate.getDate(), hour, minute))
    onClose()
  }

  const prevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11)
      setViewYear((year) => year - 1)
      return
    }
    setViewMonth((month) => month - 1)
  }

  const nextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0)
      setViewYear((year) => year + 1)
      return
    }
    setViewMonth((month) => month + 1)
  }

  return (
    <div
      style={{
        background: '#fff',
        border: '1px solid #e5e7eb',
        borderRadius: 16,
        boxShadow: '0 14px 28px rgba(15,23,42,0.12)',
        display: 'flex',
        flexWrap: 'wrap',
        gap: 12,
        padding: 12,
        width: '100%',
        maxWidth: 360,
      }}
    >
      <div style={{ flex: '1 1 200px', minWidth: 200 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
          <span style={{ color: '#111827', flex: 1, fontSize: 13, fontWeight: 700, textTransform: 'capitalize' }}>
            {MONTHS_FR[viewMonth]} {viewYear}
          </span>
          <MonthButton onClick={prevMonth}>
            <ChevronLeft size={14} />
          </MonthButton>
          <MonthButton onClick={nextMonth}>
            <ChevronRight size={14} />
          </MonthButton>
        </div>

        <div style={{ display: 'grid', gap: 2, gridTemplateColumns: 'repeat(7, 1fr)', marginBottom: 4 }}>
          {DAYS_FR.map((day) => (
            <div
              key={day}
              style={{ color: '#9ca3af', fontSize: 10, fontWeight: 700, padding: '2px 0', textAlign: 'center', textTransform: 'uppercase' }}
            >
              {day}
            </div>
          ))}
        </div>

        <div style={{ display: 'grid', gap: 2, gridTemplateColumns: 'repeat(7, 1fr)' }}>
          {cells.map((cell, index) => {
            const selected = cell.cur && isSelected(cell.day)
            const today = cell.cur && isToday(cell.day)

            return (
              <button
                key={`${cell.day}-${index}`}
                onClick={() => cell.cur && selectDay(cell.day)}
                style={{
                  background: selected ? '#374151' : today ? '#f8fafc' : 'transparent',
                  border: today && !selected ? '1px solid #d1d5db' : '1px solid transparent',
                  borderRadius: 8,
                  color: !cell.cur ? '#d1d5db' : selected ? '#fff' : '#374151',
                  cursor: cell.cur ? 'pointer' : 'default',
                  fontSize: 12,
                  fontWeight: selected || today ? 600 : 400,
                  padding: '6px 0',
                  textAlign: 'center',
                }}
              >
                {cell.day}
              </button>
            )
          })}
        </div>

      </div>

      <div style={{ alignItems: 'flex-start', display: 'flex', flex: '0 0 auto', gap: 6, paddingTop: 18 }}>
        <TimeScroll value={hour} onChange={setHour} max={23} />
        <TimeScroll value={minute} onChange={setMinute} max={59} />
      </div>

      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', width: '100%' }}>
        <button
          onClick={onClose}
          style={{
            background: '#f3f4f6',
            borderRadius: 8,
            color: '#374151',
            fontSize: 12,
            fontWeight: 600,
            padding: '7px 12px',
          }}
        >
          Annuler
        </button>
        <button
          onClick={confirm}
          style={{
            background: '#7c3aed',
            borderRadius: 8,
            color: '#fff',
            fontSize: 12,
            fontWeight: 700,
            padding: '7px 14px',
          }}
        >
          OK
        </button>
      </div>
    </div>
  )
}

function MonthButton({ children, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        alignItems: 'center',
        background: '#fff',
        border: '1px solid #e5e7eb',
        borderRadius: 8,
        color: '#6b7280',
        display: 'inline-flex',
        height: 28,
        justifyContent: 'center',
        width: 28,
      }}
    >
      {children}
    </button>
  )
}

function TimeScroll({ value, onChange, max }) {
  const items = Array.from({ length: max + 1 }, (_, index) => index)
  const containerRef = useRef(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const activeItem = container.children[value]
    if (!activeItem) return

    const targetTop = activeItem.offsetTop - (container.clientHeight - activeItem.clientHeight) / 2
    container.scrollTop = Math.max(0, targetTop)
  }, [value])

  return (
    <div
      ref={containerRef}
      style={{
        border: '1px solid #e5e7eb',
        borderRadius: 10,
        height: 136,
        overflowY: 'auto',
        padding: 3,
        scrollbarWidth: 'none',
        width: 42,
      }}
    >
      {items.map((item) => (
        <div
          key={item}
          onClick={() => onChange(item)}
          style={{
            background: item === value ? '#374151' : 'transparent',
            borderRadius: 6,
            color: item === value ? '#fff' : '#374151',
            cursor: 'pointer',
            fontSize: 12,
            fontWeight: item === value ? 700 : 400,
            padding: '5px 0',
            textAlign: 'center',
          }}
        >
          {String(item).padStart(2, '0')}
        </div>
      ))}
    </div>
  )
}
