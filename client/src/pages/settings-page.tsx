import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Card as CardComponent, CardContent, CardDescription, CardHeader, CardTitle, CardProps as CardComponentProps } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { MessageSquare, Upload, Plus } from "lucide-react";
import { SiGooglecalendar } from "react-icons/si";
import { SiFacebook, SiInstagram, SiSnapchat } from "react-icons/si";
import { Setting, User, Customer, SocialMediaAccount, StoreSetting } from "@shared/schema";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

// إعداد مخططات التحقق (Validation Schemas)
const whatsappSchema = z.object({
  WHATSAPP_API_TOKEN: z.string().min(1, "رمز الوصول مطلوب"),
  WHATSAPP_BUSINESS_PHONE_NUMBER: z.string().min(1, "رقم الهاتف مطلوب"),
});

const googleCalendarSchema = z.object({
  GOOGLE_CLIENT_ID: z.string().min(1, "معرف العميل مطلوب"),
  GOOGLE_CLIENT_SECRET: z.string().min(1, "الرمز السري مطلوب"),
});

const socialMediaSchema = z.object({
  FACEBOOK_APP_ID: z.string().min(1, "معرف التطبيق مطلوب"),
  FACEBOOK_APP_SECRET: z.string().min(1, "الرمز السري مطلوب"),
  INSTAGRAM_ACCESS_TOKEN: z.string().min(1, "رمز الوصول مطلوب"),
});

const socialMediaAccountSchema = z.object({
  platform: z.enum(['facebook', 'instagram', 'snapchat']),
  username: z.string().min(1, "اسم المستخدم مطلوب"),
  password: z.string().min(1, "كلمة المرور مطلوبة"),
});

type WhatsAppSettings = z.infer<typeof whatsappSchema>;
type GoogleCalendarSettings = z.infer<typeof googleCalendarSchema>;
type SocialMediaSettings = z.infer<typeof socialMediaSchema>;
type SocialMediaAccountFormData = z.infer<typeof socialMediaAccountSchema>;

interface InsertThemeSetting {
  theme: "light" | "dark" | "system";
  font: string;
  fontSize: "small" | "medium" | "large";
  direction: "rtl" | "ltr";
}

const CustomCard = ({ className, ...props }: CardComponentProps) => (
  <CardComponent className={cn("w-full", className)} {...props} />
);

