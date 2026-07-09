export const getApiUrl = (path: string): string => {
  const isCapacitor = (window as any).Capacitor !== undefined || window.location.origin.startsWith('capacitor://');
  const base = isCapacitor 
    ? "https://ais-pre-wndxvgxm6cj4abbudx5fyj-407012232135.asia-southeast1.run.app" 
    : "";
  return `${base}${path}`;
};
