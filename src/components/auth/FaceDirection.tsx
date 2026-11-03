import styles from './AdminFaceLogin.module.css';

/** Actions use the person's left/right, matching the mirrored preview. */
export default function FaceDirection({ action }: { action: string | null }) {
  if (action !== 'TURN_LEFT' && action !== 'TURN_RIGHT') return null;
  const right = action === 'TURN_RIGHT';
  return <div className={styles.direction} data-direction={right ? 'right' : 'left'} aria-hidden="true">
    <svg width="48" height="32" viewBox="0 0 48 32" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
      <path d={right ? 'M6 16h36M30 4l12 12-12 12' : 'M42 16H6M18 4 6 16l12 12'} />
    </svg>
    <span>{right ? 'Quay sang phải' : 'Quay sang trái'}</span>
  </div>;
}
