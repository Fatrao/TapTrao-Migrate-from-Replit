import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { AlertTriangle, CheckCircle2, Info, Save } from "lucide-react";
import { usePageTitle } from "@/hooks/use-page-title";
import type { CompanyProfile } from "@shared/schema";
import { useEffect } from "react";

const profileSchema = z.object({
  companyName: z.string().min(1, "Company name is required"),
  registeredAddress: z.string().min(1, "Registered address is required"),
  countryIso2: z.string().min(2, "Country is required").max(2),
  vatNumber: z.string().optional().or(z.literal("")),
  eoriNumber: z.string().optional().or(z.literal("")),
  contactEmail: z.string().email("Must be a valid email").optional().or(z.literal("")),
});

type ProfileForm = z.infer<typeof profileSchema>;

const COUNTRIES = [
  { iso2: "GB", name: "United Kingdom" },
  { iso2: "FR", name: "France" },
  { iso2: "DE", name: "Germany" },
  { iso2: "NL", name: "Netherlands" },
  { iso2: "BE", name: "Belgium" },
  { iso2: "IT", name: "Italy" },
  { iso2: "ES", name: "Spain" },
  { iso2: "PT", name: "Portugal" },
  { iso2: "AT", name: "Austria" },
  { iso2: "CH", name: "Switzerland" },
  { iso2: "IE", name: "Ireland" },
  { iso2: "DK", name: "Denmark" },
  { iso2: "SE", name: "Sweden" },
  { iso2: "NO", name: "Norway" },
  { iso2: "FI", name: "Finland" },
  { iso2: "PL", name: "Poland" },
  { iso2: "CZ", name: "Czech Republic" },
  { iso2: "US", name: "United States" },
  { iso2: "CA", name: "Canada" },
  { iso2: "AE", name: "United Arab Emirates" },
  { iso2: "SA", name: "Saudi Arabia" },
  { iso2: "TR", name: "Turkey" },
  { iso2: "IN", name: "India" },
  { iso2: "CN", name: "China" },
  { iso2: "JP", name: "Japan" },
  { iso2: "KR", name: "South Korea" },
  { iso2: "SG", name: "Singapore" },
  { iso2: "AU", name: "Australia" },
  { iso2: "ZA", name: "South Africa" },
  { iso2: "NG", name: "Nigeria" },
  { iso2: "GH", name: "Ghana" },
  { iso2: "CI", name: "Côte d'Ivoire" },
  { iso2: "KE", name: "Kenya" },
  { iso2: "ET", name: "Ethiopia" },
  { iso2: "TZ", name: "Tanzania" },
  { iso2: "UG", name: "Uganda" },
  { iso2: "SN", name: "Senegal" },
  { iso2: "CM", name: "Cameroon" },
  { iso2: "CD", name: "DR Congo" },
  { iso2: "MG", name: "Madagascar" },
  { iso2: "BF", name: "Burkina Faso" },
  { iso2: "ML", name: "Mali" },
  { iso2: "NE", name: "Niger" },
  { iso2: "TG", name: "Togo" },
  { iso2: "BJ", name: "Benin" },
  { iso2: "GN", name: "Guinea" },
  { iso2: "SL", name: "Sierra Leone" },
  { iso2: "LR", name: "Liberia" },
  { iso2: "MW", name: "Malawi" },
  { iso2: "MZ", name: "Mozambique" },
  { iso2: "ZM", name: "Zambia" },
  { iso2: "ZW", name: "Zimbabwe" },
  { iso2: "BR", name: "Brazil" },
  { iso2: "MX", name: "Mexico" },
  { iso2: "AR", name: "Argentina" },
  { iso2: "CL", name: "Chile" },
  { iso2: "CO", name: "Colombia" },
].sort((a, b) => a.name.localeCompare(b.name));

