import { Link } from "@tanstack/react-router";
import { Logo } from "./Logo";
import { TikTokIcon, WhatsAppIcon } from "./icons";
import { whatsappUrl } from "@/lib/whatsapp";

const TIKTOK_URL = "https://www.tiktok.com/@kidamerch";

const socialCls =
  "grid h-12 w-12 place-items-center rounded-full border border-border transition-colors duration-200 hover:bg-secondary hover:text-primary";

export function Footer() {
  return (
    <footer className="mt-24 border-t border-border">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="grid gap-12 py-16 md:grid-cols-[1.6fr_1fr_1fr]">
          <div>
            <Logo className="h-20 w-auto" />
            <p className="mt-6 max-w-xs text-sm leading-relaxed text-muted-foreground">
              KIDA lets anime fans carry the worlds they love into the real world.
            </p>
            <div className="mt-7 flex gap-2.5">
              <a
                href={TIKTOK_URL}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="KIDA on TikTok"
                className={socialCls}
              >
                <TikTokIcon size={17} />
              </a>
              <a
                href={whatsappUrl("Hi KIDA! I have a question.")}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Message KIDA on WhatsApp"
                className={socialCls}
              >
                <WhatsAppIcon size={17} />
              </a>
            </div>
          </div>

          <FooterCol
            title="Shop"
            links={[
              { label: "All items", to: "/shop" },
              { label: "Wishlist", to: "/wishlist" },
              { label: "Cart", to: "/cart" },
            ]}
          />
          <FooterCol
            title="Legal"
            links={[
              { label: "Returns", to: "/returns" },
              { label: "Terms", to: "/terms" },
            ]}
          />
        </div>

        <div className="flex flex-col gap-2 border-t border-border py-8 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} KIDA. All rights reserved.</p>
          <p>All artwork original. No franchise properties.</p>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({ title, links }: { title: string; links: { label: string; to: string }[] }) {
  return (
    <div>
      <p className="eyebrow text-[10px] text-muted-foreground">{title}</p>
      <ul className="mt-4 space-y-3 text-sm">
        {links.map((l) => (
          <li key={l.label}>
            <Link
              to={l.to as never}
              className="text-foreground/80 transition-colors duration-150 hover:text-primary"
            >
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
