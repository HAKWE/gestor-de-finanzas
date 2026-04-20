import { useLanguage } from "../lib/language-context";
import { Layout } from "../components/layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { usePwaInstall } from "../hooks/use-pwa-install";
import { Smartphone, CheckCircle2 } from "lucide-react";

export default function Settings() {
  const { t, language, setLanguage } = useLanguage();
  const { canInstall, isInstalled, install } = usePwaInstall();

  return (
    <Layout>
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-2xl mx-auto w-full">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-bold tracking-tight">{t("nav.settings")}</h1>
          <p className="text-muted-foreground">Personnalisez votre expérience.</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Préférences</CardTitle>
            <CardDescription>Gérez la langue et l'affichage.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-3">
              <Label>Langue de l'application</Label>
              <Select value={language} onValueChange={(val: "fr"|"en") => setLanguage(val)}>
                <SelectTrigger>
                  <SelectValue placeholder="Choisir la langue" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fr">Français</SelectItem>
                  <SelectItem value="en">English</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Smartphone className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle>{language === "fr" ? "Application mobile" : "Mobile app"}</CardTitle>
                <CardDescription>
                  {language === "fr"
                    ? "Installez l'app sur votre téléphone pour y accéder sans navigateur."
                    : "Install the app on your phone to access it without a browser."}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isInstalled ? (
              <div className="flex items-center gap-3 text-green-600 dark:text-green-500">
                <CheckCircle2 className="h-5 w-5 shrink-0" />
                <p className="text-sm font-medium">
                  {language === "fr"
                    ? "L'application est déjà installée sur cet appareil."
                    : "The app is already installed on this device."}
                </p>
              </div>
            ) : canInstall ? (
              <Button onClick={install} className="w-full rounded-xl" size="lg">
                <Smartphone className="mr-2 h-5 w-5" />
                {language === "fr" ? "Installer l'application" : "Install app"}
              </Button>
            ) : (
              <div className="space-y-3 text-sm text-muted-foreground">
                <p className="font-medium text-foreground">
                  {language === "fr" ? "Comment installer :" : "How to install:"}
                </p>
                <div className="space-y-2">
                  <p>
                    <span className="font-semibold">iOS (Safari) : </span>
                    {language === "fr"
                      ? "Appuyez sur le bouton Partager "
                      : "Tap the Share button "}
                    <span className="font-mono bg-muted px-1 rounded">⬆</span>
                    {language === "fr"
                      ? ", puis \"Sur l'écran d'accueil\"."
                      : ", then \"Add to Home Screen\"."}
                  </p>
                  <p>
                    <span className="font-semibold">Android (Chrome) : </span>
                    {language === "fr"
                      ? "Appuyez sur le menu ⋮ puis \"Ajouter à l'écran d'accueil\"."
                      : "Tap the ⋮ menu then \"Add to Home screen\"."}
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
