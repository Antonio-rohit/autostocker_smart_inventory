import { Link } from "react-router";
import { AlertTriangle, Info, AlertCircle, Clock, Package, ArrowRight, Eye, EyeOff } from "lucide-react";
import { motion } from "motion/react";
import { useAppData } from "../context/AppDataContext";

export function Alerts() {
  const { notifications, loading, error, markNotificationRead, ignoreNotification } = useAppData();

  if (loading && notifications.length === 0) {
    return <div className="text-slate-600 dark:text-slate-400">Loading alerts...</div>;
  }

  if (error && notifications.length === 0) {
    return <div className="text-red-600 dark:text-red-400">{error}</div>;
  }

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.max(0, Math.floor(diffMs / 60000));
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case "critical":
        return AlertCircle;
      case "warning":
        return AlertTriangle;
      case "info":
      default:
        return Info;
    }
  };

  const getAlertColors = (type: string, isRead?: boolean) => {
    const commonState = isRead ? "opacity-70" : "";

    switch (type) {
      case "critical":
        return {
          wrapper: `border-red-500 bg-red-50 dark:bg-red-900/20 ${commonState}`,
          icon: "text-red-600 dark:text-red-400",
          iconBg: "bg-red-100 dark:bg-red-900/30",
        };
      case "warning":
        return {
          wrapper: `border-amber-500 bg-amber-50 dark:bg-amber-900/20 ${commonState}`,
          icon: "text-amber-600 dark:text-amber-400",
          iconBg: "bg-amber-100 dark:bg-amber-900/30",
        };
      default:
        return {
          wrapper: `border-blue-500 bg-blue-50 dark:bg-blue-900/20 ${commonState}`,
          icon: "text-blue-600 dark:text-blue-400",
          iconBg: "bg-blue-100 dark:bg-blue-900/30",
        };
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800";
      case "medium":
        return "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800";
      case "low":
      default:
        return "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800";
    }
  };

  const groupedNotifications = {
    critical: notifications.filter((n) => n.type === "critical"),
    warning: notifications.filter((n) => n.type === "warning"),
    info: notifications.filter((n) => n.type === "info"),
  };

  const unreadCount = notifications.filter((notification) => !notification.isRead).length;

  const stats = [
    { label: "Unread Alerts", value: unreadCount, color: "blue" },
    { label: "Critical Alerts", value: groupedNotifications.critical.length, color: "red" },
    { label: "Warnings", value: groupedNotifications.warning.length, color: "amber" },
  ];

  const sections = [
    { key: "critical", title: "Critical Alerts", icon: AlertCircle, items: groupedNotifications.critical, delay: 0.3 },
    { key: "warning", title: "Warnings", icon: AlertTriangle, items: groupedNotifications.warning, delay: 0.5 },
    { key: "info", title: "Information", icon: Info, items: groupedNotifications.info, delay: 0.7 },
  ];

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">Alerts & Notifications</h1>
        <p className="text-slate-600 dark:text-slate-400 mt-1">Track stock warnings, mark them as read, or ignore products that do not need restocking.</p>
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5 shadow-sm"
          >
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">{stat.label}</p>
            <p
              className={`text-3xl font-bold ${
                stat.color === "red"
                  ? "text-red-600 dark:text-red-400"
                  : stat.color === "amber"
                    ? "text-amber-600 dark:text-amber-400"
                    : "text-blue-600 dark:text-blue-400"
              }`}
            >
              {stat.value}
            </p>
          </motion.div>
        ))}
      </div>

      {notifications.length === 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <AlertTriangle className="mx-auto mb-4 h-12 w-12 text-slate-400" />
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">No active alerts</h2>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">Ignored alerts are removed from this list and from the dashboard alert count.</p>
        </motion.div>
      )}

      {sections.map((section) => {
        if (section.items.length === 0) return null;
        const SectionIcon = section.icon;

        return (
          <motion.div
            key={section.key}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: section.delay }}
          >
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <SectionIcon className="w-5 h-5" />
              {section.title}
            </h2>
            <div className="space-y-3">
              {section.items.map((notification, index) => {
                const Icon = getAlertIcon(notification.type);
                const colors = getAlertColors(notification.type, notification.isRead);

                return (
                  <motion.div
                    key={notification.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: section.delay + 0.1 + index * 0.1 }}
                    whileHover={{ scale: 1.01 }}
                    onClick={() => markNotificationRead(notification.id)}
                    className={`cursor-pointer border-l-4 ${colors.wrapper} rounded-xl p-5 shadow-sm hover:shadow-md transition-all`}
                  >
                    <div className="flex items-start gap-4">
                      <div className={`p-3 rounded-lg ${colors.iconBg} flex-shrink-0`}>
                        <Icon className={`w-5 h-5 ${colors.icon}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-start justify-between gap-2 mb-2">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-slate-900 dark:text-white">{notification.title}</h3>
                            {!notification.isRead && (
                              <span className="rounded-full bg-blue-600 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
                                New
                              </span>
                            )}
                          </div>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium border flex-shrink-0 ${getPriorityBadge(notification.priority)}`}>
                            {notification.priority}
                          </span>
                        </div>
                        <p className="text-sm text-slate-700 dark:text-slate-300 mb-3">{notification.message}</p>
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
                            {notification.product && (
                              <span className="flex items-center gap-1">
                                <Package className="w-3 h-3" />
                                {notification.product}
                              </span>
                            )}
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {formatTimestamp(notification.timestamp)}
                            </span>
                            <span className="flex items-center gap-1">
                              {notification.isRead ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                              {notification.isRead ? "Read" : "Unread"}
                            </span>
                          </div>
                          <div className="flex flex-wrap items-center gap-2">
                            <button
                              type="button"
                              onClick={(event) => {
                                event.stopPropagation();
                                markNotificationRead(notification.id);
                              }}
                              className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-700 transition-colors hover:bg-slate-100 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700"
                            >
                              Mark as read
                            </button>
                            <button
                              type="button"
                              onClick={(event) => {
                                event.stopPropagation();
                                ignoreNotification(notification.id);
                              }}
                              className="rounded-lg border border-amber-300 px-3 py-1.5 text-sm text-amber-700 transition-colors hover:bg-amber-50 dark:border-amber-700 dark:text-amber-300 dark:hover:bg-amber-900/20"
                            >
                              Ignore
                            </button>
                            {notification.productId && (
                              <Link
                                to={`/app/product/${notification.productId}`}
                                onClick={() => markNotificationRead(notification.id)}
                                className="text-sm text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                              >
                                View Product
                                <ArrowRight className="w-3 h-3" />
                              </Link>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
