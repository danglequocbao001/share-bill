import { useState } from 'react';
import { Check, Plus, Trash2, X } from 'lucide-react';
import type { Person } from '@/types';
import { useBillStore, withUndo } from '@/store/useBillStore';
import { Avatar } from '@/components/Avatar';
import { Sheet } from '@/components/Sheet';

export function PeopleSection() {
  const people = useBillStore((s) => s.people);
  const addPerson = useBillStore((s) => s.addPerson);

  const [draft, setDraft] = useState('');
  const [error, setError] = useState('');
  const [editing, setEditing] = useState<Person | null>(null);

  const submit = () => {
    const name = draft.trim();
    if (!name) return;
    if (!addPerson(name)) {
      setError(`Đã có người tên “${name}”.`);
      return;
    }
    setDraft('');
  };

  return (
    <section className="flex flex-col gap-3">
      {people.length === 0 ? (
        <p className="sect-hint text-center italic">
          Chưa có ai. Nhập tên từng người cùng chia hóa đơn bên dưới.
        </p>
      ) : (
        <>
          <div className="flex flex-wrap gap-2">
            {people.map((person) => (
              <button
                key={person.id}
                type="button"
                className="chip animate-rise pr-3"
                onClick={() => setEditing(person)}
              >
                <Avatar name={person.name} />
                {person.name}
              </button>
            ))}
          </div>
          <p className="sect-hint -mt-1">Chạm vào tên để sửa hoặc xoá.</p>
        </>
      )}

      <div className="no-print flex flex-col gap-1">
        <div className="flex gap-2">
          <input
            className="field"
            placeholder="Tên người tham gia…"
            value={draft}
            aria-invalid={!!error}
            onChange={(e) => {
              setDraft(e.target.value);
              setError('');
            }}
            onKeyDown={(e) => e.key === 'Enter' && submit()}
          />
          <button type="button" className="btn btn--primary shrink-0" onClick={submit} disabled={!draft.trim()}>
            <Plus size={16} />
            Thêm
          </button>
        </div>
        {error && <p className="text-xs text-accent">{error}</p>}
      </div>

      {editing && <PersonSheet person={editing} onClose={() => setEditing(null)} />}
    </section>
  );
}

function PersonSheet({ person, onClose }: { person: Person; onClose: () => void }) {
  const renamePerson = useBillStore((s) => s.renamePerson);
  const removePerson = useBillStore((s) => s.removePerson);

  const [name, setName] = useState(person.name);
  const [error, setError] = useState('');
  const [removeError, setRemoveError] = useState('');

  const save = () => {
    const trimmed = name.trim();
    if (!trimmed) {
      setError('Tên không được để trống.');
      return;
    }
    if (!renamePerson(person.id, trimmed)) {
      setError(`Đã có người tên “${trimmed}”.`);
      return;
    }
    onClose();
  };

  const remove = () => {
    // Đóng bảng sau khi xoá được, để toast "Hoàn tác" không bị nền mờ che.
    if (withUndo(`Đã xoá ${person.name}`, () => removePerson(person.id))) onClose();
    else setRemoveError(`Chưa xoá được: ${person.name} đang là người trả hoặc người nhận của một khoản. Sửa các khoản đó trước.`);
  };

  return (
    <Sheet onClose={onClose}>
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-base font-semibold">Sửa người tham gia</h2>
        <button type="button" className="btn btn--ghost px-2.5 py-1.5 text-xs text-accent" onClick={remove}>
          <Trash2 size={14} />
          Xoá
        </button>
      </div>
      {removeError && <p className="-mt-2 text-xs text-accent">{removeError}</p>}

      <div className="flex flex-col gap-1">
        <input
          className="field"
          value={name}
          aria-label="Tên"
          aria-invalid={!!error}
          data-autofocus
          onChange={(e) => {
            setName(e.target.value);
            setError('');
          }}
          onKeyDown={(e) => e.key === 'Enter' && save()}
        />
        {error && <p className="text-xs text-accent">{error}</p>}
      </div>

      <div className="flex gap-2">
        <button type="button" className="btn btn--ghost flex-1" onClick={onClose}>
          <X size={16} />
          Huỷ
        </button>
        <button type="button" className="btn btn--primary flex-1" onClick={save}>
          <Check size={16} />
          Lưu
        </button>
      </div>
    </Sheet>
  );
}
