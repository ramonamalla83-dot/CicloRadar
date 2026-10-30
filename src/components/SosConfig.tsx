import { useState } from 'react';
import { Plus, Trash2, Phone, User as UserIcon } from 'lucide-react';

export default function SosConfig() {
  const [contacts, setContacts] = useState([
    { id: 1, name: 'Mamá', phone: '+54 11 1234 5678' }
  ]);
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (newName && newPhone) {
      setContacts([...contacts, { id: Date.now(), name: newName, phone: newPhone }]);
      setNewName('');
      setNewPhone('');
    }
  };

  const handleRemove = (id: number) => {
    setContacts(contacts.filter(c => c.id !== id));
  };

  return (
    <div className="flex-1 bg-zinc-950 p-4 pt-24 pb-6 overflow-y-auto">
      <h2 className="text-2xl font-bold text-white mb-2">Contactos SOS</h2>
      <p className="text-sm text-zinc-400 mb-6">Estos contactos recibirán un SMS con tu ubicación si activas la alarma.</p>
      
      <form onSubmit={handleAdd} className="bg-zinc-900 p-4 rounded-2xl shadow-sm border border-zinc-800 mb-6 space-y-4">
        <h3 className="font-semibold text-white">Añadir Contacto</h3>
        <div className="space-y-3">
          <div className="relative">
            <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
            <input 
              type="text" value={newName} onChange={e => setNewName(e.target.value)}
              placeholder="Nombre" required
              className="w-full pl-10 pr-4 py-2 bg-zinc-800 border border-zinc-700 text-white rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none placeholder:text-zinc-500"
            />
          </div>
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
            <input 
              type="tel" value={newPhone} onChange={e => setNewPhone(e.target.value)}
              placeholder="Teléfono" required
              className="w-full pl-10 pr-4 py-2 bg-zinc-800 border border-zinc-700 text-white rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none placeholder:text-zinc-500"
            />
          </div>
        </div>
        <button type="submit" className="w-full bg-red-500/20 text-red-500 font-semibold py-2 rounded-xl flex items-center justify-center gap-2 hover:bg-red-500/30 transition-colors border border-red-500/30">
          <Plus className="w-5 h-5" /> Añadir
        </button>
      </form>

      <div className="space-y-3">
        <h3 className="font-semibold text-white">Tus Contactos</h3>
        {contacts.map(contact => (
          <div key={contact.id} className="bg-zinc-900 p-4 rounded-xl shadow-sm border border-zinc-800 flex items-center justify-between">
            <div>
              <p className="font-bold text-white">{contact.name}</p>
              <p className="text-sm text-zinc-400">{contact.phone}</p>
            </div>
            <button onClick={() => handleRemove(contact.id)} className="p-2 text-red-500 hover:bg-red-500/20 rounded-full transition-colors">
              <Trash2 className="w-5 h-5" />
            </button>
          </div>
        ))}
        {contacts.length === 0 && <p className="text-sm text-zinc-500 text-center py-4">No hay contactos guardados.</p>}
      </div>
    </div>
  );
}
