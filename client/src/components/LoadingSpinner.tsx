import ministryOfLaborLogo from "@/assets/images/ministry-of-labor-logo.png";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeMap = {
  sm: "w-8 h-8",
  md: "w-12 h-12",
  lg: "w-16 h-16",
};

export function LoadingSpinner({ size = "md", className = "" }: LoadingSpinnerProps) {
  return (
    <img
      src={ministryOfLaborLogo}
      alt="Loading..."
      className={`animate-logo-breathe rounded-full ${sizeMap[size]} ${className}`}
      data-testid="loading-spinner"
    />
  );
}

export function PageLoadingSpinner() {
  return (
    <div className="flex items-center justify-center min-h-screen" data-testid="page-loader">
      <LoadingSpinner size="lg" />
    </div>
  );
}

export function SectionLoadingSpinner({ className = "" }: { className?: string }) {
  return (
    <div className={`flex justify-center p-12 ${className}`} data-testid="section-loader">
      <LoadingSpinner size="md" />
    </div>
  );
}
