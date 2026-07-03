import { useState } from 'react';
import { Plus, X } from 'lucide-react';
import { useBillStore } from '@/store/useBillStore';
import { useToast } from '@/store/useToast';
import { Avatar } from '@/components/Avatar';

export function PeopleSection() {
  const people = useBillStore((s) => s.people);
  const addPerson = useBillStore((s) => s.addPerson);
  const renamePerson = useBillStore((s) => s.renamePerson);
  const removePerson = useBillStore((s) => s.removePerson);
  const notify = useToast((s) => s.notify);

  const [draft, setDraft] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);

  const submit = () => {
    if (!draft.trim()) return;
    addPerson(draft);
    setDraft('');
  };

  const handleRemove = (id: string, name: string) => {
    if (!removePerson(id)) {
      notify(`Không thể xóa ${name} vì đang trả tiền cho một khoản chi.`, 'error');
    }
  };

  return (
    <section className="flex flex-col gap-3">
      {people.length === 0 ? (
        <p className="sect-hint text-center italic">
          Chưa có ai. Thêm tên những người cùng chia hóa đơn bên dưới.
        </p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {people.map((person) => (
            <span key={person.id} className="chip animate-rise">
              <Avatar name={person.name} />
              {editingId === person.id ? (
                <input
                  autoFocus
                  defaultValue={person.name}
                  className="w-24 bg-transparent outline-none"
                  onBlur={(e) => {
                    renamePerson(person.id, e.target.value);
                    setEditingId(null);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') e.currentTarget.blur();
                    if (e.key === 'Escape') setEditingId(null);
                  }}
                />
              ) : (
                <button
                  type="button"
                  className="cursor-text pr-0.5"
                  onClick={() => setEditingId(person.id)}
                  title="Nhấn để sửa tên"
                >
                  {person.name}
                </button>
              )}
              <button
                type="button"
                className="icon-btn icon-btn--danger no-print h-6 w-6"
                onClick={() => handleRemove(person.id, person.name)}
                aria-label={`Xóa ${person.name}`}
              >
                <X size={14} />
              </button>
            </span>
          ))}
        </div>
      )}

      <div className="no-print flex gap-2">
        <input
          className="field"
          placeholder="Tên người tham gia…"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && submit()}
        />
        <button type="button" className="btn btn--primary shrink-0" onClick={submit} disabled={!draft.trim()}>
          <Plus size={16} />
          Thêm
        </button>
      </div>
    </section>
  );
}
