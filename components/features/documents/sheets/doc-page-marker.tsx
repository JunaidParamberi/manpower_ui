type DocPageMarkerProps = {
  left: string;
  right: string;
};

export function DocPageMarker({ left, right }: DocPageMarkerProps) {
  return (
    <div className="page-num">
      <span>{left}</span>
      <span>{right}</span>
    </div>
  );
}
