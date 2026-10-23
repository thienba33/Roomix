interface Props {
  id: string;
  message: string;
  reserveMessage: string;
}

export default function ValidationMessage({ id, message, reserveMessage }: Props) {
  return (
    <div className="mt-1 grid text-xs font-medium leading-4 text-red-600">
      {/* Reserve space for wrapped errors too, including on narrow screens. */}
      <span aria-hidden="true" className="invisible col-start-1 row-start-1">{reserveMessage}</span>
      <p id={id} aria-live="polite" aria-atomic="true" className="col-start-1 row-start-1">{message}</p>
    </div>
  );
}
