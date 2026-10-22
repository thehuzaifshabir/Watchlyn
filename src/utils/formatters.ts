/**
 * Pure formatting utilities for media metadata and Cinejoy display rules.
 */

export function formatRuntime(minutes?: number | null): string {
  if (!minutes || minutes <= 0) return 'N/A';
  const hours = Math.floor(minutes / 60);
  const remainingMins = minutes % 60;
  if (hours > 0 && remainingMins > 0) {
    return `${hours}h ${remainingMins}m`;
  } else if (hours > 0) {
    return `${hours}h`;
  }
  return `${remainingMins}m`;
}

export function calculateEndsAt(minutes: number, baseDate: Date = new Date()): string {
  if (!minutes || minutes <= 0) return '';
  const endTime = new Date(baseDate.getTime() + minutes * 60 * 1000);
  let hours = endTime.getHours();
  const mins = endTime.getMinutes().toString().padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12; // 0 hour is 12 AM
  return `${hours}:${mins} ${ampm}`;
}

export function formatCurrency(val?: number | null): string {
  if (val === undefined || val === null || val <= 0) return '';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(val);
}

export function formatYear(dateStr?: string | null): string {
  if (!dateStr) return '';
  const match = dateStr.match(/^(\d{4})/);
  return match ? match[1] : '';
}

export function formatRating(val?: number | null): string {
  if (val === undefined || val === null || val === 0) return 'NR';
  return (Math.round(val * 10) / 10).toFixed(1);
}

export function formatDateFull(dateStr?: string | null): string {
  if (!dateStr) return 'N/A';
  try {
    const [year, month, day] = dateStr.split('-');
    if (!year || !month || !day) return dateStr;
    const date = new Date(Date.UTC(parseInt(year, 10), parseInt(month, 10) - 1, parseInt(day, 10)));
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      timeZone: 'UTC',
    });
  } catch {
    return dateStr;
  }
}

export function formatProgressTime(seconds?: number | null): string {
  if (!seconds || seconds <= 0) return '0:00';
  const totalSecs = Math.floor(seconds);
  const hrs = Math.floor(totalSecs / 3600);
  const mins = Math.floor((totalSecs % 3600) / 60);
  const secs = totalSecs % 60;

  if (hrs > 0) {
    return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export function formatTimeRemaining(progressSeconds?: number | null, durationSeconds?: number | null): string {
  if (progressSeconds && durationSeconds && durationSeconds > progressSeconds) {
    const remainingMins = Math.round((durationSeconds - progressSeconds) / 60);
    if (remainingMins > 0) {
      return `${remainingMins}m left`;
    }
  }
  if (progressSeconds && progressSeconds > 5) {
    return `Resume at ${formatProgressTime(progressSeconds)}`;
  }
  return '';
}
