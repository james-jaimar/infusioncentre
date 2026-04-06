import { useState, useRef, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import SignatureCanvas from "./SignatureCanvas";

export interface OverlayField {
  field_name: string;
  field_type: "text" | "checkbox" | "signature" | "date" | "select" | "textarea" | "radio";
  label?: string;
  page: number;
  x: number; // percentage
  y: number; // percentage
  width: number; // percentage
  height: number; // percentage
  options?: string[];
  required?: boolean;
  placeholder?: string;
  font_size?: number; // px at 100% scale
}

interface PdfOverlayRendererProps {
  pdfPages: string[]; // URLs to page images
  overlayFields: OverlayField[];
  values: Record<string, any>;
  onChange: (values: Record<string, any>) => void;
  readOnly?: boolean;
}

export default function PdfOverlayRenderer({
  pdfPages,
  overlayFields,
  values,
  onChange,
  readOnly,
}: PdfOverlayRendererProps) {
  const handleChange = useCallback(
    (fieldName: string, value: any) => {
      onChange({ ...values, [fieldName]: value });
    },
    [values, onChange]
  );

  return (
    <div className="space-y-4">
      {pdfPages.map((pageUrl, pageIndex) => (
        <PdfPage
          key={pageIndex}
          pageUrl={pageUrl}
          pageNumber={pageIndex + 1}
          fields={overlayFields.filter((f) => f.page === pageIndex + 1)}
          values={values}
          onChange={handleChange}
          readOnly={readOnly}
        />
      ))}
    </div>
  );
}

interface PdfPageProps {
  pageUrl: string;
  pageNumber: number;
  fields: OverlayField[];
  values: Record<string, any>;
  onChange: (fieldName: string, value: any) => void;
  readOnly?: boolean;
}

function PdfPage({ pageUrl, pageNumber, fields, values, onChange, readOnly }: PdfPageProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [naturalSize, setNaturalSize] = useState({ width: 1, height: 1 });

  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    setNaturalSize({ width: img.naturalWidth, height: img.naturalHeight });
    setImageLoaded(true);
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full border border-border rounded-lg overflow-hidden shadow-sm bg-white"
      style={{ aspectRatio: `${naturalSize.width} / ${naturalSize.height}` }}
    >
      {/* PDF page background */}
      <img
        src={pageUrl}
        alt={`Form page ${pageNumber}`}
        className="w-full h-full object-contain select-none pointer-events-none"
        onLoad={handleImageLoad}
        draggable={false}
      />

      {/* Overlay fields */}
      {imageLoaded &&
        fields.map((field) => (
          <OverlayFieldWidget
            key={field.field_name}
            field={field}
            value={values[field.field_name]}
            onChange={(val) => onChange(field.field_name, val)}
            readOnly={readOnly}
          />
        ))}
    </div>
  );
}

interface OverlayFieldWidgetProps {
  field: OverlayField;
  value: any;
  onChange: (value: any) => void;
  readOnly?: boolean;
}

function OverlayFieldWidget({ field, value, onChange, readOnly }: OverlayFieldWidgetProps) {
  const fontSize = field.font_size || 14;

  const positionStyle: React.CSSProperties = {
    position: "absolute",
    left: `${field.x}%`,
    top: `${field.y}%`,
    width: `${field.width}%`,
    height: `${field.height}%`,
    zIndex: 10,
  };

  switch (field.field_type) {
    case "checkbox":
      return (
        <div style={positionStyle} className="flex items-center justify-center">
          <Checkbox
            checked={!!value}
            onCheckedChange={(checked) => onChange(!!checked)}
            disabled={readOnly}
            className="h-5 w-5 border-2 border-gray-600 bg-white/80 data-[state=checked]:bg-primary"
          />
        </div>
      );

    case "text":
      return (
        <div style={positionStyle}>
          <Input
            value={value || ""}
            onChange={(e) => onChange(e.target.value)}
            readOnly={readOnly}
            placeholder={field.placeholder}
            className="h-full w-full border-0 bg-transparent focus:bg-blue-50/50 focus:ring-1 focus:ring-primary/30 rounded-none px-1"
            style={{ fontSize: `${fontSize}px`, lineHeight: "1.2" }}
          />
        </div>
      );

    case "textarea":
      return (
        <div style={positionStyle}>
          <Textarea
            value={value || ""}
            onChange={(e) => onChange(e.target.value)}
            readOnly={readOnly}
            placeholder={field.placeholder}
            className="h-full w-full border-0 bg-transparent focus:bg-blue-50/50 focus:ring-1 focus:ring-primary/30 rounded-none px-1 resize-none"
            style={{ fontSize: `${fontSize}px`, lineHeight: "1.3" }}
          />
        </div>
      );

    case "date":
      return (
        <div style={positionStyle}>
          <Input
            type="date"
            value={value || ""}
            onChange={(e) => onChange(e.target.value)}
            readOnly={readOnly}
            className="h-full w-full border-0 bg-transparent focus:bg-blue-50/50 focus:ring-1 focus:ring-primary/30 rounded-none px-1"
            style={{ fontSize: `${fontSize}px` }}
          />
        </div>
      );

    case "select":
      return (
        <div style={positionStyle}>
          <Select value={value || ""} onValueChange={onChange} disabled={readOnly}>
            <SelectTrigger
              className="h-full w-full border-0 bg-transparent focus:bg-blue-50/50 rounded-none px-1"
              style={{ fontSize: `${fontSize}px` }}
            >
              <SelectValue placeholder={field.placeholder || "Select..."} />
            </SelectTrigger>
            <SelectContent>
              {(field.options || []).map((opt) => (
                <SelectItem key={opt} value={opt}>
                  {opt}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      );

    case "signature":
      return (
        <div style={positionStyle} className="bg-white/60 rounded">
          <SignatureCanvas
            label={field.label || "Signature"}
            value={value}
            onChange={onChange}
            readOnly={readOnly}
          />
        </div>
      );

    case "radio":
      return (
        <div style={positionStyle} className="flex items-center justify-center">
          <input
            type="radio"
            checked={!!value}
            onChange={() => onChange(!value)}
            disabled={readOnly}
            className="h-4 w-4 accent-primary"
          />
        </div>
      );

    default:
      return null;
  }
}
