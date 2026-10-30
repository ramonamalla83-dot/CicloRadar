import { useState } from 'react';
import { Camera, Bike, Save, EyeOff, Eye, AlertTriangle, Bell, Play, Square } from 'lucide-react';
import { audioEngine } from '../utils/audio';

export default function ProfileSettings({ 
  trackingEnabled = true, 
  setTrackingEnabled,
  alarmSound = 'sirena',
  setAlarmSound 
}: { 
  trackingEnabled?: boolean,
  setTrackingEnabled?: (enabled: boolean) => void,
  alarmSound?: string,
  setAlarmSound?: (sound: string) => void
}) {
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [bikeImage, setBikeImage] = useState<string | null>(null);

  const [brand, setBrand] = useState('Specialized');
  const [model, setModel] = useState('Rockhopper');
  const [type, setType] = useState('MTB');
  
  const [showTrackingAlert, setShowTrackingAlert] = useState(false);
  const [isPlayingTest, setIsPlayingTest] = useState(false);

  const handleProfileImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setProfileImage(URL.createObjectURL(e.target.files[0]));
    }
  };

  const handleBikeImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setBikeImage(URL.createObjectURL(e.target.files[0]));
    }
  };

  const handleToggleTrackingClick = () => {
    if (trackingEnabled) {
      setShowTrackingAlert(true);
    } else {
      setTrackingEnabled?.(true);
    }
  };

  const confirmDisableTracking = () => {
    setTrackingEnabled?.(false);
    setShowTrackingAlert(false);
  };

  const toggleSoundTest = () => {
    if (isPlayingTest) {
      audioEngine.stop();
      setIsPlayingTest(false);
    } else {
      audioEngine.play(alarmSound);
      setIsPlayingTest(true);
      // Auto stop after 3 seconds
      setTimeout(() => {
        audioEngine.stop();
        setIsPlayingTest(false);
      }, 3000);
    }
  };

  return (
    <div className="flex-1 bg-zinc-950 p-4 pt-24 pb-6 overflow-y-auto">
      <h2 className="text-2xl font-bold text-white mb-6">Ajustes de Perfil</h2>
      
      <div className="space-y-8 pb-10">
        
        {/* Foto de perfil */}
        <div className="bg-zinc-900 p-6 rounded-2xl shadow-sm border border-zinc-800 flex flex-col items-center">
          <div className="relative mb-4">
            <div className="w-24 h-24 bg-zinc-800 rounded-full flex items-center justify-center overflow-hidden border-4 border-zinc-900 shadow-md">
              {profileImage ? (
                <img src={profileImage} alt="Perfil" className="w-full h-full object-cover" />
              ) : (
                <Camera className="w-8 h-8 text-zinc-500" />
              )}
            </div>
            <label className="absolute bottom-0 right-0 w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center text-black cursor-pointer shadow-lg hover:bg-orange-600 transition-colors">
              <Camera className="w-4 h-4" />
              <input type="file" className="hidden" accept="image/*" onChange={handleProfileImageUpload} />
            </label>
          </div>
          <h3 className="font-bold text-white">Foto de Perfil</h3>
          <p className="text-xs text-zinc-400">Hazte visible para otros ciclistas</p>
        </div>
        
        {/* Privacidad y Rastreo */}
        <div className="bg-zinc-900 p-6 rounded-2xl shadow-sm border border-zinc-800">
          <h3 className="font-bold text-white mb-4 flex items-center gap-2">
            <Eye className="w-5 h-5 text-orange-500" /> Privacidad y Seguridad
          </h3>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-zinc-800/50 rounded-xl border border-zinc-700/50">
              <div>
                <p className="font-bold text-white text-sm">Rastreo de Ubicación</p>
                <p className="text-xs text-zinc-400">{trackingEnabled ? 'Visible en el mapa' : 'Oculto en el mapa'}</p>
              </div>
              <button 
                onClick={handleToggleTrackingClick}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${trackingEnabled ? 'bg-orange-500' : 'bg-zinc-700'}`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${trackingEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </div>

            <div className="p-4 bg-zinc-800/50 rounded-xl border border-zinc-700/50">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="font-bold text-white text-sm flex items-center gap-1"><Bell className="w-4 h-4 text-orange-500"/> Tono de Alerta SOS</p>
                  <p className="text-xs text-zinc-400">Sonido al recibir un SOS cercano</p>
                </div>
              </div>
              <div className="flex gap-2">
                <select 
                  value={alarmSound}
                  onChange={e => {
                    setAlarmSound?.(e.target.value);
                    if (isPlayingTest) {
                      audioEngine.play(e.target.value);
                    }
                  }}
                  className="flex-1 px-3 py-2 bg-zinc-900 border border-zinc-700 text-white rounded-lg outline-none focus:border-orange-500 transition-colors text-sm"
                >
                  <option value="sirena">Sirena (Rápida)</option>
                  <option value="alarma">Alarma (Constante)</option>
                  <option value="pitido">Pitido (Intermitente)</option>
                </select>
                <button 
                  onClick={toggleSoundTest}
                  className={`px-4 py-2 rounded-lg flex items-center justify-center transition-colors border ${isPlayingTest ? 'bg-red-500/20 text-red-500 border-red-500/30' : 'bg-orange-500/10 text-orange-500 border-orange-500/20 hover:bg-orange-500/20'}`}
                >
                  {isPlayingTest ? <Square className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Datos de la bicicleta */}
        <div className="bg-zinc-900 p-6 rounded-2xl shadow-sm border border-zinc-800">
          <h3 className="font-bold text-white mb-4 flex items-center gap-2">
            <Bike className="w-5 h-5 text-orange-500" /> Mi Bicicleta
          </h3>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1">Marca</label>
                <input 
                  type="text" value={brand} onChange={e => setBrand(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 text-white rounded-lg outline-none focus:border-orange-500 transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1">Modelo</label>
                <input 
                  type="text" value={model} onChange={e => setModel(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 text-white rounded-lg outline-none focus:border-orange-500 transition-colors"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-xs font-semibold text-zinc-400 mb-1">Tipo</label>
              <select 
                value={type} onChange={e => setType(e.target.value)}
                className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 text-white rounded-lg outline-none focus:border-orange-500 transition-colors"
              >
                <option>MTB</option>
                <option>Ruta</option>
                <option>Gravel</option>
                <option>Urbana</option>
                <option>BMX</option>
              </select>
            </div>

            {/* Foto de la bici */}
            <div className="mt-4">
              <label className="block text-xs font-semibold text-zinc-400 mb-2">Foto de la Bicicleta</label>
              <div className="relative w-full h-40 bg-zinc-800 rounded-xl border-2 border-dashed border-zinc-700 flex items-center justify-center overflow-hidden">
                {bikeImage ? (
                  <>
                    <img src={bikeImage} alt="Bicicleta" className="w-full h-full object-cover" />
                    <label className="absolute bottom-2 right-2 bg-black/80 p-2 rounded-full text-white cursor-pointer hover:bg-black transition-colors">
                      <Camera className="w-5 h-5" />
                      <input type="file" className="hidden" accept="image/*" onChange={handleBikeImageUpload} />
                    </label>
                  </>
                ) : (
                  <label className="flex flex-col items-center justify-center w-full h-full cursor-pointer text-zinc-500 hover:text-orange-500 hover:bg-zinc-700/50 transition-colors">
                    <Camera className="w-8 h-8 mb-2" />
                    <span className="text-sm font-medium">Subir foto</span>
                    <input type="file" className="hidden" accept="image/*" onChange={handleBikeImageUpload} />
                  </label>
                )}
              </div>
            </div>
          </div>
        </div>

        <button className="w-full bg-orange-500 text-black font-bold py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-orange-600 shadow-lg shadow-orange-500/20 transition-colors">
          <Save className="w-5 h-5" /> Guardar Cambios
        </button>
      </div>

      {/* Alerta de rastreo Modal */}
      {showTrackingAlert && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 max-w-sm w-full shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="w-12 h-12 bg-orange-500/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-orange-500/30">
              <AlertTriangle className="w-6 h-6 text-orange-500" />
            </div>
            <h3 className="text-lg font-bold text-center text-white mb-2">¿Ocultar tu ubicación?</h3>
            <p className="text-sm text-zinc-400 text-center mb-6">
              Si desactivas el rastreo, no serás visible para la comunidad. Sin embargo, <strong className="text-white">tampoco podrás ver a otros ciclistas cercanos en el mapa ni en la sección de Comunidad</strong>.
            </p>
            <div className="flex gap-3">
              <button 
                onClick={() => setShowTrackingAlert(false)}
                className="flex-1 px-4 py-2 bg-zinc-800 text-white font-semibold rounded-xl hover:bg-zinc-700 transition-colors"
              >
                Cancelar
              </button>
              <button 
                onClick={confirmDisableTracking}
                className="flex-1 px-4 py-2 bg-orange-500 text-black font-bold rounded-xl hover:bg-orange-600 transition-colors"
              >
                Desactivar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
