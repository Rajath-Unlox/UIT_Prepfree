import { ResumeTemplate, TemplateComponents } from "@/hooks/useTemplates";

/**
 * Fills a template string's ${placeholder} slots with actual values.
 * Returns empty string if the template itself is missing/undefined.
 */
function fill(tpl: any, values: Record<string, string>): string {
    if (!tpl || typeof tpl !== "string") return "";
    return tpl.replace(/\$\{(\w+)\}/g, (_: any, key: any) =>
        key in values ? values[key] : ""
    );
}

/** Safely retrieve a component snippet, returning empty string if missing */
function comp(components: Record<string, string> | undefined, key: string): string {
    if (!components) return "";
    // Robust fallbacks for common keys
    const fallbacks: Record<string, string[]> = {
        "skill_item": ["technical_skill_item", "skill", "item", "skill_items"],
        "language_item": ["language", "item", "language_items"],
        "education_item": ["education"],
        "experience_item": ["experience"],
        "project_item": ["project"]
    };

    if (key in fallbacks && !components[key]) {
        for (const fb of fallbacks[key]) {
            if (components[fb]) return components[fb];
        }
    }
    return components[key] ?? "";
}

/** Formats a date string (ISO or otherwise) into a readable "MMM YYYY" format */
function formatDate(date: string | null | undefined): string {
    if (!date || date === "Present") return date ?? "";
    try {
        const d = new Date(date);
        if (isNaN(d.getTime())) return date; // Fallback to original
        return d.toLocaleDateString("en-US", { month: "short", year: "numeric" });
    } catch {
        return date;
    }
}

/**
 * Maps the resume form data + a chosen color into the server-provided
 * HTML template string, returning a complete standalone HTML document.
 */
