/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { 
  Construction, 
  AlertCircle, 
  ShieldAlert, 
  Dog, 
  Sparkles, 
  Ban, 
  ShieldCheck, 
  AlertTriangle 
} from 'lucide-react';
import { HazardType } from '../services/hazardsService';

interface HazardIconProps {
  type: HazardType;
  className?: string;
}

export default function HazardIcon({ type, className = 'w-4 h-4' }: HazardIconProps) {
  switch (type) {
    case 'obras':
      return <Construction className={className} />;
    case 'baches':
      return <AlertCircle className={className} />;
    case 'ruta_peligrosa':
      return <ShieldAlert className={className} />;
    case 'perros':
      return <Dog className={className} />;
    case 'vidrios':
      return <Sparkles className={className} />;
    case 'ciclovia_bloqueada':
      return <Ban className={className} />;
    case 'punto_seguro':
      return <ShieldCheck className={className} />;
    default:
      return <AlertTriangle className={className} />;
  }
}
