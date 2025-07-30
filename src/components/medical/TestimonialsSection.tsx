import { Star, Quote } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const TestimonialsSection = () => {
  const testimonials = [
    {
      name: "Maria Silva",
      role: "Paciente",
      avatar: "MS",
      rating: 5,
      text: "A IA identificou meus sintomas rapidamente e me direcionou ao especialista certo. Economia de tempo incrível!",
      condition: "Diagnóstico de sinusite"
    },
    {
      name: "Dr. João Santos",
      role: "Cardiologista",
      avatar: "JS",
      rating: 5,
      text: "Como médico, fico impressionado com a precisão da análise. Uma ferramenta valiosa para triagem inicial.",
      condition: "Validação médica"
    },
    {
      name: "Ana Costa",
      role: "Mãe de família",
      avatar: "AC",
      rating: 5,
      text: "Uso para toda família. Detectou uma infecção no meu filho antes mesmo dos sintomas ficarem graves.",
      condition: "Plano Família"
    },
    {
      name: "Carlos Mendes",
      role: "Paciente",
      avatar: "CM", 
      rating: 5,
      text: "A análise de voz detectou alterações que eu nem percebia. Me ajudou a buscar ajuda médica no tempo certo.",
      condition: "Análise multimodal"
    }
  ];

  return (
    <div className="py-16 bg-gradient-subtle">
      <div className="container mx-auto px-6">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-foreground mb-4">
            O que nossos usuários dizem
          </h2>
          <p className="text-muted-foreground text-lg">
            Depoimentos reais de pacientes e médicos que confiam na Aurya
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {testimonials.map((testimonial, index) => (
            <Card key={index} className="p-6 relative bg-card shadow-card hover:shadow-elevated transition-shadow">
              <Quote className="h-8 w-8 text-primary/20 absolute top-4 right-4" />
              
              <div className="flex items-center gap-3 mb-4">
                <Avatar>
                  <AvatarImage src="" />
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    {testimonial.avatar}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="font-semibold text-sm">{testimonial.name}</div>
                  <div className="text-xs text-muted-foreground">{testimonial.role}</div>
                </div>
              </div>

              <div className="flex items-center gap-1 mb-3">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-warning text-warning" />
                ))}
              </div>

              <p className="text-sm text-foreground mb-3 leading-relaxed">
                "{testimonial.text}"
              </p>

              <div className="text-xs text-primary font-medium bg-primary/10 px-2 py-1 rounded-full inline-block">
                {testimonial.condition}
              </div>
            </Card>
          ))}
        </div>

        <div className="text-center mt-12">
          <div className="inline-flex items-center gap-2 bg-success/10 text-success px-4 py-2 rounded-full">
            <Star className="h-4 w-4 fill-success" />
            <span className="font-semibold">4.9/5 estrelas</span>
            <span className="text-sm opacity-80">• +2.847 avaliações</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestimonialsSection;