import React, { useState } from 'react';
import { Plus, Trash2, Phone, User as UserIcon, Mic, Sparkles } from 'lucide-react';
import { useVoiceSos } from '../hooks/useVoiceSos';

export default function SosConfig() {
  const [contacts, setContacts] = useState([
    { id: 1, name: 'Mamá', phone: '+54 11 1234 5678' }
  ]);
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [bgTestNotice, setBgTestNotice] = useState<string | null>(null);

  const handleTestBackgroundAlert = async () => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission !== 'granted') {
        await Notification.requestPermission();
      }
    }
    const { notificationService } = await import('../utils/notifications');
    await notificationService.scheduleBackgroundTest(3);
    setBgTestNotice('⏳ En 3 segundos recibirás la notificación. ¡Minimiza la pestaña o apaga la pantalla ahora!');
    setTimeout(() => setBgTestNotice(null), 5000);
  };

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

      {/* SECCIÓN SERVICE WORKER & NOTIFICACIONES PUSH EN SEGUNDO PLANO */}
      <div className="mt-8 bg-zinc-900 p-4 rounded-2xl border border-zinc-800 space-y-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-orange-500/20 text-orange-400">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
          </div>
          <div>
            <h3 className="font-bold text-white text-sm">Alertas Push en Segundo Plano</h3>
            <p className="text-xs text-zinc-400">Recibe SOS prioritarios incluso si la app está minimizada</p>
          </div>
        </div>

        <p className="text-xs text-zinc-300 leading-relaxed">
          El <strong>Service Worker</strong> de CicloRadar supervisa emergencias en segundo plano. Al activarse un SOS comunitario, dispara una notificación de alta prioridad con sonido forzado y vibración táctil.
        </p>

        <div className="flex flex-wrap items-center gap-2 pt-1">
          <button
            onClick={handleTestBackgroundAlert}
            className="h-9 px-3.5 rounded-xl bg-orange-500/20 hover:bg-orange-500/30 text-orange-400 border border-orange-500/30 text-xs font-bold transition-colors flex items-center gap-1.5"
          >
            <span>Probar Notificación en 2do Plano (3s)</span>
          </button>
        </div>

        {bgTestNotice && (
          <div className="p-3 bg-orange-500/15 border border-orange-500/30 rounded-xl text-xs text-orange-300 animate-in fade-in">
            {bgTestNotice}
          </div>
        )}
      </div>

      {/* SECCIÓN COMANDO DE VOZ MANOS LIBRES ('CicloRadar SOS') */}
      <VoiceSosSection />
    </div>
  );
}

function VoiceSosSection() {
  const { 
    isSupported, 
    isEnabled, 
    isListening, 
    hasPermission, 
    lastPhrase, 
    toggleEnabled, 
    startListening, 
    simulateVoiceCommand 
  } = useVoiceSos();

  const [testFeedback, setTestFeedback] = useState<string | null>(null);

  const handleTestVoiceCommand = () => {
    simulateVoiceCommand('CicloRadar SOS');
    setTestFeedback('✅ Comando de voz "CicloRadar SOS" simulado con éxito.');
    setTimeout(() => setTestFeedback(null), 4000);
  };

  return (
    <div className="mt-6 bg-zinc-900 p-4 rounded-2xl border border-zinc-800 space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className={`p-2 rounded-xl ${
            isEnabled && isListening 
              ? 'bg-red-500/20 text-red-400 border border-red-500/30' 
              : 'bg-zinc-800 text-zinc-400'
          }`}>
            <Mic className={`w-5 h-5 ${isEnabled && isListening ? 'animate-pulse text-red-400' : ''}`} />
          </div>
          <div>
            <h3 className="font-bold text-white text-sm flex items-center gap-2">
              <span>Comando de Voz 'CicloRadar SOS'</span>
              {isEnabled && isListening && (
                <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
              )}
            </h3>
            <p className="text-xs text-zinc-400">
              Activa la alarma de emergencia con las manos en el manillar
            </p>
          </div>
        </div>

        <button
          onClick={() => {
            if (!isSupported) {
              alert('El reconocimiento de voz no está soportado en este navegador.');
              return;
            }
            toggleEnabled();
          }}
          className={`h-9 px-3.5 rounded-xl font-bold text-xs transition-colors border ${
            !isSupported
              ? 'opacity-40 border-zinc-700 bg-zinc-800 text-zinc-500 cursor-not-allowed'
              : isEnabled
              ? 'bg-red-500/20 hover:bg-red-500/30 text-red-400 border-red-500/40'
              : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-400 border-zinc-700'
          }`}
        >
          {isEnabled ? 'Activado' : 'Desactivado'}
        </button>
      </div>

      <div className="p-3 bg-zinc-950/70 rounded-xl border border-zinc-800/80 space-y-2 text-xs">
        <div className="flex items-center justify-between text-zinc-300">
          <span className="text-zinc-400">Estado del Reconocimiento:</span>
          <span className={`font-semibold ${
            !isSupported
              ? 'text-zinc-500'
              : isEnabled && isListening
              ? 'text-emerald-400 flex items-center gap-1.5'
              : isEnabled
              ? 'text-yellow-400'
              : 'text-zinc-400'
          }`}>
            {!isSupported
              ? 'No soportado en este navegador'
              : isEnabled && isListening
              ? '● Escuchando en primer plano'
              : isEnabled
              ? 'En pausa (esperando app activa)'
              : 'Desactivado'}
          </span>
        </div>

        {lastPhrase && (
          <div className="flex items-center justify-between text-zinc-400 pt-1 border-t border-zinc-900">
            <span>Última frase escuchada:</span>
            <span className="font-mono text-zinc-200 truncate max-w-[200px]">"{lastPhrase}"</span>
          </div>
        )}

        <div className="flex items-center justify-between text-zinc-400 pt-1 border-t border-zinc-900">
          <span>Frase clave oficial:</span>
          <span className="font-bold text-orange-400 font-mono">"CicloRadar SOS"</span>
        </div>
      </div>

      <p className="text-xs text-zinc-400 leading-relaxed">
        💡 <strong>Uso recomendado:</strong> Si sufres una caída, agresión o pérdida de control y no puedes pulsar la pantalla táctil, di en voz alta <strong>"CicloRadar SOS"</strong>. La aplicación emitirá un tono acústico inmediato y abrirá una cuenta regresiva de 5 segundos con sirena automática de máxima potencia.
      </p>

      <div className="flex flex-wrap items-center gap-2 pt-1">
        <button
          onClick={handleTestVoiceCommand}
          className="h-9 px-3.5 rounded-xl bg-orange-500/20 hover:bg-orange-500/30 text-orange-400 border border-orange-500/30 text-xs font-bold transition-colors flex items-center gap-1.5"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Probar Activación 'CicloRadar SOS'</span>
        </button>

        {isEnabled && !isListening && isSupported && (
          <button
            onClick={() => startListening()}
            className="h-9 px-3.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700 text-xs font-semibold transition-colors"
          >
            Activar Micrófono Ahora
          </button>
        )}
      </div>

      {testFeedback && (
        <div className="p-2.5 bg-emerald-500/15 border border-emerald-500/30 rounded-xl text-xs text-emerald-300 animate-in fade-in">
          {testFeedback}
        </div>
      )}
    </div>
  );
}
