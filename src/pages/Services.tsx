import { Navbar } from "@/components/Navbar";
import { Helmet } from "react-helmet";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Gift, Building2, Package, ShoppingBag, Palette, Landmark, Calendar, MessageSquare } from "lucide-react";
import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const serviceRequestSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100, "Name must be less than 100 characters"),
  email: z.string().trim().email("Invalid email address").max(255, "Email must be less than 255 characters"),
  serviceType: z.string().trim().min(1, "Service type is required").max(100, "Service type must be less than 100 characters"),
  message: z.string().trim().min(1, "Message is required").max(2000, "Message must be less than 2000 characters"),
});

type ServiceRequestFormData = z.infer<typeof serviceRequestSchema>;

const Services = () => {
  const form = useForm<ServiceRequestFormData>({
    resolver: zodResolver(serviceRequestSchema),
    defaultValues: {
      name: "",
      email: "",
      serviceType: "",
      message: "",
    },
  });

  const onSubmit = async (data: ServiceRequestFormData) => {
    const { error } = await supabase.from("service_requests").insert({
      name: data.name,
      email: data.email,
      service_type: data.serviceType,
      message: data.message,
    });

    if (error) {
      toast.error("We could not submit your request. Please try again.");
      return;
    }

    toast.success("Service request submitted successfully! We'll contact you soon.");
    form.reset();
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Helmet>
        <title>Bespoke Egyptian Heritage Services & Custom Crafts | Tumāninah Veritas</title>
        <meta name="description" content="Order custom Egyptian handmade pieces, heritage restoration, and personalized event styling services crafted by skilled artisans in Egypt." />
        <meta property="og:title" content="Custom Egyptian Artisan & Replication Services" />
        <meta property="og:description" content="Custom handmade replicas, pharaonic cartouche personalization, and home styling consultation." />
        <meta property="og:url" content="https://eagles-veritas-shop.lovable.app/services" />
        <link rel="canonical" href="https://eagles-veritas-shop.lovable.app/services" />
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Service",
            "serviceType": "Handmade Heritage & Replication",
            "provider": {
              "@type": "Organization",
              "name": "Tumāninah Veritas Store",
              "url": "https://eagles-veritas-shop.lovable.app"
            },
            "areaServed": "Global",
            "description": "Custom handcrafted Egyptian creations, replication services, and art consulting."
          })}
        </script>
      </Helmet>
      <Navbar />
      
      <main className="flex-1">
        {/* Hero */}
        <section className="bg-gradient-to-b from-secondary/30 to-background py-16 md:py-24">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-primary mb-6">
              Our Services
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Customized solutions for your unique needs
            </p>
          </div>
        </section>

        {/* Services Grid */}
        <section className="py-16 container mx-auto px-4">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto mb-16">
            {/* Custom Handmade Creations */}
            <div className="group bg-gradient-to-br from-card to-card/50 rounded-xl border-2 border-gold/20 p-6 text-center hover:border-gold/50 transition-all duration-300 hover:-translate-y-1 shadow-lg hover:shadow-[var(--shadow-elegant)]">
              <div className="w-20 h-20 bg-gradient-to-br from-gold/20 to-gold/5 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                <Palette className="h-10 w-10 text-gold" />
              </div>
              <h3 className="text-lg font-bold text-foreground mb-2">Custom Handmade Creations</h3>
              <p className="text-sm text-muted-foreground mb-3">
                Unique, handcrafted pieces for:
              </p>
              <ul className="text-xs text-muted-foreground space-y-1.5 text-left mb-3">
                <li className="flex items-start"><span className="text-gold mr-2">✦</span>Engagements & Weddings</li>
                <li className="flex items-start"><span className="text-gold mr-2">✦</span>Corporate Gifts</li>
                <li className="flex items-start"><span className="text-gold mr-2">✦</span>Home Décor</li>
                <li className="flex items-start"><span className="text-gold mr-2">✦</span>Religious Gifts</li>
              </ul>
              <p className="text-sm text-gold font-semibold mt-4">You dream it — we craft it</p>
            </div>

            {/* Heritage Restoration */}
            <div className="group bg-gradient-to-br from-card to-card/50 rounded-xl border-2 border-primary/20 p-6 text-center hover:border-primary/50 transition-all duration-300 hover:-translate-y-1 shadow-lg hover:shadow-[var(--shadow-elegant)]">
              <div className="w-20 h-20 bg-gradient-to-br from-primary/20 to-primary/5 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                <Landmark className="h-10 w-10 text-primary" />
              </div>
              <h3 className="text-lg font-bold text-foreground mb-2">Heritage Restoration</h3>
              <p className="text-sm text-muted-foreground mb-3">
                Authentic Egyptian replicas:
              </p>
              <ul className="text-xs text-muted-foreground space-y-1.5 text-left mb-3">
                <li className="flex items-start"><span className="text-primary mr-2">◆</span>Replica artifacts</li>
                <li className="flex items-start"><span className="text-primary mr-2">◆</span>Historical-inspired art</li>
                <li className="flex items-start"><span className="text-primary mr-2">◆</span>Museum-style décor</li>
              </ul>
              <p className="text-sm text-primary font-semibold mt-4">For collectors & designers</p>
            </div>

            {/* Event Personalization */}
            <div className="group bg-gradient-to-br from-card to-card/50 rounded-xl border-2 border-accent/20 p-6 text-center hover:border-accent/50 transition-all duration-300 hover:-translate-y-1 shadow-lg hover:shadow-[var(--shadow-elegant)]">
              <div className="w-20 h-20 bg-gradient-to-br from-accent/20 to-accent/5 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                <Calendar className="h-10 w-10 text-accent-foreground" />
              </div>
              <h3 className="text-lg font-bold text-foreground mb-2">Event Personalization</h3>
              <p className="text-sm text-muted-foreground mb-3">
                Custom items for special occasions:
              </p>
              <ul className="text-xs text-muted-foreground space-y-1.5 text-left mb-3">
                <li className="flex items-start"><span className="text-accent-foreground mr-2">★</span>Ramadan events</li>
                <li className="flex items-start"><span className="text-accent-foreground mr-2">★</span>Weddings & celebrations</li>
                <li className="flex items-start"><span className="text-accent-foreground mr-2">★</span>Corporate events</li>
              </ul>
              <p className="text-sm text-accent-foreground font-semibold mt-4">Premium packaging included</p>
            </div>

            {/* Art Consultation */}
            <div className="group bg-gradient-to-br from-card to-card/50 rounded-xl border-2 border-secondary/20 p-6 text-center hover:border-secondary/50 transition-all duration-300 hover:-translate-y-1 shadow-lg hover:shadow-[var(--shadow-elegant)]">
              <div className="w-20 h-20 bg-gradient-to-br from-secondary/20 to-secondary/5 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                <MessageSquare className="h-10 w-10 text-secondary-foreground" />
              </div>
              <h3 className="text-lg font-bold text-foreground mb-2">Art & Styling Consultation</h3>
              <p className="text-sm text-muted-foreground mb-3">
                15-minute expert consultation:
              </p>
              <ul className="text-xs text-muted-foreground space-y-1.5 text-left mb-3">
                <li className="flex items-start"><span className="text-secondary-foreground mr-2">●</span>Choosing artwork</li>
                <li className="flex items-start"><span className="text-secondary-foreground mr-2">●</span>Matching décor themes</li>
                <li className="flex items-start"><span className="text-secondary-foreground mr-2">●</span>Product recommendations</li>
              </ul>
              <p className="text-sm text-secondary-foreground font-semibold mt-4">Expert guidance for your space</p>
            </div>

            {/* Gift Services */}
            <div className="group bg-gradient-to-br from-card to-card/50 rounded-xl border-2 border-gold/20 p-6 text-center hover:border-gold/50 transition-all duration-300 hover:-translate-y-1 shadow-lg hover:shadow-[var(--shadow-elegant)]">
              <div className="w-20 h-20 bg-gradient-to-br from-gold/20 to-gold/5 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                <Gift className="h-10 w-10 text-gold" />
              </div>
              <h3 className="text-lg font-bold text-foreground mb-2">Premium Gift Services</h3>
              <p className="text-sm text-muted-foreground mb-3">
                Luxury gift packaging & delivery:
              </p>
              <ul className="text-xs text-muted-foreground space-y-1.5 text-left mb-3">
                <li className="flex items-start"><span className="text-gold mr-2">♦</span>Custom gift wrapping</li>
                <li className="flex items-start"><span className="text-gold mr-2">♦</span>Personalized messages</li>
                <li className="flex items-start"><span className="text-gold mr-2">♦</span>Express delivery options</li>
              </ul>
              <p className="text-sm text-gold font-semibold mt-4">Make every gift memorable</p>
            </div>

            {/* Corporate Solutions */}
            <div className="group bg-gradient-to-br from-card to-card/50 rounded-xl border-2 border-primary/20 p-6 text-center hover:border-primary/50 transition-all duration-300 hover:-translate-y-1 shadow-lg hover:shadow-[var(--shadow-elegant)]">
              <div className="w-20 h-20 bg-gradient-to-br from-primary/20 to-primary/5 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                <Building2 className="h-10 w-10 text-primary" />
              </div>
              <h3 className="text-lg font-bold text-foreground mb-2">Corporate Solutions</h3>
              <p className="text-sm text-muted-foreground mb-3">
                Business & bulk orders:
              </p>
              <ul className="text-xs text-muted-foreground space-y-1.5 text-left mb-3">
                <li className="flex items-start"><span className="text-primary mr-2">■</span>Bulk order discounts</li>
                <li className="flex items-start"><span className="text-primary mr-2">■</span>Corporate branding options</li>
                <li className="flex items-start"><span className="text-primary mr-2">■</span>Dedicated account manager</li>
              </ul>
              <p className="text-sm text-primary font-semibold mt-4">Perfect for businesses</p>
            </div>

            {/* Custom Packaging */}
            <div className="group bg-gradient-to-br from-card to-card/50 rounded-xl border-2 border-accent/20 p-6 text-center hover:border-accent/50 transition-all duration-300 hover:-translate-y-1 shadow-lg hover:shadow-[var(--shadow-elegant)]">
              <div className="w-20 h-20 bg-gradient-to-br from-accent/20 to-accent/5 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                <Package className="h-10 w-10 text-accent-foreground" />
              </div>
              <h3 className="text-lg font-bold text-foreground mb-2">Custom Packaging</h3>
              <p className="text-sm text-muted-foreground mb-3">
                Elegant presentation solutions:
              </p>
              <ul className="text-xs text-muted-foreground space-y-1.5 text-left mb-3">
                <li className="flex items-start"><span className="text-accent-foreground mr-2">▲</span>Luxury boxes & cases</li>
                <li className="flex items-start"><span className="text-accent-foreground mr-2">▲</span>Branded packaging</li>
                <li className="flex items-start"><span className="text-accent-foreground mr-2">▲</span>Eco-friendly options</li>
              </ul>
              <p className="text-sm text-accent-foreground font-semibold mt-4">First impression matters</p>
            </div>

            {/* International Shipping */}
            <div className="group bg-gradient-to-br from-card to-card/50 rounded-xl border-2 border-secondary/20 p-6 text-center hover:border-secondary/50 transition-all duration-300 hover:-translate-y-1 shadow-lg hover:shadow-[var(--shadow-elegant)]">
              <div className="w-20 h-20 bg-gradient-to-br from-secondary/20 to-secondary/5 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                <ShoppingBag className="h-10 w-10 text-secondary-foreground" />
              </div>
              <h3 className="text-lg font-bold text-foreground mb-2">Worldwide Delivery</h3>
              <p className="text-sm text-muted-foreground mb-3">
                Egyptian crafts to your door:
              </p>
              <ul className="text-xs text-muted-foreground space-y-1.5 text-left mb-3">
                <li className="flex items-start"><span className="text-secondary-foreground mr-2">✈</span>International shipping</li>
                <li className="flex items-start"><span className="text-secondary-foreground mr-2">✈</span>Secure packaging</li>
                <li className="flex items-start"><span className="text-secondary-foreground mr-2">✈</span>Order tracking</li>
              </ul>
              <p className="text-sm text-secondary-foreground font-semibold mt-4">From Egypt to the world</p>
            </div>
          </div>

          {/* Contact Form */}
          <div className="max-w-2xl mx-auto bg-card rounded-lg border border-border p-8 shadow-[var(--shadow-soft)]">
            <h2 className="text-2xl font-bold text-primary mb-6 text-center">
              Request a Service
            </h2>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Your name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="your@email.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <FormField
                  control={form.control}
                  name="serviceType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Service Type</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Custom Order, Gift Card, Corporate" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="message"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Message</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Tell us about your requirements..." 
                          rows={5}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <Button 
                  type="submit"
                  className="w-full bg-gold hover:bg-gold/90 text-gold-foreground" 
                  size="lg"
                  disabled={form.formState.isSubmitting}
                >
                  Submit Request
                </Button>
              </form>
            </Form>
          </div>
        </section>

        {/* Shop CTA */}
        <section className="py-12 bg-gradient-to-r from-primary to-primary/80">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold text-primary-foreground mb-4">
              Explore Our Products
            </h2>
            <p className="text-primary-foreground/90 mb-6 max-w-2xl mx-auto">
              Find quality products that match your lifestyle and needs.
            </p>
            <Button size="lg" variant="secondary" asChild>
              <Link to="/shop">
                <ShoppingBag className="mr-2 h-5 w-5" />
                Shop Now
              </Link>
            </Button>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Services;
