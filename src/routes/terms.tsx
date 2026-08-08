import { createFileRoute } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import { WhatsAppIcon } from "@/components/icons";
import { openWhatsApp, WHATSAPP_DISPLAY } from "@/lib/whatsapp";
import { LegalPage, LegalSection } from "@/components/LegalPage";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Terms of Service — KIDA" },
      {
        name: "description",
        content:
          "The terms governing your use of the KIDA website, orders, intellectual property and liability.",
      },
    ],
  }),
  component: Terms,
});

function Terms() {
  return (
    <LegalPage
      eyebrow="Legal"
      title="Terms of service"
      intro='Please read these Terms of Service ("Terms") carefully before using the KIDA website (the "Service") operated by KIDA ("us," "we," or "our"). By accessing or using the Service, you agree to be bound by these Terms. If you disagree with any part of the Terms, you may not access the Service.'
      updated="Last updated 8 August 2026"
    >
      <LegalSection n="01" title="Intellectual property & third-party affiliation">
        <p className="font-semibold text-foreground">A. Ownership of KIDA designs</p>
        <p>
          All original content, designs, features, and functionality — including text, graphics,
          logos, and product photographs — are and will remain the exclusive property of KIDA.
        </p>

        <p className="pt-2 font-semibold text-foreground">B. Lack of affiliation and endorsement</p>
        <p>
          KIDA is an independent retailer of statement jewellery, headwear, and accessories. KIDA is
          not affiliated with, authorised by, endorsed by, or sponsored by any anime studio,
          publisher, production committee, licensing body, game developer, major apparel brand, or
          any celebrity or public figure.
        </p>
        <p>
          Any product names, motifs, or designs sold on this site that may resemble or reference
          existing series, characters, brands, or protected entities are used solely for the purpose
          of fashion and aesthetic expression. We make no claim to the intellectual property of
          others. By purchasing items from KIDA, you acknowledge and accept this disclaimer of
          affiliation.
        </p>

        <p className="pt-2 font-semibold text-foreground">
          C. Limitation of liability for IP claims
        </p>
        <p>
          KIDA is not responsible for any legal claims arising from a customer's misuse or secondary
          sale of products that may violate the intellectual property rights of third parties. You
          agree to use the products in compliance with all applicable laws.
        </p>
      </LegalSection>

      <LegalSection n="02" title="Purchases & order acceptance">
        <p className="font-semibold text-foreground">A. Product availability and pricing</p>
        <p>
          All products are subject to availability. Prices are quoted in Nigerian Naira (₦) and are
          subject to change without notice. We reserve the right to discontinue any product at any
          time.
        </p>

        <p className="pt-2 font-semibold text-foreground">B. Order acceptance</p>
        <p>
          We reserve the right to refuse any order you place with us. We may, at our sole
          discretion, limit or cancel quantities purchased per person, per household, or per order.
          If we change or cancel an order, we will contact you on the WhatsApp number used to place
          it.
        </p>

        <p className="pt-2 font-semibold text-foreground">C. Accuracy of order information</p>
        <p>
          Orders are confirmed over WhatsApp. You agree to provide current, complete, and accurate
          delivery and contact information for all purchases made via the Service.
        </p>
      </LegalSection>

      <LegalSection n="03" title="Delivery & returns">
        <p>
          Delivery cost and timing are quoted per order on WhatsApp, since they depend on your
          location. All details regarding order processing and the return or exchange process are
          governed by our{" "}
          <Link to="/returns" className="text-primary underline underline-offset-4">
            Returns &amp; Refunds policy
          </Link>
          . By making a purchase, you agree to abide by that policy.
        </p>
      </LegalSection>

      <LegalSection n="04" title="User conduct">
        <p>
          You agree not to use the Service for any unlawful purpose, or to solicit others to perform
          or participate in any unlawful acts. You are responsible for ensuring your use of the
          Service complies with the laws and regulations in your area.
        </p>
      </LegalSection>

      <LegalSection n="05" title="Limitation of liability">
        <p>
          In no case shall KIDA, our directors, officers, employees, affiliates, agents,
          contractors, interns, suppliers, service providers, or licensors be liable for any injury,
          loss, claim, or any direct, indirect, incidental, punitive, special, or consequential
          damages of any kind — including, without limitation, lost profits, lost revenue, lost
          savings, loss of data, replacement costs, or any similar damages, whether based in
          contract, tort (including negligence), strict liability or otherwise — arising from your
          use of the Service or any products procured using the Service.
        </p>
      </LegalSection>

      <LegalSection n="06" title="Governing law">
        <p>
          These Terms shall be governed and construed in accordance with the laws of the Federal
          Republic of Nigeria, without regard to its conflict of law provisions.
        </p>
      </LegalSection>

      <LegalSection n="07" title="Changes to these terms">
        <p>
          We reserve the right, at our sole discretion, to update, change, or replace any part of
          these Terms by posting updates to this page. It is your responsibility to check this page
          periodically for changes. Your continued use of the Service following the posting of any
          changes constitutes acceptance of those changes.
        </p>
      </LegalSection>

      <LegalSection n="08" title="Contact">
        <p>
          Questions about these Terms should be sent to us on WhatsApp at{" "}
          <strong className="whitespace-nowrap">{WHATSAPP_DISPLAY}</strong>.
        </p>
        <button
          type="button"
          onClick={() => openWhatsApp("Hi KIDA — I have a question about your Terms of Service.")}
          className="eyebrow mt-6 inline-flex h-14 items-center gap-2 rounded-sm bg-primary px-7 text-primary-foreground transition-opacity duration-200 hover:opacity-90"
        >
          <WhatsAppIcon size={16} /> Message us
        </button>
      </LegalSection>
    </LegalPage>
  );
}
