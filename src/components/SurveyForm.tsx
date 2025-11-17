import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";
import { CheckCircle2, Plus, X } from "lucide-react";

const formSchema = z.object({
  name: z.string().trim().min(2, { message: "Name must be at least 2 characters" }).max(100, { message: "Name must be less than 100 characters" }),
  mobile: z.string().trim().regex(/^[6-9]\d{9}$/, { message: "Please enter a valid 10-digit mobile number" }),
  panchayath: z.string().trim().min(2, { message: "Panchayath is required" }).max(100, { message: "Panchayath must be less than 100 characters" }),
  ward: z.string().trim().min(1, { message: "Ward is required" }).max(50, { message: "Ward must be less than 50 characters" }),
  userType: z.enum(["customer", "agent"], { required_error: "Please select user type" }),
  products: z.array(z.string().trim().min(2, { message: "Product/Service must be at least 2 characters" }).max(200, { message: "Product/Service must be less than 200 characters" })).min(1, { message: "Please add at least one product/service" }),
});

type FormValues = z.infer<typeof formSchema>;

export function SurveyForm() {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [products, setProducts] = useState<string[]>([""]);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      mobile: "",
      panchayath: "",
      ward: "",
      userType: undefined,
      products: [""],
    },
  });

  const addProductField = () => {
    setProducts([...products, ""]);
  };

  const removeProductField = (index: number) => {
    if (products.length > 1) {
      const newProducts = products.filter((_, i) => i !== index);
      setProducts(newProducts);
      form.setValue("products", newProducts.filter(p => p.trim() !== ""));
    }
  };

  const updateProductField = (index: number, value: string) => {
    const newProducts = [...products];
    newProducts[index] = value;
    setProducts(newProducts);
    form.setValue("products", newProducts.filter(p => p.trim() !== ""));
  };

  function onSubmit(values: FormValues) {
    console.log("Survey submitted:", values);
    setIsSubmitted(true);
    toast.success("Survey submitted successfully!");
    form.reset();
    setProducts([""]);
    
    // Reset success state after 5 seconds
    setTimeout(() => {
      setIsSubmitted(false);
    }, 5000);
  }

  if (isSubmitted) {
    return (
      <div className="text-center space-y-6 animate-in fade-in duration-500">
        <div className="flex justify-center">
          <div className="rounded-full bg-primary/10 p-4">
            <CheckCircle2 className="h-16 w-16 text-primary" />
          </div>
        </div>
        <div className="space-y-2">
          <h2 className="text-3xl font-bold text-foreground">Thank You!</h2>
          <p className="text-muted-foreground text-lg">
            Your response has been recorded successfully. We appreciate your valuable feedback.
          </p>
        </div>
        <Button onClick={() => setIsSubmitted(false)} variant="outline" size="lg">
          Submit Another Response
        </Button>
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 animate-in fade-in duration-500">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Full Name</FormLabel>
              <FormControl>
                <Input placeholder="Enter your full name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="mobile"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Mobile Number</FormLabel>
              <FormControl>
                <Input placeholder="Enter 10-digit mobile number" type="tel" maxLength={10} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="panchayath"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Panchayath</FormLabel>
                <FormControl>
                  <Input placeholder="Enter your panchayath" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="ward"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Ward</FormLabel>
                <FormControl>
                  <Input placeholder="Enter your ward" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="userType"
          render={({ field }) => (
            <FormItem>
              <FormLabel>I am a</FormLabel>
              <FormControl>
                <RadioGroup
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  className="flex flex-col space-y-2"
                >
                  <div className="flex items-center space-x-3 rounded-lg border border-border p-4 hover:border-primary transition-colors cursor-pointer">
                    <RadioGroupItem value="customer" id="customer" />
                    <label htmlFor="customer" className="flex-1 cursor-pointer font-medium">
                      Customer
                    </label>
                  </div>
                  <div className="flex items-center space-x-3 rounded-lg border border-border p-4 hover:border-primary transition-colors cursor-pointer">
                    <RadioGroupItem value="agent" id="agent" />
                    <label htmlFor="agent" className="flex-1 cursor-pointer font-medium">
                      Agent
                    </label>
                  </div>
                </RadioGroup>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <FormLabel>Products/Services You Want to See on Our App</FormLabel>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addProductField}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Add More
            </Button>
          </div>
          
          <div className="space-y-3">
            {products.map((product, index) => (
              <div key={index} className="flex gap-2 items-start">
                <div className="flex-1">
                  <Input
                    placeholder={`Product/Service ${index + 1}`}
                    value={product}
                    onChange={(e) => updateProductField(index, e.target.value)}
                  />
                </div>
                {products.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeProductField(index)}
                    className="shrink-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>
          
          {form.formState.errors.products && (
            <p className="text-sm font-medium text-destructive">
              {form.formState.errors.products.message}
            </p>
          )}
        </div>

        <Button type="submit" size="lg" className="w-full">
          Submit Survey
        </Button>
      </form>
    </Form>
  );
}