export function buildResumeHtml(
    templateObj: ResumeTemplate,
    resumeData: any,
    colorHex: string
): string {
    if (!templateObj?.template) return "";
    let html = templateObj.template;
    const c = (templateObj.template_components ?? {}) as Record<string, string>;

    /* ---- 1. Basic Info (Flat vs Nested Fallback) ---- */
    // The application state (FormData) is flat, but backend might return nested profileInfo.
    // We prioritize the flat structure used by the front-end state.
    const p = resumeData?.profileInfo ?? {};
    const firstname = resumeData.firstname || p.firstname || "";
    const lastname = resumeData.lastname || p.lastname || "";
    const summary = resumeData.description || p.description || p.summary || "";
    const title = resumeData.profileHeadline || p.profileHeadline || "";

    /* ---- 2. Header & Photo ---- */
    const photoUrl = resumeData.profileImageUrl || p.profileImageUrl || "";
    const photo = photoUrl
        ? fill(comp(c, "photo_with_image"), { photoUrl })
        : comp(c, "photo_placeholder");

    /* ---- 3. Contact Info ---- */
    const contactInfo = resumeData?.contactInfo ?? {};
    const email = resumeData.email || contactInfo.email || "";
    const phone = resumeData.phone_number
        ? `${resumeData.country_code ?? ""}${resumeData.phone_number}`
        : `${contactInfo.country_code ?? ""}${contactInfo.phone_number ?? ""}`;
    const linkedin = resumeData.linkedin || contactInfo.linkedin || "";
    const github = resumeData.github || contactInfo.github || "";
    const twitter = resumeData.twitter || contactInfo.twitter || "";
    const portfolio = resumeData.portfolio || contactInfo.portfolio || "";
    const location = resumeData.currentLocation || p.currentLocation || "";

    const contactLines: Array<[string, string]> = [
        ["Email", email],
        ["Phone", phone],
        ["LinkedIn", linkedin],
        ["GitHub", github],
        ["Twitter", twitter],
        ["Portfolio", portfolio],
    ];
    const contact_items = contactLines
        .filter(([, v]) => v)
        .map(([label, value]) => fill(comp(c, "contact_item"), { label, value }))
        .join("\n");

    const contact_line = [
        email,
        phone,
        location,
        linkedin,
        github,
        twitter,
        portfolio
    ].filter(Boolean).join(" | ");

    /* ---- 4. Education ---- */
    const educationItemsHtml = (resumeData?.education ?? [])
        .map((edu: any) =>
            fill(comp(c, "education_item"), {
                institution: edu.institution ?? "",
                degree: edu.degree ? `${edu.degree}` : "",
                field: edu.fieldOfStudy ? ` in ${edu.fieldOfStudy}` : "",
                startDate: formatDate(edu.startDate),
                endDate: formatDate(edu.endDate),
                location: edu.location ?? "",
                description: edu.description ?? "",
            })
        )
        .join("\n");

    const education_section = fill(comp(c, "education_section"), {
        education_items: educationItemsHtml,
        theme: colorHex
    }) || educationItemsHtml;

    /* ---- 5. Experience ---- */
    const experienceItemsHtml = (resumeData?.experience ?? [])
        .map((exp: any) =>
            fill(comp(c, "experience_item"), {
                title: exp.title ?? "",
                company: exp.company ?? "",
                startDate: formatDate(exp.startDate),
                endDate: exp.currentlyWorkHere ? "Present" : formatDate(exp.endDate),
                jobType: exp.jobType ?? "",
                location: exp.location ?? "",
                description: exp.description ?? "",
            })
        )
        .join("\n");

    const experience_section = fill(comp(c, "experience_section"), {
        experience_items: experienceItemsHtml,
        theme: colorHex
    }) || experienceItemsHtml;

    /* ---- 6. Skills & Languages ---- */
    const fillItem = (tpl: string, name: string) => fill(tpl, {
        skill: name, name, skill_name: name, language: name, language_name: name,
        item: name, value: name, content: name
    });

    const tech_skills_items = (resumeData?.technicalSkills ?? [])
        .map((s: any) => fillItem(comp(c, "skill_item"), s.name ?? ""))
        .join("\n");
    const soft_skills_items = (resumeData?.softSkills ?? [])
        .map((s: any) => fillItem(comp(c, "skill_item"), s.name ?? ""))
        .join("\n");
    const skill_items = tech_skills_items + "\n" + soft_skills_items;

    const technical_skills = (resumeData?.technicalSkills ?? [])
        .map((s: any) => s.name ?? "").filter(Boolean).join(", ");
    const soft_skills = (resumeData?.softSkills ?? [])
        .map((s: any) => s.name ?? "").filter(Boolean).join(", ");
    const skills = [technical_skills, soft_skills].filter(Boolean).join(", ");

    const language_items = (resumeData?.languages ?? [])
        .map((l: any) => fillItem(comp(c, "language_item"), l.name ?? ""))
        .join("\n");
    const languages = (resumeData?.languages ?? [])
        .map((l: any) => l.name ?? "").filter(Boolean).join(", ");

    /* ---- 7. Projects ---- */
    const projectItemsHtml = (resumeData?.projects ?? [])
        .map((proj: any) => {
            const tplKey = proj.link ? "project_item" : "project_item_no_link";
            return fill(comp(c, tplKey), {
                title: proj.title ?? "",
                role: proj.role ?? "",
                type: proj.projectType ?? "",
                technologies: proj.technologies ?? "",
                description: proj.description ?? "",
                link: proj.link ?? "",
            });
        })
        .join("\n");

    const projects_section = fill(comp(c, "projects_section"), {
        project_items: projectItemsHtml,
        theme: colorHex
    }) || projectItemsHtml;

    /* ---- 8. Certifications ---- */
    const certification_items = (resumeData?.certifications ?? [])
        .map((cert: any) => {
            const tplKey = cert.credentialUrl ? "certification_item" : "certification_item_no_url";
            return fill(comp(c, tplKey), {
                title: cert.title ?? "",
                issuer: cert.issuer ?? "",
                issueDate: formatDate(cert.issueDate),
                expiryDate: formatDate(cert.expiryDate),
                description: cert.description ?? "",
                url: cert.credentialUrl ?? "",
            });
        })
        .join("\n");

    /* ---- 9. Additional fields ---- */
    const additional_fields = (resumeData?.additionalFields ?? [])
        .map((field: any) => {
            const items = (field.items ?? []).join(", ");
            return `
        <div class="mt-6">
          <h2 class="text-sm font-semibold uppercase border-b pb-1" style="color:${colorHex};">${field.title}</h2>
          <p class="text-sm mt-1 text-justify tracking-tight leading-relaxed">${items}</p>
        </div>`;
        })
        .join("\n");

    /* ---- 10. Final Rendering ---- */
    return fill(html, {
        theme: colorHex,
        photo,
        contact_items,
        contact_line,
        education_items: educationItemsHtml,
        education_section,
        language_items,
        languages,
        languages_section: language_items,
        skill_items,
        skills,
        skills_section: skill_items,
        technical_skills,
        technical_skills_section: technical_skills,
        soft_skills,
        soft_skills_section: soft_skills,
        experience_items: experienceItemsHtml,
        experience_section,
        project_items: projectItemsHtml,
        projects_section,
        certification_items,
        firstname,
        lastname,
        summary,
        title,
        additional_fields,
    });
}
