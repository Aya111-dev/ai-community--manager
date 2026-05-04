export function StyleSlider({ label, value, min, max, step = 1, suffix = '', onChange }) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <span style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        <span>{label}</span>
        <span>{value}{suffix}</span>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={onChange}
        style={{ accentColor: '#7c3aed' }}
      />
    </label>
  )
}
