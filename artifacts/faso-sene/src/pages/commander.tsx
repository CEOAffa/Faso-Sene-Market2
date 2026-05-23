import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Trash2, MessageCircle, ShoppingCart, Check, Banknote, Smartphone, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { useListProducts, useGetLatestPrices, useCreateOrder } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";

const WHATSAPP_NUMBER = "22374947541";

const PAYMENT_METHODS = [
  {
    id: "livraison",
    label: "Livraison contre remboursement",
    description: "Payez en espèces à la livraison",
    icon: Banknote,
    color: "text-emerald-600",
    bg: "bg-emerald-50 border-emerald-200",
    activeBg: "bg-emerald-600",
  },
  {
    id: "orange_money",
    label: "Orange Money",
    description: "Paiement mobile Orange Money",
    icon: Smartphone,
    color: "text-orange-500",
    bg: "bg-orange-50 border-orange-200",
    activeBg: "bg-orange-500",
  },
  {
    id: "wave",
    label: "Wave",
    description: "Paiement rapide via Wave",
    icon: Wallet,
    color: "text-blue-500",
    bg: "bg-blue-50 border-blue-200",
    activeBg: "bg-blue-500",
  },
];

const TIME_SLOTS = [
  { value: "matin", label: "Matin", sub: "8h – 12h" },
  { value: "apres-midi", label: "Après-midi", sub: "12h – 17h" },
  { value: "soir", label: "Soir", sub: "17h – 20h" },
  { value: "flexible", label: "Flexible", sub: "À définir" },
];

const formSchema = z.object({
  customerName: z.string().min(2, "Nom requis"),
  customerPhone: z.string().min(8, "Numéro de téléphone requis"),
  customerEmail: z.string().email("Email invalide").optional().or(z.literal("")),
  deliveryAddress: z.string().min(5, "Adresse de livraison requise"),
  deliveryDate: z.string().optional(),
  deliveryTime: z.string().optional(),
  notes: z.string().optional(),
  whatsappOrder: z.boolean().default(false),
});

type FormValues = z.infer<typeof formSchema>;

interface CartItem {
  productId: number;
  productName: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  subtotal: number;
}

