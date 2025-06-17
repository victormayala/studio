
"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/icons/Logo";
import { EmbedCodeModal } from "@/components/customizer/EmbedCodeModal";
import { CodeXml, LayoutDashboard, Settings, X as CloseIcon } from "lucide-react"; // Removed LogOut
import { useAuth } from '@/contexts/AuthContext';
// import { useToast } from '@/hooks/use-toast'; // No longer directly used for sign out toast
import { usePathname, useSearchParams, useRouter } from 'next/navigation';

export default function AppHeader() {
  const [isEmbedModalOpen, setIsEmbedModalOpen] = useState(false);
  const { user } = useAuth(); // Removed signOut and authIsLoading as signout is now part of customizer close
  // const { toast } = useToast(); // Removed
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter(); // Kept router for dashboard link

  const [customizerShareUrlPath, setCustomizerShareUrlPath] = useState<string | null>(null);
  const [currentProductId, setCurrentProductId] = useState<string | null>(null);

  useEffect(() => {
    const productIdFromParams = searchParams.get('productId');
    setCurrentProductId(productIdFromParams);

    if (pathname.startsWith('/customizer')) {
      if (productIdFromParams) {
        let urlPath = `/customizer?productId=${productIdFromParams}`;
        if (user?.uid) {
          urlPath += `&userId=${user.uid}`;
        }
        setCustomizerShareUrlPath(urlPath);
      } else {
        let urlPath = `/customizer`;
        if (user?.uid) {
          urlPath += `?userId=${user.uid}`;
        }
         setCustomizerShareUrlPath(urlPath);
      }
    } else {
      setCustomizerShareUrlPath(null);
    }
  }, [pathname, searchParams, user]);


  const handleAttemptCloseCustomizer = () => {
    // Dispatch a custom event that the CustomizerPage will listen for
    window.dispatchEvent(new CustomEvent('attemptCloseCustomizer'));
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
            onClick={handleAttemptCloseCustomizer} // Changed from direct navigation/signout
            variant="outline"
            size="icon"
            className="hover:bg-destructive/10 hover:text-destructive"
            title="Close Customizer"
            aria-label="Close Customizer"
          >
            <CloseIcon className="h-5 w-5" />
          </Button>
        )}
        {/* Sign Out button for non-customizer app pages - assuming AuthContext handles sign out now */}
        {/* If a global sign out is needed here, it should call useAuth().signOut() */}
      </div>
      <EmbedCodeModal
        isOpen={isEmbedModalOpen}
        onOpenChange={setIsEmbedModalOpen}
        customizerUrlPath={customizerShareUrlPath}
      />
    </header>
  );
}
