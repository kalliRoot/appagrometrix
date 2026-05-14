export default function OfflineIndicator({ isOnline }: { isOnline: boolean }) {
  if (isOnline) return null;

  return (
    <div className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium flex items-center space-x-1">
      <span className="w-2 h-2 bg-yellow-600 rounded-full animate-pulse"></span>
      <span>Offline</span>
    </div>
  );
}
