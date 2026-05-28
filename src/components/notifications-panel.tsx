import { useMemo } from 'react';
import { Bell, BellOff, Loader2, Map, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useReview } from '../context/review-context';
import { cn } from '../lib/utils';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';

interface AppNotification {
  id: string;
  title: string;
  body: string;
  time: string;
  href?: string;
  icon: typeof Bell;
}

const iconButtonClass =
  'relative grid size-11 place-items-center rounded-full border border-border bg-card text-primary shadow-soft ring-1 ring-border/50 transition-[color,box-shadow,transform,border-color] duration-200 ease-out hover:-translate-y-0.5 hover:shadow-card motion-safe:hover:-translate-y-0.5 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background active:scale-[0.98]';

function useNotifications(): AppNotification[] {
  const { status, selectedIds, fileName } = useReview();

  return useMemo(() => {
    if (status === 'loading') {
      return [
        {
          id: 'analysis-running',
          title: 'Review in progress',
          body: 'Husky-Review is comparing your resume against the job posting and ranking UWB activities.',
          time: 'Just now',
          icon: Loader2,
        },
      ];
    }

    if (status === 'success') {
      const items: AppNotification[] = [
        {
          id: 'analysis-complete',
          title: 'Analysis complete',
          body: fileName
            ? `${fileName} has been reviewed against your posting.`
            : 'Your review finished. Recommendations are ready to browse.',
          time: '2 min ago',
          href: '/app/resources',
          icon: Sparkles,
        },
      ];

      if (selectedIds.length > 0) {
        items.push({
          id: 'roadmap-updated',
          title: 'Roadmap updated',
          body: `${selectedIds.length} recommendation${selectedIds.length === 1 ? '' : 's'} attached to your three-week plan.`,
          time: '2 min ago',
          href: '/app/roadmap',
          icon: Map,
        });
      }

      return items;
    }

    return [];
  }, [status, selectedIds.length, fileName]);
}

export function NotificationsPanel() {
  const notifications = useNotifications();
  const hasNotifications = notifications.length > 0;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={hasNotifications ? `${notifications.length} notifications` : 'Notifications'}
          aria-haspopup="dialog"
          className={iconButtonClass}
        >
          <Bell className="size-5" aria-hidden="true" />
          {hasNotifications && (
            <span className="absolute right-2.5 top-2.5 size-2 rounded-full bg-primary" aria-hidden="true" />
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="overflow-hidden">
        <div className="border-b border-border bg-muted/20 px-4 py-3">
          <h2 className="text-sm font-black text-foreground">Your notifications</h2>
          <p className="mt-0.5 text-xs font-medium text-muted-foreground">
            {hasNotifications ? `${notifications.length} update${notifications.length === 1 ? '' : 's'}` : 'Nothing new right now'}
          </p>
        </div>

        {hasNotifications ? (
          <ul className="grid max-h-80 gap-1.5 overflow-y-auto p-2.5" aria-label="Notification list">
            {notifications.map((notification) => {
              const Icon = notification.icon;
              const content = (
                <>
                  <span className="grid size-9 shrink-0 place-items-center rounded-xl border border-primary/15 bg-primary/10 text-primary">
                    <Icon className={cn('size-4', notification.id === 'analysis-running' && 'animate-spin')} aria-hidden />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold text-foreground">{notification.title}</span>
                    <span className="mt-1 block text-xs leading-5 text-muted-foreground">{notification.body}</span>
                    <span className="mt-2 block text-[0.6875rem] font-bold uppercase tracking-[0.08em] text-muted-foreground/80">
                      {notification.time}
                    </span>
                  </span>
                </>
              );

              return (
                <li key={notification.id}>
                  {notification.href ? (
                    <Link to={notification.href} className="menu-panel-action items-start py-3">
                      {content}
                    </Link>
                  ) : (
                    <div className="menu-panel-action items-start py-3">{content}</div>
                  )}
                </li>
              );
            })}
          </ul>
        ) : (
          <div className="flex flex-col items-center px-4 py-8 text-center">
            <span className="grid size-12 place-items-center rounded-2xl border border-border/80 bg-muted/40 text-muted-foreground shadow-soft">
              <BellOff className="size-5" aria-hidden />
            </span>
            <p className="mt-4 text-sm font-semibold text-foreground">No notifications yet</p>
            <p className="mt-1 max-w-[14rem] text-xs leading-5 text-muted-foreground">
              Run a review to see workspace updates here.
            </p>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
