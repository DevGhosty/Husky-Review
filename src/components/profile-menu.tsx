import { Link, useLocation } from 'react-router-dom';
import {
  Bell,
  BookmarkCheck,
  ChevronDown,
  Chrome,
  LayoutDashboard,
  Loader2,
  LogOut,
  Palette,
  ShieldCheck,
  Sparkles,
  Target,
  UserRound,
} from 'lucide-react';
import { useAuth0 } from '@auth0/auth0-react';
import { useState } from 'react';
import { getAuth0LoginOptions, getAuth0PopupOptions, shouldFallbackToRedirect } from '../auth/auth0-config';
import { useReview } from '../context/review-context';
import { useProfileSettings } from '../context/profile-settings-context';
import { profileSectionHref, profileSections } from '../lib/profile-settings';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';

const sectionIcons = {
  overview: UserRound,
  preferences: Sparkles,
  notifications: Bell,
  'career-goals': Target,
  appearance: Palette,
  privacy: ShieldCheck,
} as const;

const triggerClass =
  'flex items-center gap-2 rounded-full border border-border bg-card px-2 py-1.5 shadow-soft ring-1 ring-border/50 transition-[box-shadow,transform] duration-200 ease-out hover:-translate-y-0.5 hover:shadow-card motion-safe:hover:-translate-y-0.5 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background active:scale-[0.98]';

export function ProfileMenu() {
  const location = useLocation();
  const { settings } = useProfileSettings();
  const { resetReview } = useReview();
  const { isAuthenticated, isLoading, loginWithPopup, loginWithRedirect, user, logout } = useAuth0();
  const [isSigningIn, setIsSigningIn] = useState(false);

  const displayName = user?.name || user?.nickname || settings.displayName;
  const subtitle = user?.email ? user.email : user ? 'Signed in with Google' : 'Sign in with your @uw.edu Google account';

  const initials = displayName
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const returnTo = location.pathname + location.search + location.hash;

  async function startGoogleSignIn() {
    setIsSigningIn(true);

    try {
      await loginWithPopup(getAuth0PopupOptions());
    } catch (error) {
      if (shouldFallbackToRedirect(error)) {
        await loginWithRedirect(getAuth0LoginOptions(returnTo));
      }
    } finally {
      setIsSigningIn(false);
    }
  }

  function signOut() {
    resetReview();
    logout({ logoutParams: { returnTo: window.location.origin } });
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button type="button" aria-label="Open profile menu" className={triggerClass}>
          <Avatar className="size-8">
            {user?.picture ? <AvatarImage src={user.picture} alt={displayName} /> : null}
            <AvatarFallback className="bg-primary/10 text-sm font-black text-primary">{initials}</AvatarFallback>
          </Avatar>
          <ChevronDown className="hidden size-4 text-primary sm:block" aria-hidden="true" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-72 p-2.5">
        <div className="rounded-xl border border-border/70 bg-muted/35 px-3 py-3 shadow-soft">
          <p className="text-sm font-black text-foreground">{displayName}</p>
          <p className="mt-0.5 text-xs font-medium text-muted-foreground">{subtitle}</p>
        </div>

        {isAuthenticated ? (
          <>
            <DropdownMenuLabel className="mt-3 px-1">Profile</DropdownMenuLabel>
            <DropdownMenuGroup>
              {profileSections.map((section) => {
                const Icon = sectionIcons[section.id];
                return (
                  <DropdownMenuItem key={section.id} asChild>
                    <Link to={profileSectionHref(section.id)}>
                      <Icon className="size-4 text-primary" aria-hidden />
                      {section.label}
                    </Link>
                  </DropdownMenuItem>
                );
              })}
            </DropdownMenuGroup>
          </>
        ) : null}

        <DropdownMenuSeparator />

        <DropdownMenuLabel>App</DropdownMenuLabel>
        <DropdownMenuGroup>
          <DropdownMenuItem asChild>
            <Link to="/app">
              <LayoutDashboard className="size-4 text-primary" aria-hidden />
              Dashboard
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link to="/app/saved-reviews">
              <BookmarkCheck className="size-4 text-primary" aria-hidden />
              Saved Reviews
            </Link>
          </DropdownMenuItem>
        </DropdownMenuGroup>

        <DropdownMenuSeparator className="my-2" />

        {isAuthenticated ? (
          <DropdownMenuItem
            className="menu-panel-action h-auto flex-col items-start gap-1 py-3"
            onSelect={(event) => {
              event.preventDefault();
              signOut();
            }}
          >
            <span className="flex items-center gap-2">
              <LogOut className="size-4" aria-hidden />
              Sign out
            </span>
            <span className="pl-6 text-xs font-medium text-muted-foreground">Clears your Auth0 session for this browser.</span>
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem
            className="menu-panel-action h-auto flex-col items-start gap-1 py-3"
            disabled={isLoading || isSigningIn}
            onSelect={(event) => {
              event.preventDefault();
              void startGoogleSignIn();
            }}
          >
            <span className="flex items-center gap-2">
              {isSigningIn ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <Chrome className="size-4" aria-hidden />}
              Continue with Google
            </span>
            <span className="pl-6 text-xs font-medium text-muted-foreground">Use your @uw.edu account.</span>
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
