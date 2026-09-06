export default function LoadingSpinner() {
  return (
    <div className="flex min-h-[50vh] w-full items-center justify-center">
      <svg viewBox="0 0 100 100" className="h-16 w-16 animate-spin" style={{ animationDuration: "1.4s" }}>
        <circle
          cx="50"
          cy="50"
          r="40"
          fill="none"
          stroke="#B80319"
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray="70 190"
          strokeDashoffset="0"
        />
        <circle
          cx="50"
          cy="50"
          r="40"
          fill="none"
          stroke="#E59200"
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray="70 190"
          strokeDashoffset="-84"
        />
        <circle
          cx="50"
          cy="50"
          r="40"
          fill="none"
          stroke="#00A5A8"
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray="70 190"
          strokeDashoffset="-168"
        />
      </svg>
    </div>
  );
}