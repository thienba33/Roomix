'use client';
import { useEffect, useState } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { addFavorite, removeFavorite, listFavorites, FAVORITES_EVENT, CATALOG_EVENT, AUTH_EVENT } from '@/services/mock/rooms';

export default function FavoriteButton({ roomId }: { roomId: string }) {
  const { user, ready, requireTenant } = useAuth();
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => {
    const sync = () => {
      try { setSaved(listFavorites().some((f) => f.room.roomId === roomId)); }
      catch { setSaved(false); }
    };
    sync();
    [FAVORITES_EVENT, CATALOG_EVENT, AUTH_EVENT, 'storage'].forEach((event) => window.addEventListener(event, sync));
    return () => [FAVORITES_EVENT, CATALOG_EVENT, AUTH_EVENT, 'storage'].forEach((event) => window.removeEventListener(event, sync));
  }, [roomId, user?.id]);
  const toggle = () => {
    setError('');
    if (!requireTenant()) return;
    try { if (saved) removeFavorite(roomId); else addFavorite(roomId); }
    catch (e) { setError(e instanceof Error ? e.message : 'Không thể lưu yêu thích.'); }
  };
  return <div>
    <button type="button" disabled={!ready} onClick={toggle} aria-label={saved ? 'Bỏ yêu thích' : 'Lưu yêu thích'} aria-pressed={saved} className="flex h-10 w-10 items-center justify-center rounded-full border border-line bg-white text-primary shadow-sm hover:bg-primary-soft">
      <svg width="21" height="21" viewBox="0 0 24 24" fill={saved ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" /></svg>
    </button>
    {error && <p role="alert" className="mt-2 max-w-56 rounded-lg bg-white p-2 text-xs text-red-600 shadow">{error}</p>}
  </div>;
}
