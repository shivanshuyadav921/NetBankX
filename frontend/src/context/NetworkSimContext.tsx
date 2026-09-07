import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { NetworkNode, NetworkLink, SimulationEvent, SimulationPacket, NetworkMetrics, CalculatedRoute } from '../types';
import { ApiClient } from '../services/api';
import { getSocket } from '../services/socket';

interface NetworkSimContextType {
  nodes: NetworkNode[];
  links: NetworkLink[];
  metrics: NetworkMetrics | null;
  events: SimulationEvent[];
  activePacket: SimulationPacket | null;
  activeRoute: CalculatedRoute | null;
  selectedNode: NetworkNode | null;
  selectedLink: NetworkLink | null;
  speedMultiplier: number;
  tlsEnabled: boolean;
  isLoadingTopology: boolean;
  setSpeedMultiplier: (speed: number) => void;
  setTlsEnabled: (enabled: boolean) => void;
  setSelectedNode: (node: NetworkNode | null) => void;
  setSelectedLink: (link: NetworkLink | null) => void;
  setActiveRoute: (route: CalculatedRoute | null) => void;
  refreshTopology: () => Promise<void>;
  toggleNodeStatus: (nodeId: string, currentStatus: string) => Promise<void>;
  toggleLinkStatus: (linkId: string, currentStatus: string) => Promise<void>;
  resetTopology: () => Promise<void>;
  updateFaultParams: (params: any) => Promise<void>;
  addLocalEvent: (event: SimulationEvent) => void;
  clearEvents: () => void;
}

const NetworkSimContext = createContext<NetworkSimContextType | undefined>(undefined);

export const NetworkSimProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [nodes, setNodes] = useState<NetworkNode[]>([]);
  const [links, setLinks] = useState<NetworkLink[]>([]);
  const [metrics, setMetrics] = useState<NetworkMetrics | null>(null);
  const [events, setEvents] = useState<SimulationEvent[]>([]);
  const [activePacket, setActivePacket] = useState<SimulationPacket | null>(null);
  const [activeRoute, setActiveRoute] = useState<CalculatedRoute | null>(null);
  const [selectedNode, setSelectedNode] = useState<NetworkNode | null>(null);
  const [selectedLink, setSelectedLink] = useState<NetworkLink | null>(null);
  const [speedMultiplier, setSpeedMultiplier] = useState<number>(1.0);
  const [tlsEnabled, setTlsEnabled] = useState<boolean>(true);
  const [isLoadingTopology, setIsLoadingTopology] = useState<boolean>(true);

  const refreshTopology = useCallback(async () => {
    try {
      const data = await ApiClient.getTopology();
      if (data) {
        setNodes(data.nodes || []);
        setLinks(data.links || []);
      }
      const initialMetrics = await ApiClient.getMetrics();
      if (initialMetrics) setMetrics(initialMetrics);

      const initialEvents = await ApiClient.getEvents(30);
      if (initialEvents) setEvents(initialEvents);
    } catch (err) {
      console.error('Failed to load topology:', err);
    } finally {
      setIsLoadingTopology(false);
    }
  }, []);

  useEffect(() => {
    refreshTopology();

    const socket = getSocket();

    const handleEvent = (event: SimulationEvent) => {
      setEvents(prev => [event, ...prev.slice(0, 99)]);
    };

    const handlePacket = (packet: SimulationPacket) => {
      setActivePacket(packet);
    };

    const handleMetrics = (newMetrics: NetworkMetrics) => {
      setMetrics(newMetrics);
    };

    const handleTopology = (data: { nodes: NetworkNode[]; links: NetworkLink[] }) => {
      if (data.nodes) setNodes(data.nodes);
      if (data.links) setLinks(data.links);
    };

    socket.on('simulation:event', handleEvent);
    socket.on('simulation:packet', handlePacket);
    socket.on('simulation:metrics', handleMetrics);
    socket.on('simulation:topology', handleTopology);

    // Also support EventSource (Server-Sent Events) for serverless deployment
    let eventSource: EventSource | null = null;
    try {
      eventSource = new EventSource('/api/v1/network/stream');
      eventSource.addEventListener('simulation:event', (e) => {
        try { handleEvent(JSON.parse(e.data)); } catch (_) {}
      });
      eventSource.addEventListener('simulation:packet', (e) => {
        try { handlePacket(JSON.parse(e.data)); } catch (_) {}
      });
      eventSource.addEventListener('simulation:metrics', (e) => {
        try { handleMetrics(JSON.parse(e.data)); } catch (_) {}
      });
      eventSource.addEventListener('simulation:topology', (e) => {
        try { handleTopology(JSON.parse(e.data)); } catch (_) {}
      });
    } catch (err) {
      // EventSource optional in environments without SSE
    }

    return () => {
      socket.off('simulation:event', handleEvent);
      socket.off('simulation:packet', handlePacket);
      socket.off('simulation:metrics', handleMetrics);
      socket.off('simulation:topology', handleTopology);
      if (eventSource) {
        eventSource.close();
      }
    };
  }, [refreshTopology]);

  const toggleNodeStatus = async (nodeId: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'OFFLINE' ? 'HEALTHY' : 'OFFLINE';
    await ApiClient.setNodeStatus(nodeId, nextStatus as any);
    await refreshTopology();
  };

  const toggleLinkStatus = async (linkId: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'SEVERED' ? 'ACTIVE' : 'SEVERED';
    await ApiClient.setLinkStatus(linkId, nextStatus as any);
    await refreshTopology();
  };

  const resetTopology = async () => {
    await ApiClient.resetTopology();
    await refreshTopology();
  };

  const updateFaultParams = async (params: any) => {
    await ApiClient.setFaultParams(params);
    const updatedMetrics = await ApiClient.getMetrics();
    setMetrics(updatedMetrics);
  };

  const addLocalEvent = (event: SimulationEvent) => {
    setEvents(prev => [event, ...prev.slice(0, 99)]);
  };

  const clearEvents = () => {
    setEvents([]);
  };

  return (
    <NetworkSimContext.Provider
      value={{
        nodes,
        links,
        metrics,
        events,
        activePacket,
        activeRoute,
        selectedNode,
        selectedLink,
        speedMultiplier,
        tlsEnabled,
        isLoadingTopology,
        setSpeedMultiplier,
        setTlsEnabled,
        setSelectedNode,
        setSelectedLink,
        setActiveRoute,
        refreshTopology,
        toggleNodeStatus,
        toggleLinkStatus,
        resetTopology,
        updateFaultParams,
        addLocalEvent,
        clearEvents
      }}
    >
      {children}
    </NetworkSimContext.Provider>
  );
};

export function useNetworkSim() {
  const context = useContext(NetworkSimContext);
  if (!context) {
    throw new Error('useNetworkSim must be used within a NetworkSimProvider');
  }
  return context;
}
