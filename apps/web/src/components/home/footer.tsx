import { buttonVariants } from "@envval/ui/components/button";
import { cn } from "@envval/ui/lib/utils";
import { Link } from "@tanstack/react-router";
import { EnvvalLogo } from "../logo/envval";

const footerLinks = {
  Product: [
    { label: "Features", href: "/#features" },
    { label: "Changelog", href: "/changelog" },
    {
      label: "Extension",
      href: "https://marketplace.visualstudio.com/items?itemName=envval.envval",
    },
  ],
  Company: [
    { label: "About", href: "/about" },
    { label: "Blog", href: "/blog" },
    { label: "Contact", href: "/contact" },
  ],
  Legal: [
    { label: "Privacy", href: "/privacy" },
    { label: "Terms", href: "/terms" },
    { label: "Security", href: "/security" },
    { label: "Cookies", href: "/cookie-policy" },
  ],
};

const blurLayers = [
  { blur: "backdrop-blur-[1px]", start: "40%" },
  { blur: "backdrop-blur-[2px]", start: "50%" },
  { blur: "backdrop-blur-xs", start: "60%" },
  { blur: "backdrop-blur-sm", start: "60%" },
  { blur: "backdrop-blur-lg", start: "70%" },
  { blur: "backdrop-blur-xl", start: "80%" },
];

const FooterImage = () => (
  <div className="relative w-36 sm:w-48 md:w-56 lg:w-64 shrink-0">
    <div className="relative aspect-square">
      <img
        src="/images/home/footer.png"
        alt=""
        className="w-full h-full object-contain pb-6"
      />
      {blurLayers.map(({ blur, start }) => (
        <div
          key={start}
          className={`absolute inset-0 ${blur}`}
          style={{
            maskImage: `linear-gradient(to bottom, transparent 0%, transparent ${start}, black 100%)`,
            WebkitMaskImage: `linear-gradient(to bottom, transparent 0%, transparent ${start}, black 100%)`,
          }}
        />
      ))}
      <div
        className="absolute inset-0 bg-linear-to-b from-transparent via-transparent to-background"
        style={{
          maskImage: "linear-gradient(to bottom, transparent 60%, black 100%)",
          WebkitMaskImage:
            "linear-gradient(to bottom, transparent 60%, black 100%)",
        }}
      />
    </div>
  </div>
);

const FooterCTA = () => (
  <section className="container max-w-7xl mx-auto px-4 sm:px-6 py-14 sm:py-20 md:py-28">
    <div className="flex flex-col items-center lg:flex-row lg:items-start gap-8 sm:gap-10 lg:gap-16">
      <FooterImage />
      <div className="flex flex-col items-center text-center lg:items-start lg:text-left flex-1">
        <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl tracking-tight leading-[1.1] mb-4 sm:mb-5 font-zodiak font-medium">
          Start securing your secrets{" "}
          <span className="text-primary">today</span>
        </h2>
        <p className="text-muted-foreground text-sm sm:text-base md:text-lg mb-6 sm:mb-8 leading-snug max-w-lg text-shadow-2xs text-shadow-muted-foreground/10">
          Securely manage all your environment variables, API keys, and configs
          in one place.
        </p>
        <Link
          to="/signup"
          className={cn(buttonVariants({ size: "lg" }), "px-8")}
        >
          Get Started Free
        </Link>
      </div>
    </div>
  </section>
);

const FooterLinks = () => (
  <div className="container max-w-7xl mx-auto px-4 sm:px-6 py-10 sm:py-12">
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-8">
      {Object.entries(footerLinks).map(([category, links]) => (
        <div key={category}>
          <h3 className="font-medium text-sm mb-3 sm:mb-4 text-foreground">
            {category}
          </h3>
          <ul className="space-y-2 sm:space-y-2.5">
            {links.map((link) => (
              <li key={link.label}>
                <Link
                  to={link.href}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  </div>
);

const FooterBottom = () => (
  <div className="container max-w-7xl mx-auto px-4 sm:px-6 py-6">
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
      <EnvvalLogo
        variant="full"
        className="h-5 w-auto text-muted-foreground/50"
      />
      <p className="text-xs text-muted-foreground/50">
        &copy; {new Date().getFullYear()} Envval. All rights reserved.
      </p>
    </div>
  </div>
);

const FooterBrand = () => (
  <div className="relative overflow-hidden">
    <div className="container max-w-7xl mx-auto px-4 sm:px-6">
      <div className="relative flex items-end justify-center h-20 sm:h-24 md:h-36 lg:h-48">
        <div
          className="absolute w-full flex justify-center"
          style={{ bottom: "-25%" }}
        >
          <EnvvalLogo
            variant="full"
            className="w-full max-w-3xl lg:max-w-5xl h-auto text-muted-foreground/6"
          />
        </div>
      </div>
    </div>
  </div>
);

const Footer = () => (
  <footer className="relative overflow-hidden border-t max-w-7xl border-border/40 mx-auto px-4 sm:px-6">
    <FooterCTA />
    <FooterLinks />
    <FooterBottom />
    <FooterBrand />
  </footer>
);

export const FooterWithoutCTA = () => (
  <footer className="relative overflow-hidden border-t max-w-7xl border-border/40 mx-auto px-4 sm:px-6">
    <FooterLinks />
    <FooterBottom />
    <FooterBrand />
  </footer>
);

export default Footer;
