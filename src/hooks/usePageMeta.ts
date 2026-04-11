import { useEffect } from "react";

interface PageMeta {
  title: string;
  description: string;
  canonical?: string;
}

const BASE_URL = "https://edzenai.com";

export function usePageMeta({ title, description, canonical }: PageMeta) {
  useEffect(() => {
    document.title = title;

    const setMeta = (name: string, content: string) => {
      let el = document.querySelector(`meta[name="${name}"]`) as HTMLMetaElement | null;
      if (!el) {
        el = document.createElement("meta");
        el.setAttribute("name", name);
        document.head.appendChild(el);
      }
      el.setAttribute("content", content);
    };

    const setOg = (property: string, content: string) => {
      let el = document.querySelector(`meta[property="${property}"]`) as HTMLMetaElement | null;
      if (!el) {
        el = document.createElement("meta");
        el.setAttribute("property", property);
        document.head.appendChild(el);
      }
      el.setAttribute("content", content);
    };

    setMeta("description", description);
    setOg("og:title", title);
    setOg("og:description", description);

    // Canonical
    const canonicalUrl = canonical ? `${BASE_URL}${canonical}` : undefined;
    if (canonicalUrl) {
      let link = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
      if (!link) {
        link = document.createElement("link");
        link.setAttribute("rel", "canonical");
        document.head.appendChild(link);
      }
      link.setAttribute("href", canonicalUrl);
    }

    return () => {
      // cleanup canonical on unmount
      const link = document.querySelector('link[rel="canonical"]');
      if (link) link.remove();
    };
  }, [title, description, canonical]);
}
