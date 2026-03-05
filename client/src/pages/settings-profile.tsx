import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslation } from "react-i18next";
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
  einNumber: z.string().optional().or(z.literal("")),
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
  const { t } = useTranslation("settings");
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
      einNumber: "",
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
        einNumber: profileQuery.data.einNumber || "",
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
      const noEin = !savedProfile.einNumber;
      if (noEori && noEin) {
        toast({
          title: t("toast.saved"),
          description: t("toast.noCustomsId"),
          variant: "default",
        });
      } else if (noEori && !noEin) {
        toast({
          title: t("toast.saved"),
          description: t("toast.einSaved"),
        });
      } else if (!noEori && noEin) {
        toast({
          title: t("toast.saved"),
          description: t("toast.eoriSaved"),
        });
      } else {
        toast({
          title: t("toast.saved"),
          description: t("toast.allSaved"),
        });
      }
    },
    onError: (err: any) => {
      toast({
        title: t("toast.errorTitle"),
        description: err.message || t("toast.errorGeneric"),
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
      <div style={{ padding: "32px 24px 0" }}>
        <h1 style={{ fontFamily: "var(--fh)", fontSize: 28, fontWeight: 700, color: "var(--t1)", margin: 0 }}>
          {t("pageTitle")}
        </h1>
        <p style={{ fontSize: 13, color: "var(--t3)", marginTop: 6 }}>
          {t("pageSubtitle")}
        </p>
      </div>

      <div className="form-card" style={{ margin: "20px auto", maxWidth: 620, padding: "28px" }}>
        {isComplete && (
          <div
            style={{ display: "flex", alignItems: "center", gap: 8, borderRadius: 8, background: "var(--sage-xs)", border: "1px solid rgba(74,124,94,0.15)", padding: 12, marginBottom: 20 }}
            data-testid="banner-profile-complete"
          >
            <CheckCircle2 style={{ width: 18, height: 18, color: "var(--sage)", flexShrink: 0 }} />
            <p style={{ fontSize: 13, color: "var(--sage)", margin: 0 }}>{t("profileComplete")}</p>
          </div>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            <FormField
              control={form.control}
              name="companyName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("companyName.label")}</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder={t("companyName.placeholder")} data-testid="input-company-name" />
                  </FormControl>
                  <FormDescription>{t("companyName.description")}</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="registeredAddress"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("registeredAddress.label")}</FormLabel>
                  <FormControl>
                    <Textarea {...field} rows={3} placeholder={t("registeredAddress.placeholder")} data-testid="input-registered-address" />
                  </FormControl>
                  <FormDescription>{t("registeredAddress.description")}</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="countryIso2"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("country.label")}</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger data-testid="select-country">
                        <SelectValue placeholder={t("country.placeholder")} />
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
                  <FormLabel>{t("vat.label")}</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder={t("vat.placeholder")} data-testid="input-vat-number" />
                  </FormControl>
                  <FormDescription>{t("vat.description")}</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="eoriNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("eori.label")}</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder={t("eori.placeholder")} data-testid="input-eori-number" />
                  </FormControl>
                  <FormDescription>
                    {t("eori.description")}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div
              style={{ background: "var(--sage-xs)", borderRadius: 12, padding: 16, border: "1px solid rgba(74,124,94,0.12)" }}
            >
              <div style={{ display: "flex", gap: 12 }}>
                <Info style={{ width: 18, height: 18, color: "var(--sage)", flexShrink: 0, marginTop: 2 }} />
                <div>
                  <p style={{ fontSize: 13, fontWeight: 600, color: "var(--sage)", marginBottom: 4 }}>{t("eori.whyTitle")}</p>
                  <p style={{ fontSize: 13, color: "#555", margin: 0, lineHeight: 1.6 }}>
                    {t("eori.whyBody")}
                  </p>
                </div>
              </div>
            </div>

            <FormField
              control={form.control}
              name="einNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("ein.label")}</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder={t("ein.placeholder")} data-testid="input-ein-number" />
                  </FormControl>
                  <FormDescription>
                    {t("ein.description")}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div
              style={{ background: "var(--sage-xs)", borderRadius: 12, padding: 16, border: "1px solid rgba(74,124,94,0.12)" }}
            >
              <div style={{ display: "flex", gap: 12 }}>
                <Info style={{ width: 18, height: 18, color: "var(--sage)", flexShrink: 0, marginTop: 2 }} />
                <div>
                  <p style={{ fontSize: 13, fontWeight: 600, color: "var(--sage)", marginBottom: 4 }}>{t("ein.whyTitle")}</p>
                  <p style={{ fontSize: 13, color: "#555", margin: 0, lineHeight: 1.6 }}>
                    {t("ein.whyBody")}
                  </p>
                </div>
              </div>
            </div>

            <FormField
              control={form.control}
              name="contactEmail"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("contactEmail.label")}</FormLabel>
                  <FormControl>
                    <Input {...field} type="email" placeholder={t("contactEmail.placeholder")} data-testid="input-contact-email" />
                  </FormControl>
                  <FormDescription>{t("contactEmail.description")}</FormDescription>
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
              {saveMutation.isPending ? t("saving") : t("saveProfile")}
            </Button>

            {saveMutation.isSuccess && !form.getValues("eoriNumber") && !form.getValues("einNumber") && (
              <div
                style={{ display: "flex", alignItems: "center", gap: 8, borderRadius: 8, background: "rgba(234,179,8,0.08)", padding: 12 }}
                data-testid="banner-customs-id-warning"
              >
                <AlertTriangle style={{ width: 18, height: 18, color: "#b45309", flexShrink: 0 }} />
                <p style={{ fontSize: 13, color: "#b45309", margin: 0 }}>
                  {t("warning.noCustomsId")}
                </p>
              </div>
            )}
          </form>
        </Form>
      </div>
    </AppShell>

  );
}
