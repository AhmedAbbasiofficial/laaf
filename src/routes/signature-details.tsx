import { createFileRoute, Link } from "@tanstack/react-router";
import { Shell } from "@/components/site/Section";
import detailFloral from "@/assets/detail-floral.jpg";
import detailBronze from "@/assets/detail-bronze.jpg";

export const Route = createFileRoute('/signature-details')({
  head: () => ({
    meta: [
      { title: "Signature Details — LAAF" },
      { name: "description", content: "A close study of the embroidery and detailing that define the collection." },
    ],
  }),
  component: SignatureDetails,
});

function SignatureDetails() {
  return (
    <Shell className="py-20 md:py-28">
      <div className="max-w-4xl">
        <p className="eyebrow text-muted-foreground">Signature Details</p>
        <h1 className="pt-4 font-serif text-3xl">Look closely at the thread</h1>
        <p className="pt-4 text-sm text-muted-foreground max-w-prose">The collection is defined by placement and restraint. Each embroidered motif is considered in scale and position so the silhouette reads as a single, composed object.</p>

        <div className="mt-10 grid gap-8 md:grid-cols-2">
          <figure>
            <img src={detailFloral} alt="Macro detail of pale pink floral embroidery" width={1200} height={1200} className="w-full object-cover rounded-sm" loading="lazy" decoding="async" />
            <figcaption className="pt-3 text-sm text-muted-foreground">Floral embroidery — placement on front panels</figcaption>
          </figure>
          <figure>
            <img src={detailBronze} alt="Close-up of bronze botanical embroidery" width={1200} height={1200} className="w-full object-cover rounded-sm" loading="lazy" decoding="async" />
            <figcaption className="pt-3 text-sm text-muted-foreground">Bronze botanical — sleeve emphasis</figcaption>
          </figure>
        </div>

        <div className="mt-12">
          <h2 className="font-serif text-xl">Materials & technique</h2>
          <p className="pt-4 text-sm text-muted-foreground">Detailed craft notes will be published by the atelier; this page collects the visual study of placement, scale and thread selection so that the atelier’s language can be clearly conveyed to clients and press.</p>
        </div>

        <div className="mt-12">
          <a href="/collection" className="eyebrow inline-block border-b border-foreground pb-1">Back to collection</a>
        </div>
      </div>
    </Shell>
  );
}

export default SignatureDetails;
