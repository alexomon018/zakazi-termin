import { Quote } from "lucide-react";

interface Testimonial {
  id: string;
  quote: string;
  name: string;
  salon: string;
  city: string;
}

const defaultTestimonials: Testimonial[] = [
  {
    id: "testimonial-1",
    quote:
      "Od kad koristim Salonko, imam 30% više termina mesečno. Klijentkinje same zakazuju i ja ne propuštam nijedan termin.",
    name: "Jelena M.",
    salon: "Nail Studio JM",
    city: "Beograd",
  },
  {
    id: "testimonial-2",
    quote:
      "Ranije sam gubila po sat vremena dnevno na odgovaranje na poruke. Sada klijenti zakazuju sami, a ja se fokusiram na rad.",
    name: "Milica S.",
    salon: "Beauty Corner",
    city: "Novi Sad",
  },
  {
    id: "testimonial-3",
    quote:
      "Podešavanje je trajalo bukvalno 5 minuta. Podelila sam link na Instagram i termini su počeli da se pune istog dana.",
    name: "Ana T.",
    salon: "Nails by Ana",
    city: "Niš",
  },
];

interface TestimonialsSectionProps {
  title?: string;
  subtitle?: string;
  testimonials?: Testimonial[];
}

export function TestimonialsSection({
  title = "Šta kažu vlasnice salona",
  subtitle = "Pridružite se stotinama zadovoljnih vlasnica salona širom Srbije.",
  testimonials = defaultTestimonials,
}: TestimonialsSectionProps) {
  return (
    <section className="py-20 bg-white dark:bg-background lg:py-28">
      <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
        {/* Header */}
        <div className="max-w-2xl mx-auto text-center">
          <p className="text-xs font-semibold tracking-widest uppercase text-primary">Utisci</p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            {title}
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">{subtitle}</p>
        </div>

        {/* Testimonials Grid */}
        <div className="grid gap-8 mt-16 md:grid-cols-3">
          {testimonials.map((testimonial) => (
            <div
              key={testimonial.id}
              className="relative p-6 rounded-2xl bg-gray-50 dark:bg-muted/30"
            >
              <Quote className="w-8 h-8 mb-4 text-primary/30" aria-hidden="true" />
              <blockquote className="text-foreground leading-relaxed">
                &ldquo;{testimonial.quote}&rdquo;
              </blockquote>
              <div className="mt-6 pt-4 border-t border-gray-200 dark:border-border">
                <p className="font-semibold text-foreground">{testimonial.name}</p>
                <p className="text-sm text-muted-foreground">
                  {testimonial.salon}, {testimonial.city}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
