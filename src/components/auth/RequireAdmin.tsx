import { ReactNode, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

interface RequireAdminProps {
  children: ReactNode;
}

export default function RequireAdmin({ children }: RequireAdminProps) {
  const [checking, setChecking] = useState(true);
  const [allowed, setAllowed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    let active = true;

    const init = async () => {
      try {
        // Ensure we listen before fetching to not miss events
        const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
          // If user logs out while on admin, redirect to auth
          if (!session?.user) {
            navigate(`/auth?redirect=${encodeURIComponent(location.pathname)}`);
          }
        });

        const { data: sessionData } = await supabase.auth.getSession();
        const user = sessionData.session?.user;

        if (!user) {
          navigate(`/auth?redirect=${encodeURIComponent(location.pathname)}`);
          return;
        }

        // Check role via RLS-safe table
        const { data: role, error } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", user.id)
          .eq("role", "admin")
          .maybeSingle();

        if (error) {
          // Fall back to RPC if needed
          const { data: has, error: fnErr } = await supabase.rpc("has_role", {
            _user_id: user.id,
            _role: "admin",
          });
          if (fnErr) throw fnErr;
          if (active) setAllowed(Boolean(has));
        } else {
          if (active) setAllowed(Boolean(role));
        }

        if (active) setChecking(false);

        return () => {
          listener.subscription.unsubscribe();
        };
      } catch (_e) {
        if (active) {
          setAllowed(false);
          setChecking(false);
          navigate(`/auth?redirect=${encodeURIComponent(location.pathname)}`);
        }
      }
    };

    init();

    return () => {
      active = false;
    };
  }, [location.pathname, navigate]);

  if (checking) {
    return (
      <div className="min-h-screen bg-gradient-background flex items-center justify-center">
        <p className="text-muted-foreground">Checking permissions…</p>
      </div>
    );
  }

  if (!allowed) return null; // Redirect handled above

  return <>{children}</>;
}
