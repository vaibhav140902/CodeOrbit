type JsonLdNode = Record<string, unknown>;

const normalizeJsonLd = (data: JsonLdNode | JsonLdNode[]): JsonLdNode[] =>
  (Array.isArray(data) ? data : [data]).map((entry) => ({
    "@context": "https://schema.org",
    ...entry,
  }));

export function StructuredData({ data }: { data: JsonLdNode | JsonLdNode[] }) {
  return (
    <>
      {normalizeJsonLd(data).map((entry, index) => (
        <script
          key={`${String(entry["@type"] ?? "jsonld")}-${index}`}
          type="application/ld+json"
          suppressHydrationWarning={true}
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(entry),
          }}
        />
      ))}
    </>
  );
}
