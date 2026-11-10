import React, { useState } from 'react';
import { Bike, Shield, Phone, KeyRound, User, CheckCircle2, ArrowRight, Sparkles, Navigation } from 'lucide-react';

interface AuthProps {
  onLogin: (name: string) => void;
}

export default function Auth({ onLogin }: AuthProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [phone, setPhone] = useState('+54 9 266 4123456');
  const [code, setCode] = useState('123456');
  const [name, setName] = useState('Ciclista Radar');
  const [bikeType, setBikeType] = useState('Ruta / Carretera');
  const [emergencyContact, setEmergencyContact] = useState('Mama / Pareja (+54 9 266 4000000)');

  const bikeOptions = [
    { id: 'road', label: 'Ruta / Carretera', icon: '🚴‍♂️' },
    { id: 'gravel', label: 'Gravel / Aventura', icon: '🚵' },
    { id: 'mtb', label: 'Mountain Bike (MTB)', icon: '🏔️' },
    { id: 'urban', label: 'Urbana / Fixie', icon: '🏙️' },
    { id: 'ebike', label: 'e-Bike Eléctrica', icon: '⚡' }
  ];

  const handleStep1Submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone.trim()) return;
    setStep(2);
  };

  const handleStep2Submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;
    setStep(3);
  };

  const handleCompleteRegistration = (e: React.FormEvent) => {
    e.preventDefault();
    const finalName = name.trim() || 'Ciclista Activo';
    try {
      localStorage.setItem('cicloradar_profile', JSON.stringify({
        name: finalName,
        phone,
        bikeType,
        emergencyContact,
        registeredAt: new Date().toISOString()
      }));
    } catch (_) {}
    onLogin(finalName);
  };

  const handleQuickGuest = () => {
    onLogin('Ciclista Urbano');
  };

  return (
    <div className="flex-1 flex flex-col justify-center items-center px-4 py-8 bg-zinc-950 text-white min-h-screen">
      <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        {/* Glow de fondo */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-orange-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Encabezado Logo */}
        <div className="flex flex-col items-center text-center mb-8 relative">
          <div className="w-16 h-16 rounded-2xl bg-orange-500/10 border border-orange-500/30 flex items-center justify-center text-orange-500 mb-4 shadow-inner">
            <Bike className="w-9 h-9" />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
            CicloRadar <span className="text-xs px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-400 border border-orange-500/30">v2.5</span>
          </h1>
          <p className="text-sm text-zinc-400 mt-1 max-w-xs">
            Seguridad colaborativa, alertas SOS y mapas en tiempo real para ciclistas
          </p>

          {/* Stepper indicator */}
          <div className="flex items-center gap-2 mt-6">
            <div className={`h-1.5 rounded-full transition-all duration-300 ${step >= 1 ? 'w-8 bg-orange-500' : 'w-4 bg-zinc-800'}`} />
            <div className={`h-1.5 rounded-full transition-all duration-300 ${step >= 2 ? 'w-8 bg-orange-500' : 'w-4 bg-zinc-800'}`} />
            <div className={`h-1.5 rounded-full transition-all duration-300 ${step === 3 ? 'w-8 bg-orange-500' : 'w-4 bg-zinc-800'}`} />
          </div>
          <span className="text-[11px] font-mono text-zinc-500 mt-1.5">
            Paso {step} de 3: {step === 1 ? 'Teléfono' : step === 2 ? 'Verificación' : 'Perfil Ciclista'}
          </span>
        </div>

        {/* PASO 1: Teléfono */}
        {step === 1 && (
          <form onSubmit={handleStep1Submit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
                Número de Teléfono Móvil
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3.5" />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+54 9 266 4123456"
                  required
                  className="w-full bg-zinc-950 border border-zinc-800 focus:border-orange-500 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-zinc-600 focus:outline-none transition-colors"
                />
              </div>
              <p className="text-[11px] text-zinc-500 mt-1.5">
                Para el prototipo puedes usar cualquier número de prueba.
              </p>
            </div>

            <button
              type="submit"
              className="w-full py-3 px-4 bg-orange-500 hover:bg-orange-600 active:scale-[0.98] text-white font-bold rounded-xl transition-all shadow-lg shadow-orange-500/20 flex items-center justify-center gap-2"
            >
              Continuar <ArrowRight className="w-4 h-4" />
            </button>

            <div className="pt-2 text-center">
              <button
                type="button"
                onClick={handleQuickGuest}
                className="text-xs text-zinc-400 hover:text-white underline underline-offset-4"
              >
                Entrar rápidamente como Invitado
              </button>
            </div>
          </form>
        )}

        {/* PASO 2: Código */}
        {step === 2 && (
          <form onSubmit={handleStep2Submit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
                Código de Confirmación
              </label>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  maxLength={6}
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="123456"
                  required
                  className="w-full bg-zinc-950 border border-zinc-800 focus:border-orange-500 rounded-xl pl-10 pr-4 py-3 text-sm font-mono tracking-widest text-center text-white placeholder-zinc-600 focus:outline-none transition-colors"
                />
              </div>
              <p className="text-[11px] text-zinc-400 mt-2 bg-zinc-950/80 p-2 rounded-lg border border-zinc-800/80">
                💡 Código de demostración: <strong className="text-orange-400">123456</strong> (o cualquier dígito para pruebas).
              </p>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="py-3 px-4 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-medium rounded-xl transition-colors text-sm"
              >
                Atrás
              </button>
              <button
                type="submit"
                className="flex-1 py-3 px-4 bg-orange-500 hover:bg-orange-600 active:scale-[0.98] text-white font-bold rounded-xl transition-all shadow-lg shadow-orange-500/20 flex items-center justify-center gap-2"
              >
                Verificar Código <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        )}

        {/* PASO 3: Perfil */}
        {step === 3 && (
          <form onSubmit={handleCompleteRegistration} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
                Nombre o Alias de Ciclista
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ej: Sofía Veloz"
                  required
                  className="w-full bg-zinc-950 border border-zinc-800 focus:border-orange-500 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
                Tipo Principal de Bicicleta
              </label>
              <select
                value={bikeType}
                onChange={(e) => setBikeType(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 focus:border-orange-500 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none transition-colors"
              >
                {bikeOptions.map((opt) => (
                  <option key={opt.id} value={opt.label}>
                    {opt.icon} {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
                Contacto SOS Predeterminado (Opcional)
              </label>
              <div className="relative">
                <Shield className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  value={emergencyContact}
                  onChange={(e) => setEmergencyContact(e.target.value)}
                  placeholder="Nombre y teléfono"
                  className="w-full bg-zinc-950 border border-zinc-800 focus:border-orange-500 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3.5 px-4 bg-orange-500 hover:bg-orange-600 active:scale-[0.98] text-white font-bold rounded-xl transition-all shadow-xl shadow-orange-500/25 flex items-center justify-center gap-2 text-base mt-2"
            >
              <CheckCircle2 className="w-5 h-5" /> Comenzar a Rodar
            </button>
          </form>
        )}

        {/* Footer features */}
        <div className="mt-8 pt-6 border-t border-zinc-800/80 flex items-center justify-between text-[11px] text-zinc-500">
          <span className="flex items-center gap-1">
            <Shield className="w-3.5 h-3.5 text-emerald-500" /> SOS 100% Local
          </span>
          <span className="flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-orange-400" /> Rutas IA Seguras
          </span>
          <span className="flex items-center gap-1">
            <Navigation className="w-3.5 h-3.5 text-sky-400" /> GPS MapLibre
          </span>
        </div>
      </div>
    </div>
  );
}