export default function SettingsProfile() {
  usePageTitle("Company Profile | TapTrao");

  const { toast } = useToast();

  const profileQuery = useQuery<CompanyProfile | null>({
    queryKey: ["/api/company-profile"],
  });

  const form = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      companyName: "",
      registeredAddress: "",
      countryIso2: "",
      vatNumber: "",
      eoriNumber: "",
      contactEmail: "",
    },
  });

  useEffect(() => {
    if (profileQuery.data) {
      form.reset({
        companyName: profileQuery.data.companyName || "",
        registeredAddress: profileQuery.data.registeredAddress || "",
        countryIso2: profileQuery.data.countryIso2 || "",
        vatNumber: profileQuery.data.vatNumber || "",
        eoriNumber: profileQuery.data.eoriNumber || "",
        contactEmail: profileQuery.data.contactEmail || "",
      });
    }
  }, [profileQuery.data]);

  const saveMutation = useMutation({
    mutationFn: async (data: ProfileForm) => {
      const res = await apiRequest("POST", "/api/company-profile", data);
      return res.json();
    },
    onSuccess: (savedProfile) => {
      queryClient.invalidateQueries({ queryKey: ["/api/company-profile"] });
      const noEori = !savedProfile.eoriNumber;
      if (noEori) {
        toast({
          title: "Profile saved",
          description: "No EORI number saved. Your TwinLog Trail records will note this as incomplete. We recommend adding your EORI before sharing records with banks or customs authorities.",
          variant: "default",
        });
      } else {
        toast({
          title: "Profile saved",
          description: "You can now download TwinLog Trail records.",
        });
      }
    },
    onError: (err: any) => {
      toast({
        title: "Error saving profile",
        description: err.message || "Something went wrong",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: ProfileForm) => {
    saveMutation.mutate(data);
  };

  const isComplete = profileQuery.data?.profileComplete;

  return (
    <AppShell>
      <div className="max-w-2xl mx-auto px-4 py-8">
        <h1
          style={{ fontFamily: "var(--fh)", fontWeight: 900, fontSize: 28, letterSpacing: "0", color: "var(--t1)", marginBottom: 8 }}
          data-testid="text-profile-heading"
        >
          Company Profile
        </h1>
        <p style={{ fontFamily: "var(--fb)", fontSize: 13, color: "var(--t2)", marginBottom: 24 }} data-testid="text-profile-subtitle">
          Your company details appear on every TwinLog Trail compliance record.
          Required for PDF generation.
        </p>

        {isComplete && (
          <div
            style={{ display: "flex", alignItems: "center", gap: 8, borderRadius: 8, background: "var(--gbg)", padding: 12, marginBottom: 24 }}
            data-testid="banner-profile-complete"
          >
            <CheckCircle2 style={{ width: 18, height: 18, color: "var(--green)", flexShrink: 0 }} />
            <p style={{ fontSize: 13, color: "var(--green)", margin: 0 }}>Profile complete. You can download TwinLog Trail records.</p>
          </div>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            <FormField
              control={form.control}
              name="companyName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Company Name *</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="e.g. Acme Trading Ltd" data-testid="input-company-name" />
                  </FormControl>
                  <FormDescription>As it appears on your Certificate of Incorporation</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="registeredAddress"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Registered Office Address *</FormLabel>
                  <FormControl>
                    <Textarea {...field} rows={3} placeholder="Full address including postcode/ZIP" data-testid="input-registered-address" />
                  </FormControl>
                  <FormDescription>Full address including postcode/ZIP. Must match incorporation documents.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="countryIso2"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Country of Registration *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger data-testid="select-country">
                        <SelectValue placeholder="Select a country" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {COUNTRIES.map((c) => (
                        <SelectItem key={c.iso2} value={c.iso2} data-testid={`option-country-${c.iso2}`}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="vatNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>VAT Number</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="e.g. GB123456789" data-testid="input-vat-number" />
                  </FormControl>
                  <FormDescription>Used for EU/UK trade records.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="eoriNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>EORI Number</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="e.g. GB205672212000" data-testid="input-eori-number" />
                  </FormControl>
                  <FormDescription>
                    Economic Operators Registration and Identification number.
                    Required by UK/EU customs to track every shipment.
                    Without this, your compliance record cannot reference your customs identity.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div
              style={{ background: "var(--blue-dim)", borderRadius: 12, padding: 16 }}
            >
              <div style={{ display: "flex", gap: 12 }}>
                <Info style={{ width: 18, height: 18, color: "var(--blue)", flexShrink: 0, marginTop: 2 }} />
                <div>
                  <p style={{ fontSize: 13, fontWeight: 600, color: "var(--blue)", marginBottom: 4 }}>Why EORI matters</p>
                  <p style={{ fontSize: 13, color: "var(--t2)", margin: 0, lineHeight: 1.6 }}>
                    Your EORI number is what customs authorities use to identify you on every import declaration.
                    A compliance record without an EORI cannot be linked to your customs activity.
                    UK traders: apply at gov.uk/eori. EU traders: apply via your national customs authority.
                  </p>
                </div>
              </div>
            </div>

            <FormField
              control={form.control}
              name="contactEmail"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contact Email</FormLabel>
                  <FormControl>
                    <Input {...field} type="email" placeholder="trade@yourcompany.com" data-testid="input-contact-email" />
                  </FormControl>
                  <FormDescription>Appears on the compliance record as the responsible party contact.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button
              type="submit"
              disabled={saveMutation.isPending}
              className="w-full"
              data-testid="button-save-profile"
            >
              <Save className="w-4 h-4 mr-2" />
              {saveMutation.isPending ? "Saving..." : "Save Profile"}
            </Button>

            {saveMutation.isSuccess && !form.getValues("eoriNumber") && (
              <div
                style={{ display: "flex", alignItems: "center", gap: 8, borderRadius: 8, background: "var(--abg)", padding: 12 }}
                data-testid="banner-eori-warning"
              >
                <AlertTriangle style={{ width: 18, height: 18, color: "var(--amber)", flexShrink: 0 }} />
                <p style={{ fontSize: 13, color: "var(--amber)", margin: 0 }}>
                  No EORI number saved. Your TwinLog Trail records will note this as incomplete.
                  We recommend adding your EORI before sharing records with banks or customs authorities.
                </p>
              </div>
            )}
          </form>
        </Form>
      </div>
    </AppShell>
  );
}
