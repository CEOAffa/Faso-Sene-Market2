import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion } from "framer-motion";
import { UserPlus, MapPin, Phone, Mail, Star, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { useListSuppliers, useCreateSupplier, getListSuppliersQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

const REGIONS = ["Bamako", "Sikasso", "Mopti", "Ségou", "Kayes", "Koulikoro", "Tombouctou", "Gao", "Kidal"];
const TYPES = ["Agriculteur", "Éleveur", "Grossiste", "Coopérative"];

const formSchema = z.object({
  name: z.string().min(2, "Nom requis"),
  phone: z.string().min(8, "Téléphone requis"),
  email: z.string().email("Email invalide").optional().or(z.literal("")),
  region: z.string().min(1, "Région requise"),
  village: z.string().optional(),
  type: z.string().min(1, "Type requis"),
  description: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export default function Fournisseurs() {
  const [isSuccess, setIsSuccess] = useState(false);
  const { data: suppliers, isLoading } = useListSuppliers();
  const createSupplier = useCreateSupplier();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      phone: "",
      email: "",
      region: "",
      village: "",
      type: "",
      description: "",
    },
  });

  function onSubmit(values: FormValues) {
    createSupplier.mutate({
      data: {
        name: values.name,
        phone: values.phone,
        email: values.email || undefined,
        region: values.region,
        village: values.village || undefined,
        type: values.type,
        description: values.description || undefined,
      }
    }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListSuppliersQueryKey() });
        setIsSuccess(true);
        form.reset();
        toast({ title: "Inscription réussie", description: "Votre dossier a été soumis avec succès." });
      },
      onError: () => {
        toast({ title: "Erreur", description: "Une erreur s'est produite.", variant: "destructive" });
      }
    });
  }

  return (
    <div className="min-h-screen bg-background">
      <section className="bg-primary text-primary-foreground py-12">
        <div className="container mx-auto px-4">
          <motion.h1
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-3xl md:text-4xl font-bold mb-2"
          >
            Fournisseurs
          </motion.h1>
          <p className="text-primary-foreground/80">Rejoignez notre réseau de producteurs agricoles</p>
        </div>
      </section>

      <section className="container mx-auto px-4 py-10">
        <Tabs defaultValue="register">
          <TabsList className="mb-8">
            <TabsTrigger value="register" data-testid="tab-register">S'inscrire</TabsTrigger>
            <TabsTrigger value="list" data-testid="tab-list">Annuaire ({suppliers?.length ?? 0})</TabsTrigger>
          </TabsList>

          {/* Registration form */}
          <TabsContent value="register">
            <div className="max-w-xl mx-auto">
              {isSuccess ? (
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="text-center py-12"
                >
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Check className="h-8 w-8 text-primary" />
                  </div>
                  <h2 className="text-xl font-bold mb-2">Inscription soumise</h2>
                  <p className="text-muted-foreground mb-6">Nous vous contacterons sous 24h pour finaliser votre inscription.</p>
                  <Button onClick={() => setIsSuccess(false)} variant="outline" data-testid="button-new-registration">
                    Nouvelle inscription
                  </Button>
                </motion.div>
              ) : (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <UserPlus className="h-5 w-5 text-primary" />
                      Inscription Fournisseur
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Form {...form}>
                      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <div className="grid sm:grid-cols-2 gap-4">
                          <FormField control={form.control} name="name" render={({ field }) => (
                            <FormItem>
                              <FormLabel>Nom / Société</FormLabel>
                              <FormControl>
                                <Input data-testid="input-supplier-name" placeholder="Votre nom ou société" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )} />
                          <FormField control={form.control} name="phone" render={({ field }) => (
                            <FormItem>
                              <FormLabel>Téléphone</FormLabel>
                              <FormControl>
                                <Input data-testid="input-supplier-phone" placeholder="+223 ..." {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )} />
                        </div>
                        <FormField control={form.control} name="email" render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email (optionnel)</FormLabel>
                            <FormControl>
                              <Input data-testid="input-supplier-email" type="email" placeholder="email@exemple.com" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )} />
                        <div className="grid sm:grid-cols-2 gap-4">
                          <FormField control={form.control} name="region" render={({ field }) => (
                            <FormItem>
                              <FormLabel>Région</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger data-testid="select-region">
                                    <SelectValue placeholder="Choisir..." />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {REGIONS.map((r) => (
                                    <SelectItem key={r} value={r}>{r}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )} />
                          <FormField control={form.control} name="type" render={({ field }) => (
                            <FormItem>
                              <FormLabel>Type de fournisseur</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger data-testid="select-type">
                                    <SelectValue placeholder="Choisir..." />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {TYPES.map((t) => (
                                    <SelectItem key={t} value={t}>{t}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )} />
                        </div>
                        <FormField control={form.control} name="village" render={({ field }) => (
                          <FormItem>
                            <FormLabel>Village / Quartier (optionnel)</FormLabel>
                            <FormControl>
                              <Input data-testid="input-village" placeholder="Votre localité" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )} />
                        <FormField control={form.control} name="description" render={({ field }) => (
                          <FormItem>
                            <FormLabel>Description de vos produits (optionnel)</FormLabel>
                            <FormControl>
                              <Textarea data-testid="input-description" placeholder="Quels produits proposez-vous ?" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )} />
                        <Button
                          data-testid="button-submit-supplier"
                          type="submit"
                          className="w-full"
                          size="lg"
                          disabled={createSupplier.isPending}
                        >
                          {createSupplier.isPending ? "Envoi..." : "Soumettre l'inscription"}
                        </Button>
                      </form>
                    </Form>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* Supplier list */}
          <TabsContent value="list">
            {isLoading ? (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} className="h-48 rounded-xl" />
                ))}
              </div>
            ) : !suppliers || suppliers.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-muted-foreground">Aucun fournisseur inscrit pour le moment.</p>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {suppliers.map((supplier, i) => (
                  <motion.div
                    key={supplier.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    data-testid={`card-supplier-${supplier.id}`}
                  >
                    <Card className="hover:shadow-md transition-shadow h-full">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <CardTitle className="text-base">{supplier.name}</CardTitle>
                            <Badge variant="outline" className="mt-1 text-xs">{supplier.type}</Badge>
                          </div>
                          {supplier.status === "active" && (
                            <div className="w-2 h-2 bg-primary rounded-full mt-2" title="Actif" />
                          )}
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
                          <span>{supplier.village ? `${supplier.village}, ` : ""}{supplier.region}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Phone className="h-3.5 w-3.5 flex-shrink-0" />
                          <span>{supplier.phone}</span>
                        </div>
                        {supplier.email && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Mail className="h-3.5 w-3.5 flex-shrink-0" />
                            <span className="truncate">{supplier.email}</span>
                          </div>
                        )}
                        {supplier.description && (
                          <p className="text-sm text-muted-foreground line-clamp-2 pt-1">{supplier.description}</p>
                        )}
                        {(supplier.totalProducts ?? 0) > 0 && (
                          <div className="flex items-center gap-1 text-xs text-primary font-medium pt-1">
                            <Star className="h-3 w-3" />
                            {supplier.totalProducts} produit(s) disponible(s)
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </section>
    </div>
  );
}
