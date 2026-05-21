export default function Badge({ children, variant = 'green', className = '' }) {
  const variants = {
    green: 'bg-[#1CA672] text-white',
    orange: 'bg-[#FF6B35] text-white',
    red: 'bg-red-500 text-white',
    gray: 'bg-gray-100 text-gray-600',
    yellow: 'bg-yellow-400 text-white',
  };
  return (
    <span
      className={`inline-flex items-center text-[10px] font-bold px-1.5 py-0.5 rounded-md ${variants[variant]} ${className}`}
    >
      {children}
    </span>
  );
}
