// website pages also open inside the workspace
export const IN_APP: Record<string, string> = {
  "/": "/app/overview",
  "/features": "/app/features",
  "/methodology": "/app/methodology",
  "/about": "/app/about-project",
};

export const inAppHref = (href: string) => IN_APP[href] ?? href;
