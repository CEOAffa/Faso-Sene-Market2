import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion } from "framer-motion";
import { Plus, Trash2, MessageCircle, ShoppingCart, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { useListProducts, useGetLatestPrices, useCreateOrder } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";

const WHATSAPP_NUMBER = "22300000000";

const formSchema = z.object({
  customerName: z.string().min(2, "Nom requis"),
  customerPhone: z.string().min(8, "Numéro de téléphone requis"),
  customerEmail: z.string().email("Email invalide").optional().or(z.literal("")),
  deliveryAddress: z.string().min(5, "Adresse de livraison requise"),
  deliveryDate: z.string().optional(),
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
      const itemLines = cart.map((i) => `- ${i.productName}: ${i.quantity} ${i.unit} x ${i.unitPrice} FCFA = ${i.subtotal.toLocaleString("fr-FR")} FCFA`).join("\n");
      const msg = encodeURIComponent(
        `Bonjour Faso Sènè,\n\nJe souhaite passer une commande:\n\n${itemLines}\n\nTotal: ${totalAmount.toLocaleString("fr-FR")} FCFA\n\nLivraison: ${values.deliveryAddress}\nNom: ${values.customerName}\nTél: ${values.customerPhone}${values.notes ? `\nNotes: ${values.notes}` : ""}`
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
        notes: values.notes || undefined,
        whatsappOrder: values.whatsappOrder,
      }
    }, {
      onSuccess: () => {
        setIsSuccess(true);
        setCart([]);
        form.reset();
      },
      onError: () => {
        toast({ title: "Erreur", description: "Une erreur s'est produite. Veuillez réessayer.", variant: "destructive" });
      }
    });
  }

  if (isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center p-8 max-w-md"
        >
          <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <Check className="h-10 w-10 text-primary" />
          </div>
          <h2 className="text-2xl font-bold mb-3">Commande envoyée</h2>
          <p className="text-muted-foreground mb-6">Votre commande a bien été reçue. Nous vous contacterons sous peu pour confirmer la livraison.</p>
          <Button onClick={() => setIsSuccess(false)} data-testid="button-new-order">
            Passer une nouvelle commande
          </Button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <section className="bg-primary/5 border-b py-12">
        <div className="container mx-auto px-4">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">Passer une Commande</h1>
          <p className="text-muted-foreground">Sélectionnez vos produits et choisissez votre mode de commande.</p>
        </div>
      </section>

      <section className="container mx-auto px-4 py-10">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Product selector + cart */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5 text-primary" />
                  Sélectionner des produits
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {productsLoading ? (
                  <Skeleton className="h-10 w-full" />
                ) : (
                  <div className="flex gap-2">
                    <Select value={selectedProductId} onValueChange={setSelectedProductId}>
                      <SelectTrigger data-testid="select-product" className="flex-1">
                        <SelectValue placeholder="Choisir un produit..." />
                      </SelectTrigger>
                      <SelectContent>
                        {products?.filter((p) => p.isAvailable).map((p) => (
                          <SelectItem key={p.id} value={String(p.id)}>
                            {p.name} {priceMap.get(p.name) ? `— ${priceMap.get(p.name)!.pricePerUnit} FCFA/${priceMap.get(p.name)!.unit}` : ""}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input
                      data-testid="input-quantity"
                      type="number"
                      min="0.1"
                      step="0.1"
                      value={quantity}
                      onChange={(e) => setQuantity(e.target.value)}
                      className="w-24"
                      placeholder="Qté"
                    />
                    <Button data-testid="button-add-cart" onClick={addToCart} disabled={!selectedProductId}>
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                )}

                {cart.length > 0 && (
                  <div className="space-y-2 mt-4">
                    <Separator />
                    {cart.map((item) => (
                      <div key={item.productId} data-testid={`row-cart-${item.productId}`} className="flex items-center justify-between py-2">
                        <div className="flex-1">
                          <p className="font-medium">{item.productName}</p>
                          <p className="text-sm text-muted-foreground">{item.quantity} {item.unit} × {item.unitPrice.toLocaleString("fr-FR")} FCFA</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-semibold text-primary">{item.subtotal.toLocaleString("fr-FR")} FCFA</span>
                          <button
                            data-testid={`button-remove-${item.productId}`}
                            onClick={() => removeFromCart(item.productId)}
                            className="text-muted-foreground hover:text-destructive transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                    <Separator />
                    <div className="flex justify-between pt-2 font-bold text-lg">
                      <span>Total</span>
                      <span className="text-primary">{totalAmount.toLocaleString("fr-FR")} FCFA</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Delivery form */}
            <Card>
              <CardHeader>
                <CardTitle>Informations de livraison</CardTitle>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <div className="grid sm:grid-cols-2 gap-4">
                      <FormField control={form.control} name="customerName" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nom complet</FormLabel>
                          <FormControl>
                            <Input data-testid="input-name" placeholder="Votre nom" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <FormField control={form.control} name="customerPhone" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Téléphone</FormLabel>
                          <FormControl>
                            <Input data-testid="input-phone" placeholder="+223 ..." {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                    </div>
                    <FormField control={form.control} name="customerEmail" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email (optionnel)</FormLabel>
                        <FormControl>
                          <Input data-testid="input-email" placeholder="email@exemple.com" type="email" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="deliveryAddress" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Adresse de livraison</FormLabel>
                        <FormControl>
                          <Input data-testid="input-address" placeholder="Quartier, rue, ville" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="deliveryDate" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Date souhaitée (optionnel)</FormLabel>
                        <FormControl>
                          <Input data-testid="input-delivery-date" type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="notes" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Notes (optionnel)</FormLabel>
                        <FormControl>
                          <Textarea data-testid="input-notes" placeholder="Instructions spéciales..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="whatsappOrder" render={({ field }) => (
                      <FormItem className="flex items-center justify-between rounded-lg border p-4">
                        <div>
                          <FormLabel className="flex items-center gap-2">
                            <MessageCircle className="h-4 w-4 text-[#25D366]" />
                            Commander via WhatsApp
                          </FormLabel>
                          <p className="text-sm text-muted-foreground">Ouvre WhatsApp avec votre commande pré-remplie</p>
                        </div>
                        <FormControl>
                          <Switch data-testid="switch-whatsapp" checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                      </FormItem>
                    )} />
                    <Button
                      data-testid="button-submit-order"
                      type="submit"
                      className="w-full"
                      size="lg"
                      disabled={createOrder.isPending || cart.length === 0}
                    >
                      {createOrder.isPending ? "Envoi en cours..." : "Confirmer la commande"}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </div>

          {/* Summary sidebar */}
          <div>
            <Card className="sticky top-24">
              <CardHeader>
                <CardTitle className="text-base">Récapitulatif</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {cart.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">Votre panier est vide</p>
                ) : (
                  <>
                    {cart.map((item) => (
                      <div key={item.productId} className="flex justify-between text-sm">
                        <span>{item.productName} ×{item.quantity}</span>
                        <span>{item.subtotal.toLocaleString("fr-FR")} F</span>
                      </div>
                    ))}
                    <Separator />
                    <div className="flex justify-between font-bold">
                      <span>Total</span>
                      <span className="text-primary">{totalAmount.toLocaleString("fr-FR")} FCFA</span>
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
