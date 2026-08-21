import {
  BuildingOffice2Icon,
  Cog6ToothIcon,
  HomeIcon,
  RectangleStackIcon,
  TicketIcon,
  UserGroupIcon,
} from "@heroicons/react/24/outline";
import { isAdmin, isClient, isClientPortalAdmin } from "../lib/roles";

export function prettifyPath(pathname, user) {
  const isClientUser = user?.role === "client";

  const map = isClientUser
    ? {
        "/": "Dashboard",
        "/tickets": "My Tickets",
        "/settings": "Settings",
      }
    : {
        "/": "Dashboard",
        "/clients": "Clients",
        "/leads": "Leads",
        "/tickets": "Tickets",
        "/access-requests": "Access Requests",
        "/settings": "Settings",
      };

  if (map[pathname]) return map[pathname];
  if (pathname.startsWith("/clients/")) return "Client Detail";
  if (pathname.startsWith("/leads/")) return "Lead Detail";
  if (pathname.startsWith("/tickets/")) return "Ticket Detail";

  return "Workspace";
}

export function buildBreadcrumbs(pathname, user) {
  const parts = pathname.split("/").filter(Boolean);
  const isClientUser = user?.role === "client";

  if (parts.length === 0) {
    return [{ label: "Dashboard", to: "/" }];
  }

  const crumbs = [];
  let current = "";

  for (const part of parts) {
    current += `/${part}`;

    if (part === "clients" && !isClientUser) {
      crumbs.push({ label: "Clients", to: "/clients" });
    } else if (part === "leads" && !isClientUser) {
      crumbs.push({ label: "Leads", to: "/leads" });
    } else if (part === "tickets") {
      crumbs.push({
        label: isClientUser ? "My Tickets" : "Tickets",
        to: "/tickets",
      });
    } else if (part === "access-requests" && !isClientUser) {
      crumbs.push({ label: "Access Requests", to: "/access-requests" });
    } else if (part === "settings") {
      crumbs.push({ label: "Settings", to: "/settings" });
    } else if (!Number.isNaN(Number(part))) {
      crumbs.push({ label: `#${part}`, to: current });
    } else {
      crumbs.push({ label: part, to: current });
    }
  }

  return crumbs;
}

export function shellNav(locationPath, counts, user) {
  if (isClient(user)) {
    const sections = [
      {
        title: "Overview",
        items: [
          {
            label: "Dashboard",
            to: "/",
            icon: HomeIcon,
          },
        ],
      },
      {
        title: "Support",
        items: [
          {
            label: "My Tickets",
            to: "/tickets",
            icon: TicketIcon,
            badge:
              counts.urgentTickets > 0
                ? `${counts.urgentTickets}`
                : counts.tickets || null,
            badgeTone:
              counts.urgentTickets > 0
                ? "border-rose-500/20 bg-rose-500/10 text-rose-200"
                : undefined,
          },
        ],
      },
    ];

    if (isClientPortalAdmin(user)) {
      sections.push({
        title: "Account",
        items: [
          {
            label: "Settings",
            to: "/settings",
            icon: Cog6ToothIcon,
          },
        ],
      });
    }

    return sections.map((section) => ({
      ...section,
      items: section.items.map((item) => ({
        ...item,
        isActive:
          item.to === "/"
            ? locationPath === "/"
            : locationPath === item.to || locationPath.startsWith(`${item.to}/`),
      })),
    }));
  }

  const sections = [
    {
      title: "Overview",
      items: [
        {
          label: "Dashboard",
          to: "/",
          icon: HomeIcon,
        },
      ],
    },
    {
      title: "Sales",
      items: [
        {
          label: "Leads",
          to: "/leads",
          icon: RectangleStackIcon,
          badge: counts.leads > 0 ? counts.leads : null,
        },
        {
          label: "Clients",
          to: "/clients",
          icon: BuildingOffice2Icon,
          badge: counts.clients > 0 ? counts.clients : null,
        },
      ],
    },
    {
      title: "Operations",
      items: [
        {
          label: "Tickets",
          to: "/tickets",
          icon: TicketIcon,
          badge:
            counts.urgentTickets > 0
              ? `${counts.urgentTickets}`
              : counts.tickets || null,
          badgeTone:
            counts.urgentTickets > 0
              ? "border-rose-500/20 bg-rose-500/10 text-rose-200"
              : undefined,
        },
      ],
    },
  ];

  if (isAdmin(user)) {
    sections.push({
      title: "Admin",
      items: [
        {
          label: "Access Requests",
          to: "/access-requests",
          icon: UserGroupIcon,
          badge:
            counts.newAccessRequests > 0
              ? `${counts.newAccessRequests}`
              : counts.accessRequests || null,
          badgeTone:
            counts.newAccessRequests > 0
              ? "border-amber-500/20 bg-amber-500/10 text-amber-200"
              : undefined,
        },
        {
          label: "Settings",
          to: "/settings",
          icon: Cog6ToothIcon,
        },
      ],
    });
  }

  return sections.map((section) => ({
    ...section,
    items: section.items.map((item) => ({
      ...item,
      isActive:
        item.to === "/"
          ? locationPath === "/"
          : locationPath === item.to || locationPath.startsWith(`${item.to}/`),
    })),
  }));
}