export default function Commander() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<string>("");
  const [quantity, setQuantity] = useState<string>("1");
  const [paymentMethod, setPaymentMethod] = useState<string>("livraison");
  const [isSuccess, setIsSuccess] = useState(false);
  const { data: products, isLoading: productsLoading } = useListProducts();
  const { data: latestPrices } = useGetLatestPrices();
  const createOrder = useCreateOrder();
  const { toast } = useToast();

  const priceMap = new Map(latestPrices?.map((p) => [p.productName, p]) ?? []);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      customerName: "",
      customerPhone: "",
      customerEmail: "",
      deliveryAddress: "",
      deliveryDate: "",
      deliveryTime: "",
      notes: "",
      whatsappOrder: false,
    },
  });

  const totalAmount = cart.reduce((sum, item) => sum + item.subtotal, 0);

  function addToCart() {
    if (!selectedProductId || !quantity) return;
    const product = products?.find((p) => p.id === parseInt(selectedProductId));
    if (!product) return;
    const priceInfo = priceMap.get(product.name);
    const unitPrice = priceInfo?.pricePerUnit ?? 0;
    const qty = parseFloat(quantity);
    if (qty <= 0) return;

    const existing = cart.find((i) => i.productId === product.id);
    if (existing) {
      setCart(cart.map((i) =>
        i.productId === product.id
          ? { ...i, quantity: i.quantity + qty, subtotal: (i.quantity + qty) * i.unitPrice }
          : i
      ));
    } else {
      setCart([...cart, {
        productId: product.id,
        productName: product.name,
        quantity: qty,
        unit: priceInfo?.unit ?? product.unit,
        unitPrice,
        subtotal: qty * unitPrice,
      }]);
    }
    setSelectedProductId("");
    setQuantity("1");
  }

  function removeFromCart(productId: number) {
    setCart(cart.filter((i) => i.productId !== productId));
  }

  function onSubmit(values: FormValues) {
    if (cart.length === 0) {
      toast({ title: "Panier vide", description: "Ajoutez des produits avant de commander.", variant: "destructive" });
      return;
    }

    if (values.whatsappOrder) {
      const paymentLabel = PAYMENT_METHODS.find((m) => m.id === paymentMethod)?.label ?? paymentMethod;
      const itemLines = cart.map((i) => `- ${i.productName}: ${i.quantity} ${i.unit} x ${i.unitPrice.toLocaleString("fr-FR")} FCFA = ${i.subtotal.toLocaleString("fr-FR")} FCFA`).join("\n");
      const timeLabel = TIME_SLOTS.find((t) => t.value === values.deliveryTime)?.label;
      const msg = encodeURIComponent(
        `Bonjour Faso Sènè,\n\nJe souhaite passer une commande:\n\n${itemLines}\n\nTotal: ${totalAmount.toLocaleString("fr-FR")} FCFA\nPaiement: ${paymentLabel}\n\nLivraison: ${values.deliveryAddress}${values.deliveryDate ? `\nDate: ${values.deliveryDate}` : ""}${timeLabel ? ` (${timeLabel})` : ""}\nNom: ${values.customerName}\nTél: ${values.customerPhone}${values.notes ? `\nNotes: ${values.notes}` : ""}`
      );
      window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${msg}`, "_blank");
    }

    createOrder.mutate({
      data: {
        customerName: values.customerName,
        customerPhone: values.customerPhone,
        customerEmail: values.customerEmail || undefined,
        items: cart.map((i) => ({
          productId: i.productId,
          quantity: i.quantity,
          unitPrice: i.unitPrice,
        })),
        deliveryAddress: values.deliveryAddress,
        deliveryDate: values.deliveryDate || undefined,
        deliveryTime: values.deliveryTime || undefined,
        notes: values.notes || undefined,
        whatsappOrder: values.whatsappOrder,
        paymentMethod,
      }
    }, {
      onSuccess: () => {
        setIsSuccess(true);
        setCart([]);
        form.reset();
        setPaymentMethod("livraison");
      },
      onError: () => {
        toast({ title: "Erreur", description: "Une erreur s'est produite. Veuillez réessayer.", variant: "destructive" });
      }
    });
  }

  if (isSuccess) {
    const methodLabel = PAYMENT_METHODS.find((m) => m.id === paymentMethod)?.label;
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center p-8 max-w-md w-full"
        >
          <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <Check className="h-10 w-10 text-primary" />
          </div>
          <h2 className="text-2xl font-bold mb-3">Commande envoyée !</h2>
          <p className="text-muted-foreground mb-3">Votre commande a bien été reçue. Nous vous contacterons sous peu pour confirmer la livraison.</p>
          {methodLabel && (
            <p className="text-sm font-medium text-primary mb-6">Mode de paiement : {methodLabel}</p>
          )}
          <Button onClick={() => setIsSuccess(false)} data-testid="button-new-order" className="w-full sm:w-auto">
            Passer une nouvelle commande
          </Button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <section className="bg-primary/5 border-b py-10 md:py-12">
        <div className="container mx-auto px-4">
          <h1 className="text-2xl md:text-4xl font-bold mb-2">Passer une Commande</h1>
          <p className="text-muted-foreground text-sm md:text-base">Sélectionnez vos produits et choisissez votre mode de paiement.</p>
        </div>
      </section>

      <section className="container mx-auto px-4 py-6 md:py-10">
        <div className="grid lg:grid-cols-3 gap-6 lg:gap-8">
          {/* Left: Product selector + cart + form */}
          <div className="lg:col-span-2 space-y-5">
            {/* Product selector */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base md:text-lg">
                  <ShoppingCart className="h-5 w-5 text-primary" />
                  Sélectionner des produits
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {productsLoading ? (
                  <Skeleton className="h-10 w-full" />
                ) : (
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Select value={selectedProductId} onValueChange={setSelectedProductId}>
                      <SelectTrigger data-testid="select-product" className="flex-1 h-11">
                        <SelectValue placeholder="Choisir un produit..." />
                      </SelectTrigger>
                      <SelectContent>
                        {products?.filter((p) => p.isAvailable).map((p) => (
                          <SelectItem key={p.id} value={String(p.id)}>
                            {p.name} {priceMap.get(p.name) ? `— ${priceMap.get(p.name)!.pricePerUnit.toLocaleString("fr-FR")} FCFA/${priceMap.get(p.name)!.unit}` : ""}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <div className="flex gap-2">
                      <Input
                        data-testid="input-quantity"
                        type="number"
                        min="0.1"
                        step="0.1"
                        value={quantity}
                        onChange={(e) => setQuantity(e.target.value)}
                        className="w-24 h-11"
                        placeholder="Qté"
                      />
                      <Button data-testid="button-add-cart" onClick={addToCart} disabled={!selectedProductId} className="h-11 px-4">
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}

                <AnimatePresence>
                  {cart.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      className="space-y-2 mt-2"
                    >
                      <Separator />
                      {cart.map((item) => (
                        <div key={item.productId} data-testid={`row-cart-${item.productId}`} className="flex items-center justify-between py-2 gap-2">
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm md:text-base truncate">{item.productName}</p>
                            <p className="text-xs md:text-sm text-muted-foreground">{item.quantity} {item.unit} × {item.unitPrice.toLocaleString("fr-FR")} FCFA</p>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="font-semibold text-primary text-sm">{item.subtotal.toLocaleString("fr-FR")} F</span>
                            <button
                              data-testid={`button-remove-${item.productId}`}
                              onClick={() => removeFromCart(item.productId)}
                              className="text-muted-foreground hover:text-destructive transition-colors p-1"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                      <Separator />
                      <div className="flex justify-between pt-2 font-bold text-base md:text-lg">
                        <span>Total</span>
                        <span className="text-primary">{totalAmount.toLocaleString("fr-FR")} FCFA</span>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </CardContent>
            </Card>

            {/* Payment method */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base md:text-lg">Mode de paiement</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {PAYMENT_METHODS.map((method) => {
                    const Icon = method.icon;
                    const isSelected = paymentMethod === method.id;
                    return (
                      <button
                        key={method.id}
                        type="button"
                        onClick={() => setPaymentMethod(method.id)}
                        className={`relative flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all text-center ${
                          isSelected
                            ? `border-primary bg-primary/5 shadow-sm`
                            : "border-border hover:border-primary/30 hover:bg-muted/50"
                        }`}
                      >
                        {isSelected && (
                          <motion.div
                            layoutId="payment-indicator"
                            className="absolute top-2 right-2 w-5 h-5 bg-primary rounded-full flex items-center justify-center"
                          >
                            <Check className="h-3 w-3 text-white" />
                          </motion.div>
                        )}
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isSelected ? "bg-primary/10" : "bg-muted"}`}>
                          <Icon className={`h-5 w-5 ${isSelected ? "text-primary" : "text-muted-foreground"}`} />
                        </div>
                        <div>
                          <p className={`font-semibold text-sm leading-tight ${isSelected ? "text-primary" : "text-foreground"}`}>{method.label}</p>
                          <p className="text-xs text-muted-foreground mt-0.5 hidden sm:block">{method.description}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
                {paymentMethod === "orange_money" && (
                  <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-3 text-sm text-orange-600 bg-orange-50 rounded-lg px-3 py-2">
                    Vous recevrez un code de paiement Orange Money après confirmation de votre commande.
                  </motion.p>
                )}
                {paymentMethod === "wave" && (
                  <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-3 text-sm text-blue-600 bg-blue-50 rounded-lg px-3 py-2">
                    Vous recevrez un lien Wave pour effectuer le paiement après confirmation.
                  </motion.p>
                )}
              </CardContent>
            </Card>

            {/* Delivery form */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base md:text-lg">Informations de livraison</CardTitle>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <div className="grid sm:grid-cols-2 gap-4">
                      <FormField control={form.control} name="customerName" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nom complet</FormLabel>
                          <FormControl>
                            <Input data-testid="input-name" placeholder="Votre nom" className="h-11" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <FormField control={form.control} name="customerPhone" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Téléphone</FormLabel>
                          <FormControl>
                            <Input data-testid="input-phone" placeholder="+223 ..." className="h-11" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                    </div>
                    <FormField control={form.control} name="customerEmail" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email (optionnel)</FormLabel>
                        <FormControl>
                          <Input data-testid="input-email" placeholder="email@exemple.com" type="email" className="h-11" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="deliveryAddress" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Adresse de livraison</FormLabel>
                        <FormControl>
                          <Input data-testid="input-address" placeholder="Quartier, rue, ville" className="h-11" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <div className="grid sm:grid-cols-2 gap-4">
                      <FormField control={form.control} name="deliveryDate" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Date souhaitée (optionnel)</FormLabel>
                          <FormControl>
                            <Input data-testid="input-delivery-date" type="date" className="h-11" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <FormField control={form.control} name="deliveryTime" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Créneau horaire (optionnel)</FormLabel>
                          <div className="grid grid-cols-2 gap-1.5">
                            {TIME_SLOTS.map((slot) => (
                              <button
                                key={slot.value}
                                type="button"
                                onClick={() => field.onChange(field.value === slot.value ? "" : slot.value)}
                                className={`flex flex-col items-center py-2 px-1 rounded-lg border text-center transition-all ${
                                  field.value === slot.value
                                    ? "border-primary bg-primary/5 text-primary"
                                    : "border-border text-muted-foreground hover:border-primary/30"
                                }`}
                              >
                                <span className="text-xs font-semibold">{slot.label}</span>
                                <span className="text-[10px] opacity-70">{slot.sub}</span>
                              </button>
                            ))}
                          </div>
                        </FormItem>
                      )} />
                    </div>
                    <FormField control={form.control} name="notes" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Notes (optionnel)</FormLabel>
                        <FormControl>
                          <Textarea data-testid="input-notes" placeholder="Instructions spéciales..." className="resize-none" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="whatsappOrder" render={({ field }) => (
                      <FormItem className="flex items-center justify-between rounded-xl border p-4 gap-4">
                        <div className="flex-1">
                          <FormLabel className="flex items-center gap-2 cursor-pointer">
                            <MessageCircle className="h-4 w-4 text-[#25D366]" />
                            Commander via WhatsApp
                          </FormLabel>
                          <p className="text-xs text-muted-foreground mt-0.5">Ouvre WhatsApp avec votre commande pré-remplie</p>
                        </div>
                        <FormControl>
                          <Switch data-testid="switch-whatsapp" checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                      </FormItem>
                    )} />

                    {/* Order summary before submit */}
                    {cart.length > 0 && (
                      <div className="rounded-xl bg-primary/5 border border-primary/10 p-4 space-y-2">
                        <p className="text-sm font-semibold text-primary">Récapitulatif de commande</p>
                        {cart.map((item) => (
                          <div key={item.productId} className="flex justify-between text-sm">
                            <span className="text-muted-foreground">{item.productName} ×{item.quantity}</span>
                            <span className="font-medium">{item.subtotal.toLocaleString("fr-FR")} F</span>
                          </div>
                        ))}
                        <Separator className="my-1" />
                        <div className="flex justify-between font-bold">
                          <span>Total</span>
                          <span className="text-primary">{totalAmount.toLocaleString("fr-FR")} FCFA</span>
                        </div>
                        <div className="flex items-center gap-2 pt-1">
                          <Badge variant="outline" className="text-xs">
                            {PAYMENT_METHODS.find((m) => m.id === paymentMethod)?.label}
                          </Badge>
                        </div>
                      </div>
                    )}

                    <Button
                      data-testid="button-submit-order"
                      type="submit"
                      className="w-full h-12 text-base"
                      disabled={createOrder.isPending || cart.length === 0}
                    >
                      {createOrder.isPending ? "Envoi en cours..." : `Confirmer la commande${totalAmount > 0 ? ` — ${totalAmount.toLocaleString("fr-FR")} FCFA` : ""}`}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </div>

          {/* Right: Sticky summary (desktop) */}
          <div className="hidden lg:block">
            <Card className="sticky top-24">
              <CardHeader>
                <CardTitle className="text-base">Récapitulatif</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {cart.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-6">Votre panier est vide</p>
                ) : (
                  <>
                    {cart.map((item) => (
                      <div key={item.productId} className="flex justify-between text-sm">
                        <span className="text-muted-foreground">{item.productName} ×{item.quantity}</span>
                        <span className="font-medium">{item.subtotal.toLocaleString("fr-FR")} F</span>
                      </div>
                    ))}
                    <Separator />
                    <div className="flex justify-between font-bold">
                      <span>Total</span>
                      <span className="text-primary">{totalAmount.toLocaleString("fr-FR")} FCFA</span>
                    </div>
                    <Separator />
                    <div className="text-xs text-muted-foreground">
                      <p className="font-medium text-foreground mb-1">Paiement</p>
                      <p>{PAYMENT_METHODS.find((m) => m.id === paymentMethod)?.label}</p>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
}
