export const formatRelativeTime = (dateInput: string | Date | number): string => {
  const date = new Date(dateInput);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return `${Math.max(1, diffInSeconds)}s`;
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes}m`;
  }

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours}h`;
  }

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) {
    return `${diffInDays}d`;
  }

  // Older than 7 days, show Absolute Date
  const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
  
  // If different year, add year
  if (date.getFullYear() !== now.getFullYear()) {
    options.year = 'numeric';
  }

  return date.toLocaleDateString(undefined, options);
};

export const formatFullDateTime = (dateInput: string | Date | number): string => {
  const date = new Date(dateInput);
  return date.toLocaleString(undefined, {
    hour: 'numeric',
    minute: 'numeric',
    hour12: true,
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
};
