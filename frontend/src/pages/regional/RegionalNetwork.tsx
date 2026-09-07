import React from 'react';
import { Header } from '../../components/layout/Header';
import { TopologyMap } from '../../components/network/TopologyMap';
import { LivePacketInspector } from '../../components/network/LivePacketInspector';
import { EventTimeline } from '../../components/lab/EventTimeline';

export const RegionalNetwork: React.FC = () => {
  return (
    <div className="flex-1 flex flex-col">
      <Header
        title="Regional Gateway Network Telemetry"
        subtitle="Gateway: MH-HUB (203.0.113.1) · National OFC Link & Regional Subnets"
      />

      <div className="p-8 space-y-8 flex-1">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8 space-y-4">
            <TopologyMap filterRegion="MH" height={460} />
            <LivePacketInspector />
          </div>

          <div className="lg:col-span-4">
            <EventTimeline />
          </div>
        </div>
      </div>
    </div>
  );
};
