import React, { useState } from 'react';
import { Phone, ArrowRight, ShieldCheck, Bike } from 'lucide-react';

export default function Auth({ onLogin }: { onLogin: (name: string) => void }) {
  const [step, setStep] = useState(1);
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [name, setName] = useState('');
  const [bikeType, setBikeType] = useState('MTB');
  const [level, setLevel] = useState('Intermedio');

  const handleNext = (e: React.FormEvent) => {
    e.preventDefault();
    if (step === 1 && phone) setStep(2);
    else if (step === 2 && otp) setStep(3);
    else if (step === 3 && name) onLogin(name);
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 bg-zinc-950 w-full h-full">
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center">
          <div className="bg-orange-500/20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <Bike className="w-8 h-8 text-orange-500" />
          </div>
          <h2 className="text-2xl font-bold text-white">
            {step === 1 ? 'Tu número' : step === 2 ? 'Verificar código' : 'Tu perfil'}
          </h2>
          <p className="text-sm text-zinc-400 mt-2">
            {step === 1 ? 'Ingresa tu teléfono para comenzar' : step === 2 ? 'Enviamos un SMS al ' + phone : 'Completa tus datos ciclistas'}
          </p>
        </div>

        <form onSubmit={handleNext} className="space-y-4">
          {step === 1 && (
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
              <input 
                type="tel"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="+54 11 1234-5678"
                className="w-full pl-10 pr-4 py-3 bg-zinc-900 border border-zinc-800 text-white rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all placeholder:text-zinc-600"
                required
              />
            </div>
          )}

          {step === 2 && (
            <div className="relative">
              <ShieldCheck className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
              <input 
                type="text"
                value={otp}
                onChange={e => setOtp(e.target.value)}
                placeholder="000000"
                maxLength={6}
                className="w-full pl-10 pr-4 py-3 bg-zinc-900 border border-zinc-800 text-white rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all text-center tracking-widest text-lg placeholder:text-zinc-600"
                required
              />
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <input 
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Nombre completo"
                className="w-full px-4 py-3 bg-zinc-900 border border-zinc-800 text-white rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none placeholder:text-zinc-600"
                required
              />
              <select 
                value={bikeType}
                onChange={e => setBikeType(e.target.value)}
                className="w-full px-4 py-3 bg-zinc-900 border border-zinc-800 text-white rounded-xl outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              >
                <option value="MTB">Mountain Bike (MTB)</option>
                <option value="Ruta">Bicicleta de Ruta</option>
                <option value="Urbana">Bicicleta Urbana</option>
                <option value="Gravel">Gravel</option>
              </select>
              <select 
                value={level}
                onChange={e => setLevel(e.target.value)}
                className="w-full px-4 py-3 bg-zinc-900 border border-zinc-800 text-white rounded-xl outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              >
                <option value="Principiante">Principiante</option>
                <option value="Intermedio">Intermedio</option>
                <option value="Avanzado">Avanzado / Pro</option>
              </select>
            </div>
          )}

          <button 
            type="submit"
            className="w-full bg-orange-500 hover:bg-orange-600 text-black font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors"
          >
            {step === 3 ? 'Comenzar a rodar' : 'Continuar'}
            <ArrowRight className="w-5 h-5" />
          </button>
        </form>
      </div>
    </div>
  );
}