export default function SettingsPage() {
  const { toast } = useToast();

  const { data: settings } = useQuery<Setting[]>({
    queryKey: ["/api/settings"],
  });

  const { data: storeSettings } = useQuery<StoreSetting>({
    queryKey: ["/api/store-settings"],
  });

  const whatsappForm = useForm<WhatsAppSettings>({
    resolver: zodResolver(whatsappSchema),
    defaultValues: {
      WHATSAPP_API_TOKEN: settings?.find(s => s.key === "WHATSAPP_API_TOKEN")?.value || "",
      WHATSAPP_BUSINESS_PHONE_NUMBER: settings?.find(s => s.key === "WHATSAPP_BUSINESS_PHONE_NUMBER")?.value || "",
    },
  });

  const googleCalendarForm = useForm<GoogleCalendarSettings>({
    resolver: zodResolver(googleCalendarSchema),
    defaultValues: {
      GOOGLE_CLIENT_ID: settings?.find(s => s.key === "GOOGLE_CLIENT_ID")?.value || "",
      GOOGLE_CLIENT_SECRET: settings?.find(s => s.key === "GOOGLE_CLIENT_SECRET")?.value || "",
    },
  });

  const socialMediaForm = useForm<SocialMediaSettings>({
    resolver: zodResolver(socialMediaSchema),
    defaultValues: {
      FACEBOOK_APP_ID: settings?.find(s => s.key === "FACEBOOK_APP_ID")?.value || "",
      FACEBOOK_APP_SECRET: settings?.find(s => s.key === "FACEBOOK_APP_SECRET")?.value || "",
      INSTAGRAM_ACCESS_TOKEN: settings?.find(s => s.key === "INSTAGRAM_ACCESS_TOKEN")?.value || "",
    },
  });

  const saveSettingsMutation = useMutation({
    mutationFn: async (data: { key: string; value: string }) => {
      const res = await apiRequest("POST", "/api/settings", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings"] });
      toast({
        title: "تم حفظ الإعدادات",
        description: "تم تحديث إعدادات التكامل بنجاح",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "خطأ في حفظ الإعدادات",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const storeSettingsMutation = useMutation({
    mutationFn: async (data: { storeName: string; storeLogo?: string }) => {
      const res = await apiRequest("POST", "/api/store-settings", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/store-settings"] });
      toast({
        title: "تم حفظ إعدادات المتجر",
        description: "تم تحديث معلومات المتجر بنجاح",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "خطأ في حفظ الإعدادات",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        storeSettingsMutation.mutate({
          storeName: storeSettings?.storeName || "",
          storeLogo: reader.result as string,
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const { data: socialAccounts } = useQuery<SocialMediaAccount[]>({
    queryKey: ["/api/social-accounts"],
  });

  const accountMutation = useMutation({
    mutationFn: async (data: SocialMediaAccountFormData) => {
      const res = await apiRequest("POST", "/api/social-accounts", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/social-accounts"] });
      toast({
        title: "تم حفظ الحساب",
        description: "تم إضافة حساب التواصل الاجتماعي بنجاح",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "خطأ في حفظ الحساب",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const form = useForm<SocialMediaAccountFormData>({
    resolver: zodResolver(socialMediaAccountSchema),
    defaultValues: {
      platform: 'facebook',
      username: '',
      password: '',
    },
  });

  const onWhatsAppSubmit = async (data: WhatsAppSettings) => {
    for (const [key, value] of Object.entries(data)) {
      await saveSettingsMutation.mutateAsync({ key, value });
    }
  };

  const onGoogleCalendarSubmit = async (data: GoogleCalendarSettings) => {
    for (const [key, value] of Object.entries(data)) {
      await saveSettingsMutation.mutateAsync({ key, value });
    }
  };

  const onSocialMediaSubmit = async (data: SocialMediaSettings) => {
    for (const [key, value] of Object.entries(data)) {
      await saveSettingsMutation.mutateAsync({ key, value });
    }
  };

  const themeMutation = useMutation({
    mutationFn: async (data: InsertThemeSetting) => {
      const res = await apiRequest("POST", "/api/theme", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/theme"] });
      toast({
        title: "تم حفظ الإعدادات",
        description: "تم تحديث إعدادات المظهر بنجاح",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "خطأ في حفظ الإعدادات",
        description: error.message,
        variant: "destructive",
      });
    },
  });


  return (
    <DashboardLayout>
      <div className="space-y-8">
        <h1 className="text-3xl font-bold">إعدادات النظام</h1>

        <div className="grid gap-6">
          <CustomCard>
            <CardHeader>
              <div className="flex items-center space-x-4">
                <div className="flex gap-2">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-8 w-8 text-primary"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <circle cx="12" cy="12" r="5" />
                    <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
                  </svg>
                </div>
                <div>
                  <CardTitle>إعدادات المظهر</CardTitle>
                  <CardDescription>
                    تخصيص مظهر النظام والخطوط
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>المظهر</Label>
                <Select
                  onValueChange={(value) => {
                    themeMutation.mutate({
                      theme: value as "light" | "dark" | "system",
                      font: "Cairo",
                      fontSize: "medium",
                      direction: "rtl",
                    });
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="اختر المظهر" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">فاتح</SelectItem>
                    <SelectItem value="dark">داكن</SelectItem>
                    <SelectItem value="system">تلقائي</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>الخط</Label>
                <Select
                  onValueChange={(value) => {
                    themeMutation.mutate({
                      theme: "light",
                      font: value,
                      fontSize: "medium",
                      direction: "rtl",
                    });
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="اختر الخط" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Cairo">Cairo</SelectItem>
                    <SelectItem value="Tajawal">Tajawal</SelectItem>
                    <SelectItem value="Almarai">Almarai</SelectItem>
                    <SelectItem value="IBM Plex Sans Arabic">IBM Plex Sans Arabic</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>حجم الخط</Label>
                <Select
                  onValueChange={(value) => {
                    themeMutation.mutate({
                      theme: "light",
                      font: "Cairo",
                      fontSize: value as "small" | "medium" | "large",
                      direction: "rtl",
                    });
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="اختر حجم الخط" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="small">صغير</SelectItem>
                    <SelectItem value="medium">متوسط</SelectItem>
                    <SelectItem value="large">كبير</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>اتجاه النص</Label>
                <Select
                  onValueChange={(value) => {
                    themeMutation.mutate({
                      theme: "light",
                      font: "Cairo",
                      fontSize: "medium",
                      direction: value as "rtl" | "ltr",
                    });
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="اختر اتجاه النص" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="rtl">من اليمين إلى اليسار</SelectItem>
                    <SelectItem value="ltr">من اليسار إلى اليمين</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </CustomCard>
          <CustomCard>
            <CardHeader>
              <div className="flex items-center space-x-4">
                <div className="flex gap-2">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-8 w-8 text-primary"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                    <polyline points="9 22 9 12 15 12 15 22" />
                  </svg>
                </div>
                <div>
                  <CardTitle>إعدادات المتجر</CardTitle>
                  <CardDescription>
                    إدارة معلومات المتجر والشعار
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>اسم المتجر</Label>
                <Input
                  placeholder="أدخل اسم المتجر"
                  defaultValue={storeSettings?.storeName || ""}
                  onChange={(e) => {
                    const newValue = e.target.value;
                    storeSettingsMutation.mutate({
                      storeName: newValue,
                      storeLogo: storeSettings?.storeLogo || "",
                    });
                  }}
                />
              </div>

              <div className="space-y-2">
                <Label>شعار المتجر</Label>
                <div className="flex flex-col items-center gap-4 p-4 border-2 border-dashed rounded-lg">
                  {storeSettings?.storeLogo ? (
                    <div className="relative">
                      <img
                        src={storeSettings.storeLogo}
                        alt="شعار المتجر"
                        className="max-w-[200px] max-h-[200px] object-contain"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        className="absolute top-0 right-0 mt-2 mr-2"
                        onClick={() => {
                          storeSettingsMutation.mutate({
                            storeName: storeSettings.storeName || "",
                            storeLogo: "",
                          });
                        }}
                      >
                        حذف
                      </Button>
                    </div>
                  ) : (
                    <div className="text-center">
                      <Upload className="mx-auto h-12 w-12 text-muted-foreground" />
                      <p className="mt-2 text-sm text-muted-foreground">
                        اسحب وأفلت الشعار هنا أو اضغط للتحميل
                      </p>
                    </div>
                  )}

                  <div className="mt-4">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      className="hidden"
                      id="logo-upload"
                    />
                    <Button
                      variant="outline"
                      onClick={() => {
                        const input = document.getElementById("logo-upload") as HTMLInputElement;
                        if (input) {
                          input.click();
                        }
                      }}
                    >
                      <Upload className="h-4 w-4 ml-2" />
                      تحميل شعار جديد
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </CustomCard>

          <CustomCard>
            <CardHeader>
              <div className="flex items-center space-x-4">
                <MessageSquare className="h-8 w-8 text-green-500" />
                <div>
                  <CardTitle>إعدادات WhatsApp</CardTitle>
                  <CardDescription>
                    قم بإعداد التكامل مع WhatsApp Business API لإرسال الإشعارات التلقائية
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Form {...whatsappForm}>
                <form onSubmit={whatsappForm.handleSubmit(onWhatsAppSubmit)} className="space-y-4">
                  <FormField
                    control={whatsappForm.control}
                    name="WHATSAPP_API_TOKEN"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>رمز الوصول (API Token)</FormLabel>
                        <FormControl>
                          <Input type="password" {...field} />
                        </FormControl>
                        <FormDescription>
                          يمكنك الحصول على رمز الوصول من لوحة تحكم WhatsApp Business
                        </FormDescription>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={whatsappForm.control}
                    name="WHATSAPP_BUSINESS_PHONE_NUMBER"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>رقم الهاتف</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormDescription>
                          رقم الهاتف المسجل في WhatsApp Business
                        </FormDescription>
                      </FormItem>
                    )}
                  />
                  <Button type="submit" disabled={saveSettingsMutation.isPending}>
                    {saveSettingsMutation.isPending ? "جاري الحفظ..." : "حفظ الإعدادات"}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </CustomCard>

          <CustomCard>
            <CardHeader>
              <div className="flex items-center space-x-4">
                <SiGooglecalendar className="h-8 w-8 text-blue-500" />
                <div>
                  <CardTitle>إعدادات Google Calendar</CardTitle>
                  <CardDescription>
                    قم بإعداد التكامل مع Google Calendar لمزامنة المواعيد
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Form {...googleCalendarForm}>
                <form onSubmit={googleCalendarForm.handleSubmit(onGoogleCalendarSubmit)} className="space-y-4">
                  <FormField
                    control={googleCalendarForm.control}
                    name="GOOGLE_CLIENT_ID"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>معرف العميل (Client ID)</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormDescription>
                          معرف العميل من Google Cloud Console
                        </FormDescription>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={googleCalendarForm.control}
                    name="GOOGLE_CLIENT_SECRET"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>الرمز السري (Client Secret)</FormLabel>
                        <FormControl>
                          <Input type="password" {...field} />
                        </FormControl>
                        <FormDescription>
                          الرمز السري للعميل من Google Cloud Console
                        </FormDescription>
                      </FormItem>
                    )}
                  />
                  <Button type="submit" disabled={saveSettingsMutation.isPending}>
                    {saveSettingsMutation.isPending ? "جاري الحفظ..." : "حفظ الإعدادات"}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </CustomCard>

          <CustomCard>
            <CardHeader>
              <div className="flex items-center space-x-4">
                <div className="flex gap-2">
                  <SiFacebook className="h-8 w-8 text-blue-600" />
                  <SiInstagram className="h-8 w-8 text-pink-600" />
                </div>
                <div>
                  <CardTitle>إعدادات وسائل التواصل الاجتماعي</CardTitle>
                  <CardDescription>
                    قم بإعداد التكامل مع فيسبوك وانستغرام لإدارة الحملات التسويقية
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Form {...socialMediaForm}>
                <form onSubmit={socialMediaForm.handleSubmit(onSocialMediaSubmit)} className="space-y-4">
                  <FormField
                    control={socialMediaForm.control}
                    name="FACEBOOK_APP_ID"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>معرف تطبيق فيسبوك (App ID)</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormDescription>
                          معرف التطبيق من Facebook Developers Console
                        </FormDescription>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={socialMediaForm.control}
                    name="FACEBOOK_APP_SECRET"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>الرمز السري لتطبيق فيسبوك (App Secret)</FormLabel>
                        <FormControl>
                          <Input type="password" {...field} />
                        </FormControl>
                        <FormDescription>
                          الرمز السري للتطبيق من Facebook Developers Console
                        </FormDescription>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={socialMediaForm.control}
                    name="INSTAGRAM_ACCESS_TOKEN"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>رمز وصول انستغرام (Access Token)</FormLabel>
                        <FormControl>
                          <Input type="password" {...field} />
                        </FormControl>
                        <FormDescription>
                          رمز الوصول لحساب انستغرام التجاري
                        </FormDescription>
                      </FormItem>
                    )}
                  />
                  <Button type="submit" disabled={saveSettingsMutation.isPending}>
                    {saveSettingsMutation.isPending ? "جاري الحفظ..." : "حفظ الإعدادات"}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </CustomCard>

          <CustomCard>
            <CardHeader>
              <div className="flex items-center space-x-4">
                <div className="flex gap-2">
                  <SiFacebook className="h-8 w-8 text-blue-600" />
                  <SiInstagram className="h-8 w-8 text-pink-600" />
                  <SiSnapchat className="h-8 w-8 text-yellow-500" />
                </div>
                <div>
                  <CardTitle>حسابات التواصل الاجتماعي</CardTitle>
                  <CardDescription>
                    قم بربط حسابات التواصل الاجتماعي لإدارة الحملات الإعلانية
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid gap-4">
                  {socialAccounts?.map((account) => (
                    <div key={account.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-4">
                        {account.platform === 'facebook' && <SiFacebook className="h-6 w-6 text-blue-600" />}
                        {account.platform === 'instagram' && <SiInstagram className="h-6 w-6 text-pink-600" />}
                        {account.platform === 'snapchat' && <SiSnapchat className="h-6 w-6 text-yellow-500" />}
                        <div>
                          <p className="font-medium">{account.accountName || account.accountId}</p>
                          <p className="text-sm text-muted-foreground">
                            {account.platform === 'facebook' ? 'فيسبوك' :
                              account.platform === 'instagram' ? 'انستغرام' : 'سناب شات'}
                          </p>
                        </div>
                      </div>
                      <Badge variant={account.status === 'active' ? 'default' : 'secondary'}>
                        {account.status === 'active' ? 'نشط' : 'غير نشط'}
                      </Badge>
                    </div>
                  ))}
                </div>

                <Dialog>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="h-4 w-4 ml-2" />
                      إضافة حساب جديد
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>إضافة حساب تواصل اجتماعي</DialogTitle>
                      <DialogDescription>
                        قم بإدخال معلومات الحساب للربط مع النظام
                      </DialogDescription>
                    </DialogHeader>

                    <Form {...form}>
                      <form onSubmit={form.handleSubmit((data) => accountMutation.mutate(data))} className="space-y-4">
                        <FormField
                          control={form.control}
                          name="platform"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>المنصة</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="اختر المنصة" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="facebook">فيسبوك</SelectItem>
                                  <SelectItem value="instagram">انستغرام</SelectItem>
                                  <SelectItem value="snapchat">سناب شات</SelectItem>
                                </SelectContent>
                              </Select>
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="username"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>اسم المستخدم / رقم الهاتف</FormLabel>
                              <FormControl>
                                <Input {...field} />
                              </FormControl>
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="password"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>كلمة المرور</FormLabel>
                              <FormControl>
                                <Input type="password" {...field} />
                              </FormControl>
                            </FormItem>
                          )}
                        />

                        <Button type="submit" disabled={accountMutation.isPending} className="w-full">
                          {accountMutation.isPending ? "جاري الحفظ..." : "حفظ الحساب"}
                        </Button>
                      </form>
                    </Form>
                  </DialogContent>
                </Dialog>
              </div>
            </CardContent>
          </CustomCard>
        </div>
      </div>
    </DashboardLayout>
  );
}