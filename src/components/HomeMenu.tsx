import { Map, Users, ShieldAlert, Settings, ChevronRight } from 'lucide-react';

export default function HomeMenu({ onNavigate }: { onNavigate: (screen: string) => void }) {
  return (
    <div className="flex-1 overflow-y-auto bg-zinc-950 p-4">
      <div className="space-y-4 mt-20">
        
        <button 
          onClick={() => onNavigate('map')}
          className="w-full bg-zinc-900 p-4 rounded-2xl shadow-sm border border-zinc-800 flex items-center gap-4 hover:border-orange-500/50 transition-all text-left group"
        >
          <div className="w-12 h-12 bg-orange-500/10 text-orange-500 rounded-full flex items-center justify-center shrink-0">
            <Map className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-white group-hover:text-orange-500 transition-colors">Abrir Mapa / Radar</h3>
            <p className="text-sm text-zinc-400">Ver tu ubicación y ciclistas cercanos</p>
          </div>
          <ChevronRight className="w-5 h-5 text-zinc-600 group-hover:text-orange-500 transition-colors" />
        </button>

        <button 
          onClick={() => onNavigate('community')}
          className="w-full bg-zinc-900 p-4 rounded-2xl shadow-sm border border-zinc-800 flex items-center gap-4 hover:border-orange-500/50 transition-all text-left group"
        >
          <div className="w-12 h-12 bg-orange-500/10 text-orange-500 rounded-full flex items-center justify-center shrink-0">
            <Users className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-white group-hover:text-orange-500 transition-colors">Comunidad y Mensajes</h3>
            <p className="text-sm text-zinc-400">Chats con ciclistas cercanos</p>
          </div>
          <ChevronRight className="w-5 h-5 text-zinc-600 group-hover:text-orange-500 transition-colors" />
        </button>
        
        <button 
          onClick={() => onNavigate('sos')}
          className="w-full bg-zinc-900 p-4 rounded-2xl shadow-sm border border-zinc-800 flex items-center gap-4 hover:border-red-500/50 transition-all text-left group"
        >
          <div className="w-12 h-12 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center shrink-0">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-white group-hover:text-red-500 transition-colors">Configuración SOS</h3>
            <p className="text-sm text-zinc-400">Gestionar contactos de emergencia</p>
          </div>
          <ChevronRight className="w-5 h-5 text-zinc-600 group-hover:text-red-500 transition-colors" />
        </button>

        <button 
          onClick={() => onNavigate('profile')}
          className="w-full bg-zinc-900 p-4 rounded-2xl shadow-sm border border-zinc-800 flex items-center gap-4 hover:border-orange-500/50 transition-all text-left group"
        >
          <div className="w-12 h-12 bg-orange-500/10 text-orange-500 rounded-full flex items-center justify-center shrink-0">
            <Settings className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-white group-hover:text-orange-500 transition-colors">Ajustes de Perfil</h3>
            <p className="text-sm text-zinc-400">Tipo de bici, privacidad, cuenta</p>
          </div>
          <ChevronRight className="w-5 h-5 text-zinc-600 group-hover:text-orange-500 transition-colors" />
        </button>
      </div>
    </div>
  );
}
