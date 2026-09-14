import { createFileRoute, Link } from "@tanstack/react-router";
import { Shell } from "@/components/site/Section";
import story from "@/assets/story.jpg";

export const Route = createFileRoute('/about')({
  head: () => ({
    meta: [
      { title: "About LAAF — Premium Modern Modest Fashion" },
      { name: "description", content: "Discover LAAF's approach to contemporary luxury modest fashion, premium quality, and timeless design." },
    ],
  }),
  component: About,
});

function About() {
  return (
    <div className="bg-white">
      {/* Page header */}
      <div className="border-b border-border py-8 md:py-12">
        <Shell>
          <nav className="text-[0.65rem] text-muted-foreground mb-3 uppercase tracking-wider">
            <a href="/" className="hover:text-foreground transition-colors">Home</a>
            <span className="mx-2">/</span>
            <span className="text-foreground">About Us</span>
          </nav>
          <h1 className="font-serif text-[2rem] md:text-[2.8rem] font-normal text-foreground">
            About LAAF
          </h1>
        </Shell>
      </div>

      <Shell className="py-12 md:py-16">
        <div className="grid gap-12 lg:grid-cols-[1fr_1fr] lg:gap-16 items-center">
          <div>
            <span className="text-[0.65rem] font-semibold uppercase tracking-[0.15em] text-accent">Our Story</span>
            <h2 className="mt-2 font-serif text-[1.8rem] font-normal text-foreground">
              Premium modern modest fashion
            </h2>
            <div className="mt-5 space-y-4 text-[0.88rem] leading-relaxed text-muted-foreground max-w-prose">
              <p>
                LAAF is dedicated to creating elevated modest fashion for the contemporary woman. Each collection celebrates the beauty of refined design, premium materials, and timeless elegance.
              </p>
              <p className="border-l-2 border-accent pl-5 text-foreground/70">
                We believe that modest fashion should be luxurious, well-designed, and inspiring. Our collections reflect that commitment to excellence in every stitch.
              </p>
              <p>
                Founded in Pakistan, LAAF draws inspiration from rich cultural heritage while embracing modern aesthetics. Our abayas and hijabs are crafted for women who demand both style and substance.
              </p>
            </div>

            <div className="mt-8 flex flex-wrap gap-4">
              <a
                href="/collection"
                className="inline-flex items-center justify-center bg-accent px-7 py-3 text-[0.72rem] font-semibold uppercase tracking-wide text-white hover:bg-accent/90 transition-colors"
              >
                Shop Collection
              </a>
              <a
                href="/contact"
                className="inline-flex items-center justify-center border border-foreground px-7 py-3 text-[0.72rem] font-semibold uppercase tracking-wide text-foreground hover:bg-muted transition-colors"
              >
                Contact Us
              </a>
            </div>
          </div>

          <div>
            <img
              src={story}
              alt="LAAF luxury modest fashion"
              width={1200}
              height={1504}
              loading="lazy"
              decoding="async"
              className="w-full object-cover"
            />
          </div>
        </div>

        {/* Values */}
        <div className="mt-16 md:mt-20 grid gap-6 sm:grid-cols-3">
          {[
            { title: "Premium Quality", body: "Every piece is crafted from carefully selected fabrics that feel luxurious and last the test of time." },
            { title: "Modern Design", body: "Contemporary silhouettes that honour modesty while embracing the demands of modern life." },
            { title: "Pakistani Heritage", body: "Rooted in Pakistan's rich textile tradition, reimagined for the global modern woman." },
          ].map(({ title, body }) => (
            <div key={title} className="border border-border p-6">
              <h3 className="font-serif text-lg font-normal text-foreground">{title}</h3>
              <p className="mt-3 text-[0.82rem] leading-relaxed text-muted-foreground">{body}</p>
            </div>
          ))}
        </div>
      </Shell>
    </div>
  );
}


export default About;
