import { List, Columns } from 'lucide-react';

interface ViewToggleProps {
  view: 'list' | 'kanban';
  onChange: (view: 'list' | 'kanban') => void;
}

export function ViewToggle({ view, onChange }: ViewToggleProps) {
  return (
    <div className="inline-flex items-center rounded-lg border border-zinc-800 bg-zinc-900/80 p-1">
      <button
        onClick={() => onChange('list')}
        className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-all duration-200 ${
          view === 'list' ? 'bg-blue-500/20 text-blue-400 shadow-sm' : 'text-zinc-500 hover:text-zinc-300'
        }`}
      >
        <List size={16} />
        List
      </button>
      <button
        onClick={() => onChange('kanban')}
        className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-all duration-200 ${
          view === 'kanban' ? 'bg-blue-500/20 text-blue-400 shadow-sm' : 'text-zinc-500 hover:text-zinc-300'
        }`}
      >
        <Columns size={16} />
        Kanban
      </button>
    </div>
  );
}
