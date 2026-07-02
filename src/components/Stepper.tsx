export function StepEyebrow({ step, total, label }: { step: number; total: number; label?: string }) {
  return (
    <div className="eyebrow">
      Step {step} of {total}
      {label ? ` · ${label}` : ''}
    </div>
  );
}
