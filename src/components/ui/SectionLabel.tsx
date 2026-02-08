interface SectionLabelProps {
  children: React.ReactNode;
  className?: string;
}

const SectionLabel = ({ children, className = "" }: SectionLabelProps) => {
  return (
    <span className={`inline-block font-heading text-sm font-medium tracking-widest uppercase text-primary ${className}`}>
      <span className="mr-2">|</span>
      {children}
      <span className="ml-2">|</span>
    </span>
  );
};

export default SectionLabel;
