import { QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { setupRouterSsrQueryIntegration } from "@tanstack/react-router-ssr-query";
import { routeTree } from "./routeTree.gen";
import { GlobalErrorFallback } from "./components/site/GlobalErrorFallback";
import { NotFound } from "./components/site/NotFound";

export const getRouter = () => {
  const queryClient = new QueryClient();

  const router = createRouter({
    routeTree,
    context: { queryClient },
    scrollRestoration: true,
    defaultPreloadStaleTime: 0,
    defaultErrorComponent: ({ error, reset }) => (
      <GlobalErrorFallback error={error} reset={reset} boundary="route" />
    ),
    defaultNotFoundComponent: () => <NotFound showCode withLayout={false} />,
  });

  setupRouterSsrQueryIntegration({ router, queryClient });

  return router;
};
