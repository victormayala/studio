
"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/icons/Logo";
import { EmbedCodeModal } from "@/components/customizer/EmbedCodeModal";
import { CodeXml, LayoutDashboard, LogOut, Settings, X as CloseIcon } from "lucide-react";
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { usePathname, useSearchParams, useRouter } from 'next/navigation';

export default function AppHeader() {
  const [isEmbedModalOpen, setIsEmbedModalOpen] = useState(false);
  const { user, signOut, isLoading: authIsLoading } = useAuth();
  const { toast } = useToast();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();

  const [customizerShareUrlPath, setCustomizerShareUrlPath] = useState<string | null>(null);
  const [currentProductId, setCurrentProductId] = useState<string | null>(null);

  useEffect(() => {
    const productIdFromParams = searchParams.get('productId');
    setCurrentProductId(productIdFromParams);

    if (pathname.startsWith('/customizer')) {
      if (productIdFromParams) {
        let urlPath = `/customizer?productId=${productIdFromParams}`;
        if (user?.uid) { // Changed user.id to user.uid
          urlPath += `&userId=${user.uid}`; // Changed user.id to user.uid
        }
        setCustomizerShareUrlPath(urlPath);
      } else {
        let urlPath = `/customizer`;
        if (user?.uid) { // Changed user.id to user.uid
          urlPath += `?userId=${user.uid}`; // Changed user.id to user.uid
        }
         setCustomizerShareUrlPath(urlPath);
      }
    } else {
      setCustomizerShareUrlPath(null);
    }
  }, [pathname, searchParams, user]);


  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error("Sign out error:", error);
      toast({ title: "Sign Out Failed", variant: "destructive" });
    }
  };

  const handleCloseCustomizer = () => {
    // Navigate to dashboard or a relevant previous page
    router.push(user ? '/dashboard' : '/');
  };

  const showCustomizerSpecificButtons = pathname.startsWith('/customizer');

  return (
    <header className="flex items-center justify-between h-16 border-b bg-card shadow-sm px-4 md:px-6 w-full flex-shrink-0">
      <div className="flex items-center gap-4">
        <Link href={user ? "/dashboard" : "/"} aria-label="Go to main app page">
            <Logo />
        </Link>
      </div>
      <div className="flex items-center gap-2">
        {showCustomizerSpecificButtons && (
          <Button
            onClick={() => setIsEmbedModalOpen(true)}
            variant="outline"
            className="hover:bg-accent hover:text-accent-foreground"
            disabled={!customizerShareUrlPath}
          >
            <CodeXml className="mr-2 h-4 w-4" />
            Embed Code
          </Button>
        )}
        {showCustomizerSpecificButtons && currentProductId && (
          <Button asChild variant="outline" className="hover:bg-accent hover:text-accent-foreground">
            <Link href={`/dashboard/products/${currentProductId}/options`}>
              <Settings className="mr-2 h-4 w-4" />
              Product Options
            </Link>
          </Button>
        )}
        <Button asChild variant="outline" className="hover:bg-accent hover:text-accent-foreground">
          <Link href="/dashboard">
            <LayoutDashboard className="mr-2 h-4 w-4" />
            Dashboard
          </Link>
        </Button>
        {user && showCustomizerSpecificButtons && (
          <Button
            onClick={handleCloseCustomizer}
            variant="outline"
            size="icon"
            className="hover:bg-destructive/10 hover:text-destructive"
            title="Close Customizer"
            aria-label="Close Customizer"
          >
            <CloseIcon className="h-5 w-5" />
          </Button>
        )}
        {user && !showCustomizerSpecificButtons && (
          <Button
            onClick={handleSignOut}
            variant="outline"
            className="hover:bg-destructive/10 hover:text-destructive"
            disabled={authIsLoading}
          >
            <LogOut className="mr-2 h-4 w-4" />
            Sign Out
          </Button>
        )}
      </div>
      <EmbedCodeModal
        isOpen={isEmbedModalOpen}
        onOpenChange={setIsEmbedModalOpen}
        customizerUrlPath={customizerShareUrlPath}
      />
    </header>
  );
}
