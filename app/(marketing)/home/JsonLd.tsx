export function JsonLd() {
  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "LocalBusiness",
        "@id": "https://www.genxdigitizing.com/#business",
        name: "GenX Digitizing",
        description:
          "Commercial embroidery digitizing services — production-ready DST/PES files with surgical precision, 24-hour turnaround, and zero thread breaks guarantee.",
        url: "https://www.genxdigitizing.com",
        telephone: "+1-234-567-8900",
        email: "support@genxdigitizing.com",
        image: "https://www.genxdigitizing.com/images/black_logo.png",
        address: {
          "@type": "PostalAddress",
          addressCountry: "US",
        },
        openingHoursSpecification: {
          "@type": "OpeningHoursSpecification",
          dayOfWeek: [
            "Monday", "Tuesday", "Wednesday", "Thursday",
            "Friday", "Saturday", "Sunday",
          ],
          opens: "00:00",
          closes: "23:59",
        },
        aggregateRating: {
          "@type": "AggregateRating",
          ratingValue: "4.9",
          reviewCount: "500",
          bestRating: "5",
        },
        priceRange: "$7 - $30",
      },
      {
        "@type": "Service",
        "@id": "https://www.genxdigitizing.com/#digitizing",
        name: "Commercial Embroidery Digitizing Services",
        description:
          "Production-grade embroidery digitizing for caps, jackets, left chest logos, 3D puff, and large-format designs. Machine-tested DST, PES, EMB, JEF files with optimized stitch paths and balanced density.",
        provider: { "@id": "https://www.genxdigitizing.com/#business" },
        serviceType: "Embroidery Digitizing",
        areaServed: { "@type": "Country", name: "Worldwide" },
        offers: {
          "@type": "AggregateOffer",
          priceCurrency: "USD",
          lowPrice: "7",
          highPrice: "25",
          offerCount: "3",
          offers: [
            {
              "@type": "Offer",
              name: "Standard Design (4″–8″)",
              price: "7.00",
              priceCurrency: "USD",
              sku: "DIG-STD",
            },
            {
              "@type": "Offer",
              name: "Large Design (8″–12″)",
              price: "18.00",
              priceCurrency: "USD",
              sku: "DIG-LRG",
            },
            {
              "@type": "Offer",
              name: "Jumbo / Full Back (12″+)",
              price: "25.00",
              priceCurrency: "USD",
              sku: "DIG-JMB",
            },
          ],
        },
        hasOfferCatalog: {
          "@type": "OfferCatalog",
          name: "Embroidery Digitizing Services",
          itemListElement: [
            {
              "@type": "Offer",
              itemOffered: {
                "@type": "Service",
                name: "Cap Digitizing",
                description: "Structural underlay, curve compensation for structured and unstructured caps",
              },
            },
            {
              "@type": "Offer",
              itemOffered: {
                "@type": "Service",
                name: "3D Puff Digitizing",
                description: "Correct foam margin, density, and underlay for clean 3D puff embroidery",
              },
            },
            {
              "@type": "Offer",
              itemOffered: {
                "@type": "Service",
                name: "Jacket Back Digitizing",
                description: "Large-format satin stitch with clean registration on 34K+ stitch designs",
              },
            },
            {
              "@type": "Offer",
              itemOffered: {
                "@type": "Service",
                name: "Left Chest Logo Digitizing",
                description: "Small-text optimization at 2″–4″ for corporate apparel and polos",
              },
            },
          ],
        },
      },
      {
        "@type": "Service",
        "@id": "https://www.genxdigitizing.com/#vector",
        name: "Vector Art Conversion Services",
        description:
          "Manual redraw of low-res JPGs, hand sketches, and old artwork into clean, production-ready vector files (AI, SVG, EPS, PDF, CDR) for screen printing, DTF, and large-format production.",
        provider: { "@id": "https://www.genxdigitizing.com/#business" },
        serviceType: "Vector Art Conversion",
        areaServed: { "@type": "Country", name: "Worldwide" },
        offers: {
          "@type": "AggregateOffer",
          priceCurrency: "USD",
          lowPrice: "8",
          highPrice: "30",
          offerCount: "3",
        },
      },
      {
        "@type": "Service",
        "@id": "https://www.genxdigitizing.com/#patches",
        name: "Custom Patch Digitizing Services",
        description:
          "Production-run embroidered, woven, PVC, and leather patches. Precision thread color matching, iron-on/sew-on/Velcro backing, bulk pricing at 500+ units.",
        provider: { "@id": "https://www.genxdigitizing.com/#business" },
        serviceType: "Custom Patch Production",
        areaServed: { "@type": "Country", name: "Worldwide" },
        offers: {
          "@type": "AggregateOffer",
          priceCurrency: "USD",
          lowPrice: "5",
          highPrice: "15",
          offerCount: "3",
        },
      },
      {
        "@type": "FAQPage",
        mainEntity: [
          {
            "@type": "Question",
            name: "What file formats do you deliver for embroidery digitizing?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "We deliver DST, PES, EMB, JEF, XXX, VIP, HUS, and EXP formats — covering every major commercial embroidery machine brand. Additional formats are always included free of charge.",
            },
          },
          {
            "@type": "Question",
            name: "How long does commercial embroidery digitizing take?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Standard turnaround is 12 hours. Rush delivery is 6 hours. Urgent delivery is 3 hours. Large designs exceeding 25,000 stitches may require the full 12 hours for proper underlay and stitch path optimization.",
            },
          },
          {
            "@type": "Question",
            name: "Do you offer free revisions on digitizing?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Yes — we provide unlimited free revisions on all digitizing orders. We optimize until the file runs clean on your specific embroidery machine.",
            },
          },
          {
            "@type": "Question",
            name: "Are your embroidery files machine-tested before delivery?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Yes. Every digitized file is verified for stitch density, underlay correctness, and trim logic before delivery. Test sew-outs are run on Brother PR1050X and Tajima TFMX-IIC commercial embroidery machines.",
            },
          },
          {
            "@type": "Question",
            name: "How does payment work for embroidery digitizing services?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Review your digitizing proof first — pay only when satisfied with the production file. Secure payment is processed via Payoneer. No upfront payment required.",
            },
          },
        ],
      },
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
