import { MessageCircle, User, MapPin, EyeOff } from 'lucide-react';

export default function Community({ trackingEnabled = true }: { trackingEnabled?: boolean }) {
  const nearbyCyclists = [
    { id: 1, name: 'Carlos M.', distance: '0.5 km', active: true, message: '¡Rodando por la montaña!' },
    { id: 2, name: 'Ana G.', distance: '1.2 km', active: false, message: 'Descansando en el mirador.' },
    { id: 3, name: 'Juan P.', distance: '2.0 km', active: true, message: 'Entrenamiento de ruta.' },
  ];

  return (
    <div className="flex-1 bg-zinc-950 p-4 pt-24 pb-6 overflow-y-auto">
      <h2 className="text-2xl font-bold text-white mb-6">Ciclistas Cercanos</h2>
      
      {!trackingEnabled ? (
        <div className="bg-orange-500/10 border border-orange-500/30 p-6 rounded-2xl flex flex-col items-center text-center text-orange-400">
          <EyeOff className="w-12 h-12 mb-4 text-orange-500" />
          <h3 className="font-bold text-lg mb-2 text-orange-400">Rastreo Desactivado</h3>
          <p className="text-sm text-orange-500/80">No puedes ver a otros ciclistas porque has ocultado tu ubicación. Activa el rastreo en tu perfil para unirte a la comunidad.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {nearbyCyclists.map(cyclist => (
            <div key={cyclist.id} className="bg-zinc-900 p-4 rounded-2xl shadow-sm border border-zinc-800 flex items-center gap-4">
              <div className="relative">
                <div className="w-12 h-12 bg-zinc-800 rounded-full flex items-center justify-center">
                  <User className="w-6 h-6 text-zinc-500" />
                </div>
                {cyclist.active && <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-zinc-900"></div>}
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-center">
                  <h3 className="font-bold text-white">{cyclist.name}</h3>
                  <span className="text-xs text-orange-500 flex items-center gap-1 font-medium">
                    <MapPin className="w-3 h-3" /> {cyclist.distance}
                  </span>
                </div>
                <p className="text-sm text-zinc-400 truncate">{cyclist.message}</p>
              </div>
              <button className="w-10 h-10 bg-zinc-800 rounded-full flex items-center justify-center text-orange-500 hover:bg-orange-500/20 transition-colors">
                <MessageCircle className="w-5 h-5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
