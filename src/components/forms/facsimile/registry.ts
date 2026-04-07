import { lazy, ComponentType } from "react";

interface FacsimileProps {
  values: Record<string, any>;
  onChange: (values: Record<string, any>) => void;
  readOnly?: boolean;
}

export const facsimileRegistry: Record<string, React.LazyExoticComponent<ComponentType<FacsimileProps>>> = {
  "monofer-motivation": lazy(() => import("./MonoferMotivationForm")),
};

export const availableFacsimileSlugs = Object.keys(facsimileRegistry);
