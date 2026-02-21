import { useEffect } from "react";

export function usePageTitle(title: string, description?: string) {
  useEffect(() => {
    document.title = title ? `${title} | TapTrao` : "TapTrao - Trade Compliance for Commodity Traders";

    const metaDesc = document.querySelector('meta[name="description"]');
    if (description) {
      if (metaDesc) {
        metaDesc.setAttribute("content", description);
      } else {
        const meta = document.createElement("meta");
        meta.name = "description";
        meta.content = description;
        document.head.appendChild(meta);
      }
    }
  }, [title, description]);
}
