import { gear, mainQuests, profile } from "@/content/save-file";

/**
 * Person schema, so search engines read this as a real profile rather than a
 * page that happens to mention a name.
 *
 * Rendered on both the boot screen and Resume Mode. Those are the two pages
 * anyone searching "Jayesh Chawla" can land on, and the schema is what ties
 * them to the same person, the same GitHub and the same LinkedIn. Repeating it
 * on both is correct — schema describes the entity a page is about, and both
 * pages are about the same one.
 *
 * Every field is derived from `save-file.ts`. Ending a role or adding a
 * technology updates this with no edit here.
 */
export function StructuredData() {
  const data = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: profile.name,
    jobTitle: profile.title,
    description: profile.tagline,
    email: `mailto:${profile.email}`,
    // schema.org: `url` is the person's own site; `sameAs` is where else they
    // exist. Putting the socials in `url` says the profiles *are* the site.
    url: profile.siteUrl,
    sameAs: profile.socials.filter((s) => s.href).map((s) => s.href),
    address: { "@type": "PostalAddress", addressCountry: profile.location },
    knowsAbout: gear.map((item) => item.name),
    worksFor: mainQuests
      .filter((q) => q.end === null)
      .map((q) => ({ "@type": "Organization", name: q.org })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
