/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { useTrackerEngine } from './hooks/useTrackerEngine';
import { Header } from './components/Header';
import { Sidebar, NavTab } from './components/Sidebar';
import { DashboardView } from './components/DashboardView';
import { LiveFeedView } from './components/LiveFeedView';
import { AnalyticsPanel } from './components/AnalyticsPanel';
import { EventLogsTable } from './components/EventLogsTable';
import { SettingsPanel } from './components/SettingsPanel';
import { AboutProjectPanel } from './components/AboutProjectPanel';

export default function App() {
  const [currentTab, setCurrentTab] = useState<NavTab>('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false);

  const {
    status,
    setStatus,
    frameNumber,
    currentTimeSec,
    fps,
    activeTracks,
    cumulativeIn,
    cumulativeOut,
    eventLogs,
    countHistory,
    settings,
    updateSettings,
    countingLine,
    updateCountingLine,
    uploadedVideoFile,
    uploadedVideoUrl,
    handleUploadVideo,
    clearUploadedVideo,
    resetDemo,
    clearLogs,
    isWebSocketActive,
    webSocketError,
    simulationEngine,
  } = useTrackerEngine();

  const handleTogglePlayPause = () => {
    setStatus(status === 'running' ? 'paused' : 'running');
  };

  const peakCount = useMemo(() => {
    if (countHistory.length === 0) return activeTracks.length;
    return Math.max(...countHistory.map((h) => h.visibleCount), activeTracks.length);
  }, [countHistory, activeTracks.length]);

  const avgCount = useMemo(() => {
    if (countHistory.length === 0) return activeTracks.length;
    const sum = countHistory.reduce((acc, h) => acc + h.visibleCount, 0);
    return sum / countHistory.length;
  }, [countHistory, activeTracks.length]);

  const isRealBackend = settings.backendMode === 'local_websocket' && isWebSocketActive;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Bar Header adhering strictly to Top Bar Contract */}
      <Header
        status={status}
        onTogglePlayPause={handleTogglePlayPause}
        onReset={resetDemo}
        backendMode={settings.backendMode}
        isWebSocketActive={isWebSocketActive}
      />

      {/* Main Workspace: Sidebar Navigation + Content Canvas */}
      <div className="flex-1 flex overflow-hidden">
        {/* Collapsible Sidebar */}
        <Sidebar
          currentTab={currentTab}
          onSelectTab={setCurrentTab}
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
          activeCount={activeTracks.length}
        />

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 bg-slate-950">
          <div className="max-w-7xl mx-auto">
            {currentTab === 'dashboard' && (
              <DashboardView
                status={status}
                onSetStatus={setStatus}
                tracks={activeTracks}
                currentTimeSec={currentTimeSec}
                frameNumber={frameNumber}
                fps={fps}
                cumulativeIn={cumulativeIn}
                cumulativeOut={cumulativeOut}
                settings={settings}
                onUpdateSettings={updateSettings}
                countingLine={countingLine}
                uploadedVideoUrl={uploadedVideoUrl}
                uploadedVideoFile={uploadedVideoFile}
                onUploadVideo={handleUploadVideo}
                onClearUploadedVideo={clearUploadedVideo}
                simulationEngine={simulationEngine}
                countHistory={countHistory}
                eventLogs={eventLogs}
                onClearLogs={clearLogs}
                onNavigateTab={setCurrentTab}
                isRealBackend={isRealBackend}
              />
            )}

            {currentTab === 'live_feed' && (
              <LiveFeedView
                status={status}
                onSetStatus={setStatus}
                tracks={activeTracks}
                currentTimeSec={currentTimeSec}
                frameNumber={frameNumber}
                fps={fps}
                settings={settings}
                onUpdateSettings={updateSettings}
                countingLine={countingLine}
                onUpdateCountingLine={updateCountingLine}
                uploadedVideoUrl={uploadedVideoUrl}
                uploadedVideoFile={uploadedVideoFile}
                onUploadVideo={handleUploadVideo}
                onClearUploadedVideo={clearUploadedVideo}
                simulationEngine={simulationEngine}
              />
            )}

            {currentTab === 'analytics' && (
              <AnalyticsPanel
                history={countHistory}
                frameNumber={frameNumber}
                sessionDurationSec={currentTimeSec}
                peakCount={peakCount}
                averageCount={avgCount}
              />
            )}

            {currentTab === 'logs' && (
              <EventLogsTable
                logs={eventLogs}
                onClearLogs={clearLogs}
                isRealBackend={isRealBackend}
              />
            )}

            {currentTab === 'settings' && (
              <SettingsPanel
                settings={settings}
                onUpdateSettings={updateSettings}
                countingLine={countingLine}
                onUpdateCountingLine={updateCountingLine}
                isWebSocketActive={isWebSocketActive}
                webSocketError={webSocketError}
              />
            )}

            {currentTab === 'about' && <AboutProjectPanel />}
          </div>
        </main>
      </div>
    </div>
  );
}
