import { lazy } from "react";

export const facsimileRegistry: Record<string, React.LazyExoticComponent<any>> = {
  "monofer-motivation": lazy(() => import("./MonoferMotivationForm")),
};
