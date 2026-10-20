'use client';
import Modal from './Modal';
import Button from './Button';

interface Props {
  open: boolean;
  title: string;
  /** Names the consequence of confirming (what will happen / what cannot be undone). */
  description: string;
  confirmLabel: string;
  cancelLabel?: string;
  /** Renders the confirm button in the danger style (destructive actions). */
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * Reusable confirmation dialog built on the shared Modal.
 * Closes on Esc and on backdrop click via Modal (both route to onCancel).
 */
export default function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  cancelLabel = 'Hủy',
  danger = false,
  onConfirm,
  onCancel,
}: Props) {
  return (
    <Modal open={open} onClose={onCancel} title={title} widthClass="max-w-md">
      <p className="text-sm leading-relaxed text-muted">{description}</p>
      <div className="mt-6 flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          {cancelLabel}
        </Button>
        <Button
          type="button"
          variant={danger ? 'danger' : 'primary'}
          onClick={() => {
            onConfirm();
            onCancel();
          }}
        >
          {confirmLabel}
        </Button>
      </div>
    </Modal>
  );
}
