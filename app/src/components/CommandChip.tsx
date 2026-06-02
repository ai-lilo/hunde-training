export function CommandChip({ name, onRemove }: { name: string; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1 text-xs bg-teal-50 text-teal-700 border border-teal-200 rounded-full px-2.5 py-1">
      {name}
      <button onClick={onRemove} className="text-teal-400 hover:text-teal-600 ml-0.5 leading-none">×</button>
    </span>
  )
}
