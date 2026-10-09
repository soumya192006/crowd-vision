import { EventLog, CountHistoryItem } from '../types';

export function downloadCSV(filename: string, csvContent: string): void {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function exportEventLogsToCSV(logs: EventLog[]): void {
  const headers = ['Timestamp', 'Frame', 'Event_Type', 'Track_ID', 'Confidence', 'Description'];
  const rows = logs.map(log => [
    `"${log.timestamp}"`,
    log.frameNumber,
    `"${log.type}"`,
    log.trackId ?? 'N/A',
    log.confidence !== undefined ? (log.confidence * 100).toFixed(1) + '%' : 'N/A',
    `"${log.description.replace(/"/g, '""')}"`,
  ]);

  const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  downloadCSV(`crowdvision_event_logs_${timestamp}.csv`, csv);
}

export function exportCountHistoryToCSV(history: CountHistoryItem[]): void {
  const headers = [
    'Timestamp',
    'Time_Seconds',
    'Frame',
    'Visible_People_Count',
    'Active_Track_IDs',
    'FPS',
    'Avg_Confidence_Percent',
    'Cumulative_In',
    'Cumulative_Out',
  ];

  const rows = history.map(item => [
    `"${item.timestamp}"`,
    item.timeSec.toFixed(2),
    item.frame,
    item.visibleCount,
    item.activeTracks,
    item.fps.toFixed(1),
    (item.avgConfidence * 100).toFixed(1),
    item.cumulativeIn,
    item.cumulativeOut,
  ]);

  const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  downloadCSV(`crowdvision_count_history_${timestamp}.csv`, csv);
}
