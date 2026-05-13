import { useEffect, useState } from "react";
import api from "@/lib/api";

export interface TemplateComponents {
  photo_with_image: string;
  photo_placeholder: string;
  contact_item: string;
  education_item: string;
  language_item: string;
  skill_item: string;
  experience_item: string;
  project_item: string;
  project_item_no_link: string;
  certification_item: string;
  certification_item_no_url: string;
  [key: string]: string;
}

export interface ResumeTemplate {
  _id: string;
  templateId: string;
  name: string;
  thumbnail: string | null;
  template: string;
  template_components: TemplateComponents;
  colorOptions: string[];
}

let cachedTemplates: ResumeTemplate[] | null = null;

export function useTemplates() {
  const [templates, setTemplates] = useState<ResumeTemplate[]>(
    cachedTemplates ?? []
  );
  const [loading, setLoading] = useState(!cachedTemplates);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (cachedTemplates) return;

    let cancelled = false;
    setLoading(true);

    api
      .get<{ templates: ResumeTemplate[] }>("/resume/templates")
      .then((res) => {
        if (cancelled) return;
        cachedTemplates = res.data.templates;
        setTemplates(res.data.templates);
      })
      .catch((err) => {
        if (cancelled) return;
        console.error("Failed to fetch templates:", err);
        setError("Failed to load templates");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return { templates, loading, error };
}
