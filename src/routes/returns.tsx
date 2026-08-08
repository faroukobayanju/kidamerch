import { createFileRoute } from "@tanstack/react-router";
import { WhatsAppIcon } from "@/components/icons";
import { openWhatsApp, WHATSAPP_DISPLAY } from "@/lib/whatsapp";
import { LegalPage, LegalSection } from "@/components/LegalPage";

export const Route = createFileRoute("/returns")({
  head: () => ({
    meta: [
      { title: "Returns & Refunds — KIDA" },
      {
        name: "description",
        content:
          "KIDA returns and refund policy: eligibility, timelines, exchanges and how to start a return over WhatsApp.",
      },
    ],
  }),
  component: Returns,
});

function Returns() {
  return (
    <LegalPage
      eyebrow="Policy"
      title="Returns & refunds"
      intro="We want every piece to land right. If something arrives wrong, damaged, or simply is not what you hoped for, here is exactly how we handle it."
      updated="Last updated 8 August 2026"
    >
      <LegalSection n="01" title="Return window">
        <p>
          You have <strong>7 days from delivery</strong> to request a return. Reach out on WhatsApp
          within that window and we will walk you through it. Requests made after 7 days can still
          be reviewed, but we cannot guarantee a refund.
        </p>
      </LegalSection>

      <LegalSection n="02" title="Condition of items">
        <p>
          Pieces must come back unworn, undamaged, and in their original packaging with any tags or
          pouches still attached. Jewellery that shows wear, scratching, tarnish from contact with
          perfume or water, or resizing cannot be accepted.
        </p>
      </LegalSection>

      <LegalSection n="03" title="Damaged or wrong items">
        <p>
          If your order arrives faulty, damaged in transit, or is simply not what you ordered, send
          us photos on WhatsApp within <strong>48 hours of delivery</strong>. We cover the return
          cost on our side and will replace the piece or refund you in full — your choice.
        </p>
      </LegalSection>

      <LegalSection n="04" title="Non-returnable items">
        <p>Some things we cannot take back, for hygiene and custom-work reasons:</p>
        <ul>
          <li>Earrings, once the seal or hygiene packaging is opened</li>
          <li>Custom, engraved, or made-to-order pieces</li>
          <li>Items marked <em>Final sale</em> or bought during a clearance drop</li>
          <li>Gift cards</li>
        </ul>
      </LegalSection>

      <LegalSection n="05" title="Exchanges">
        <p>
          Want a different size, colour, or a different piece entirely? Exchanges are the fastest
          route. Message us and we will hold the replacement for you while your original piece is on
          its way back. If the new piece costs more, you pay the difference; if it costs less, we
          refund the balance.
        </p>
      </LegalSection>

      <LegalSection n="06" title="Refund processing">
        <p>
          Once we receive and inspect your return, we will confirm on WhatsApp and process the
          refund to your original payment method within <strong>5 to 10 business days</strong>. Bank
          processing times sit outside our control and may add a few days.
        </p>
        <p>
          Return shipping is covered by you unless the item was faulty, damaged, or incorrect — in
          which case it is on us. Original delivery fees are non-refundable.
        </p>
      </LegalSection>

      <LegalSection n="07" title="How to start a return">
        <p>
          Everything runs through WhatsApp. Message us on{" "}
          <strong className="whitespace-nowrap">{WHATSAPP_DISPLAY}</strong> with your order number,
          the piece you are returning, and a short note on why. We will reply with the return
          address and next steps.
        </p>
        <button
          type="button"
          onClick={() =>
            openWhatsApp(
              "Hi KIDA — I'd like to start a return.\n\nOrder number:\nItem:\nReason:",
            )
          }
          className="eyebrow mt-6 inline-flex h-14 items-center gap-2 rounded-sm bg-primary px-7 text-primary-foreground transition-opacity duration-200 hover:opacity-90"
        >
          <WhatsAppIcon size={16} /> Start a return on WhatsApp
        </button>
      </LegalSection>
    </LegalPage>
  );
}
