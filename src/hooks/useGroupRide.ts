/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useCallback } from 'react';
import { 
  groupRideService, 
  RideGroup, 
  GroupDiscipline, 
  PingType, 
  RideGroupMember,
  PublicGroupSummary
} from '../services/groupRideService';

export function useGroupRide() {
  const [activeGroup, setActiveGroup] = useState<RideGroup | null>(() => 
    groupRideService.getActiveGroup()
  );

  useEffect(() => {
    const unsubscribe = groupRideService.subscribe((group) => {
      setActiveGroup(group);
    });
    return () => {
      unsubscribe();
    };
  }, []);

  const createGroup = useCallback((params: {
    name: string;
    discipline: GroupDiscipline;
    userName: string;
    userCoords: { lat: number; lng: number };
    durationHours?: number;
  }) => {
    return groupRideService.createGroup(params);
  }, []);

  const joinGroup = useCallback((
    code: string, 
    userName: string, 
    userCoords: { lat: number; lng: number }
  ) => {
    return groupRideService.joinGroup(code, userName, userCoords);
  }, []);

  const leaveGroup = useCallback(() => {
    groupRideService.leaveGroup();
  }, []);

  const sendPing = useCallback((type: PingType, message?: string) => {
    return groupRideService.sendPing(type, message);
  }, []);

  const updateUserLocation = useCallback((lat: number, lng: number, speedKmh?: number) => {
    groupRideService.updateUserLocation(lat, lng, speedKmh);
  }, []);

  const getPublicGroups = useCallback((): PublicGroupSummary[] => {
    return groupRideService.getPublicGroups();
  }, []);

  return {
    activeGroup,
    isInGroup: !!activeGroup,
    createGroup,
    joinGroup,
    leaveGroup,
    sendPing,
    updateUserLocation,
    getPublicGroups
  };
}
