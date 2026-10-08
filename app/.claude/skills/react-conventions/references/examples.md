# Example: the `products` feature end to end

Copy patterns, not names. Paths are relative to `src/`.

## Contents
1. Setup: vite alias, env, paths, cn, query client
2. lib/api-client.ts
3. Feature API: keys, list query, detail query, mutation
4. Feature types + zod schema
5. Components: list with all states, card, form
6. Feature store (Zustand)
7. Shared UI: Button with cva
8. Locales and i18n registration (app/i18n.ts)
9. Route files and router
10. App provider
11. Test

---

## 1. Setup

```ts
// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { fileURLToPath, URL } from "node:url";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: { alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) } },
});
```

```ts
// config/env.ts — the only place that reads import.meta.env
import { z } from "zod";

const envSchema = z.object({
  VITE_API_URL: z.string().url(),
  VITE_ENABLE_MOCKS: z.enum(["true", "false"]).default("false"),
});

const parsed = envSchema.safeParse(import.meta.env);
if (!parsed.success) {
  throw new Error(`Invalid environment variables:\n${parsed.error.message}`);
}
export const env = {
  apiUrl: parsed.data.VITE_API_URL,
  enableMocks: parsed.data.VITE_ENABLE_MOCKS === "true",
};
```

```ts
// config/paths.ts — every route path, defined once
export const paths = {
  home: { path: "/", getHref: () => "/" },
  auth: {
    login: { path: "/auth/login", getHref: (redirectTo?: string) =>
      `/auth/login${redirectTo ? `?redirectTo=${encodeURIComponent(redirectTo)}` : ""}` },
  },
  app: {
    root: { path: "/app", getHref: () => "/app" },
    products: { path: "products", getHref: () => "/app/products" },
    product: { path: "products/:productId", getHref: (id: string) => `/app/products/${id}` },
  },
} as const;
```

```ts
// lib/cn.ts
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

```ts
// lib/query-client.ts
import { QueryClient } from "@tanstack/react-query";
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 60_000, retry: 1, refetchOnWindowFocus: false },
  },
});
```

## 2. lib/api-client.ts

```ts
import { env } from "@/config/env";

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public fieldErrors?: Record<string, string>,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

type RequestOptions = Omit<RequestInit, "body"> & {
  body?: unknown;
  params?: Record<string, string | number | boolean | undefined>;
};

async function request<T>(path: string, { body, params, headers, ...init }: RequestOptions = {}): Promise<T> {
  const url = new URL(path, env.apiUrl);
  for (const [k, v] of Object.entries(params ?? {})) {
    if (v !== undefined) url.searchParams.set(k, String(v));
  }

  const res = await fetch(url, {
    ...init,
    credentials: "include", // httpOnly cookie session
    headers: {
      Accept: "application/json",
      ...(body !== undefined && { "Content-Type": "application/json" }),
      ...headers,
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (res.status === 401) {
    window.location.assign(`/auth/login?redirectTo=${encodeURIComponent(location.pathname)}`);
  }
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new ApiError(res.status, data.message ?? res.statusText, data.errors);
  }
  return res.status === 204 ? (undefined as T) : res.json();
}

export const api = {
  get: <T>(path: string, opts?: RequestOptions) => request<T>(path, { ...opts, method: "GET" }),
  post: <T>(path: string, body?: unknown, opts?: RequestOptions) => request<T>(path, { ...opts, method: "POST", body }),
  patch: <T>(path: string, body?: unknown, opts?: RequestOptions) => request<T>(path, { ...opts, method: "PATCH", body }),
  delete: <T>(path: string, opts?: RequestOptions) => request<T>(path, { ...opts, method: "DELETE" }),
};
```

## 3. Feature API

```ts
// features/products/api/product-keys.ts
import type { ProductListParams } from "../types/product";

export const productKeys = {
  all: ["products"] as const,
  lists: () => [...productKeys.all, "list"] as const,
  list: (params: ProductListParams) => [...productKeys.lists(), params] as const,
  details: () => [...productKeys.all, "detail"] as const,
  detail: (id: string) => [...productKeys.details(), id] as const,
};
```

```ts
// features/products/api/get-products.ts
import { queryOptions, useQuery, keepPreviousData } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import type { Paginated } from "@/types/api";
import type { Product, ProductListParams } from "../types/product";
import { productKeys } from "./product-keys";

export function getProducts(params: ProductListParams) {
  return api.get<Paginated<Product>>("/products", { params });
}

export function getProductsQueryOptions(params: ProductListParams) {
  return queryOptions({
    queryKey: productKeys.list(params),
    queryFn: () => getProducts(params),
    placeholderData: keepPreviousData, // no flash when changing page/filter
  });
}

export function useProducts(params: ProductListParams) {
  return useQuery(getProductsQueryOptions(params));
}
```

```ts
// features/products/api/create-product.ts
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import type { CreateProductInput, Product } from "../types/product";
import { productKeys } from "./product-keys";

export function createProduct(input: CreateProductInput) {
  return api.post<Product>("/products", input);
}

export function useCreateProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createProduct,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: productKeys.lists() }),
  });
}
```

## 4. Types + schema

```ts
// features/products/types/product.ts
import { z } from "zod";

export type Product = {
  id: string;
  nameKm: string;
  nameEn: string;
  priceRiel: number; // integer, no decimals
  imageUrl: string | null;
};

export type ProductListParams = { page: number; search?: string };

export const createProductSchema = z.object({
  nameKm: z.string().trim().min(1, "products.form.errors.nameRequired"),
  nameEn: z.string().trim().min(1, "products.form.errors.nameRequired"),
  priceRiel: z.coerce.number().int().positive("products.form.errors.pricePositive"),
});
export type CreateProductInput = z.infer<typeof createProductSchema>;
```
Schema messages are i18n keys; the field component translates them.

## 5. Components

```tsx
// features/products/components/product-list.tsx
import { useSearchParams } from "react-router";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useProducts } from "../api/get-products";
import { ProductCard } from "./product-card";

export function ProductList() {
  const { t } = useTranslation("products");
  const [searchParams, setSearchParams] = useSearchParams();
  const page = Number(searchParams.get("page") ?? 1);
  const search = searchParams.get("q") ?? undefined;

  const productsQuery = useProducts({ page, search });

  if (productsQuery.isPending) {
    return (
      <ul className="grid-auto" aria-busy="true">
        {Array.from({ length: 6 }, (_, i) => <li key={i}><Skeleton className="h-64" /></li>)}
      </ul>
    );
  }

  if (productsQuery.isError) {
    return (
      <div role="alert" className="space-y-3">
        <p>{t("list.error")}</p>
        <Button onClick={() => productsQuery.refetch()}>{t("common:retry")}</Button>
      </div>
    );
  }

  const { items, totalPages } = productsQuery.data;

  if (items.length === 0) {
    return <p className="text-muted-foreground">{t("list.empty")}</p>;
  }

  return (
    <>
      <ul className="grid-auto">
        {items.map((product) => (
          <li key={product.id}><ProductCard product={product} /></li>
        ))}
      </ul>
      <Button
        variant="outline"
        disabled={page >= totalPages}
        onClick={() => setSearchParams((p) => { p.set("page", String(page + 1)); return p; })}
      >
        {t("list.next")}
      </Button>
    </>
  );
}
```

```tsx
// features/products/components/product-card.tsx
import { Link } from "react-router";
import { useTranslation } from "react-i18next";
import { paths } from "@/config/paths";
import { formatRiel } from "@/lib/khmer-format";
import { cn } from "@/lib/cn";
import type { Product } from "../types/product";

type ProductCardProps = {
  product: Product;
  className?: string;
};

export function ProductCard({ product, className }: ProductCardProps) {
  const { i18n } = useTranslation();
  const name = i18n.language === "km" ? product.nameKm : product.nameEn;

  return (
    <article className={cn("rounded-lg border p-3", className)}>
      {product.imageUrl && (
        <img src={product.imageUrl} alt={name} width={320} height={240} loading="lazy" className="aspect-[4/3] w-full rounded object-cover" />
      )}
      <h3 className="mt-2 font-medium">
        <Link to={paths.app.product.getHref(product.id)}>{name}</Link>
      </h3>
      <p>{formatRiel(product.priceRiel)}</p>
    </article>
  );
}
```

```tsx
// features/products/components/create-product-form.tsx
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { ApiError } from "@/lib/api-client";
import { toLatinDigits } from "@/lib/khmer-format";
import { useCreateProduct } from "../api/create-product";
import { createProductSchema, type CreateProductInput } from "../types/product";

type CreateProductFormProps = { onSuccess?: () => void };

export function CreateProductForm({ onSuccess }: CreateProductFormProps) {
  const { t } = useTranslation("products");
  const createProduct = useCreateProduct();
  const form = useForm<CreateProductInput>({ resolver: zodResolver(createProductSchema) });

  const handleSubmit = form.handleSubmit((values) =>
    createProduct.mutate(values, {
      onSuccess,
      onError: (error) => {
        if (error instanceof ApiError && error.fieldErrors) {
          for (const [field, message] of Object.entries(error.fieldErrors)) {
            form.setError(field as keyof CreateProductInput, { message });
          }
        }
      },
    }),
  );

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      <Field label={t("form.nameKm")} error={form.formState.errors.nameKm?.message} {...form.register("nameKm")} lang="km" />
      <Field label={t("form.nameEn")} error={form.formState.errors.nameEn?.message} {...form.register("nameEn")} lang="en" />
      <Field label={t("form.price")} inputMode="numeric" error={form.formState.errors.priceRiel?.message} {...form.register("priceRiel", { setValueAs: (v) => toLatinDigits(v) })} />
      <Button type="submit" disabled={createProduct.isPending}>
        {createProduct.isPending ? t("form.saving") : t("form.save")}
      </Button>
    </form>
  );
}
```
`toLatinDigits` lets users type the price in Khmer digits (០១២៣).

## 6. Feature store

```ts
// features/cart/stores/cart-store.ts
import { create } from "zustand";
import { persist } from "zustand/middleware";

type CartItem = { productId: string; quantity: number };

type CartState = {
  items: CartItem[];
  add: (productId: string) => void;
  remove: (productId: string) => void;
  clear: () => void;
};

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      add: (productId) =>
        set((s) => {
          const existing = s.items.find((i) => i.productId === productId);
          return {
            items: existing
              ? s.items.map((i) => (i.productId === productId ? { ...i, quantity: i.quantity + 1 } : i))
              : [...s.items, { productId, quantity: 1 }],
          };
        }),
      remove: (productId) => set((s) => ({ items: s.items.filter((i) => i.productId !== productId) })),
      clear: () => set({ items: [] }),
    }),
    { name: "cart" },
  ),
);

// usage: select narrowly
// const itemCount = useCartStore((s) => s.items.length);
```

## 7. Shared UI: Button with cva

```tsx
// components/ui/button.tsx
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/cn";

const buttonVariants = cva(
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-md px-4 py-2 font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        primary: "bg-primary text-primary-foreground hover:bg-primary/90",
        outline: "border border-border bg-transparent hover:bg-muted",
        ghost: "hover:bg-muted",
        danger: "bg-danger text-danger-foreground hover:bg-danger/90",
      },
      size: { sm: "min-h-9 px-3 text-sm", md: "", lg: "min-h-12 px-6 text-lg" },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

type ButtonProps = React.ComponentProps<"button"> & VariantProps<typeof buttonVariants>;

export function Button({ className, variant, size, type = "button", ...props }: ButtonProps) {
  return <button type={type} className={cn(buttonVariants({ variant, size }), className)} {...props} />;
}
```
`min-h-*` and padding instead of fixed `h-*` so Khmer text never clips. `type="button"` default prevents accidental form submits.

## 8. Locales

```jsonc
// features/products/locales/km.json
{
  "list": { "empty": "មិនទាន់មានផលិតផលទេ", "error": "មិនអាចផ្ទុកផលិតផលបានទេ", "next": "ទំព័របន្ទាប់" },
  "form": {
    "nameKm": "ឈ្មោះ (ខ្មែរ)", "nameEn": "ឈ្មោះ (អង់គ្លេស)", "price": "តម្លៃ (រៀល)",
    "save": "រក្សាទុក", "saving": "កំពុងរក្សាទុក…",
    "errors": { "nameRequired": "សូមបញ្ចូលឈ្មោះ", "pricePositive": "តម្លៃត្រូវតែធំជាងសូន្យ" }
  }
}
```

```ts
// app/i18n.ts — lives in app/ because it registers every feature's namespace
import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import commonKm from "@/locales/common/km.json";
import commonEn from "@/locales/common/en.json";
import productsKm from "@/features/products/locales/km.json";
import productsEn from "@/features/products/locales/en.json";

i18n.use(initReactI18next).init({
  lng: "km",
  fallbackLng: "en",
  defaultNS: "common",
  resources: {
    km: { common: commonKm, products: productsKm },
    en: { common: commonEn, products: productsEn },
  },
  interpolation: { escapeValue: false },
});
i18n.on("languageChanged", (lng) => { document.documentElement.lang = lng; });
export { i18n };
```
Shared `common` strings live in `src/locales/common/`. For many features, load namespaces lazily with `i18next-resources-to-backend` and `import.meta.glob("../features/*/locales/*.json")`.

## 9. Route files and router

```tsx
// app/routes/app/products/products.tsx
import { useTranslation } from "react-i18next";
import { ProductList } from "@/features/products/components/product-list";
import { CreateProductDialog } from "@/features/products/components/create-product-dialog";

export function ProductsRoute() {
  const { t } = useTranslation("products");
  return (
    <section className="container space-y-6 py-6">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">{t("title")}</h1>
        <CreateProductDialog />
      </header>
      <ProductList />
    </section>
  );
}
```

```tsx
// app/router.tsx
import { createBrowserRouter, RouterProvider } from "react-router";
import { paths } from "@/config/paths";
import { AppLayout } from "@/components/layouts/app-layout";
import { RouteError } from "@/components/errors/route-error";
import { ProtectedRoute } from "@/features/auth/components/protected-route";

const router = createBrowserRouter([
  {
    path: paths.auth.login.path,
    lazy: async () => ({ Component: (await import("./routes/auth/login")).LoginRoute }),
  },
  {
    path: paths.app.root.path,
    element: <ProtectedRoute><AppLayout /></ProtectedRoute>,
    errorElement: <RouteError />,
    children: [
      { index: true, lazy: async () => ({ Component: (await import("./routes/app/dashboard")).DashboardRoute }) },
      { path: paths.app.products.path, lazy: async () => ({ Component: (await import("./routes/app/products/products")).ProductsRoute }) },
      { path: paths.app.product.path, lazy: async () => ({ Component: (await import("./routes/app/products/product")).ProductRoute }) },
    ],
  },
  { path: "*", lazy: async () => ({ Component: (await import("./routes/not-found")).NotFoundRoute }) },
]);

export function AppRouter() {
  return <RouterProvider router={router} />;
}
```
`app/` may import from features (e.g. `ProtectedRoute` from `auth`) — that's the direction the rules allow.

## 10. App provider

```tsx
// app/provider.tsx
import { Suspense } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { ErrorBoundary } from "react-error-boundary";
import { I18nextProvider } from "react-i18next";
import { AppErrorFallback } from "@/components/errors/app-error-fallback";
import { PageSpinner } from "@/components/ui/page-spinner";
import { Notifications } from "@/components/ui/notifications";
import { queryClient } from "@/lib/query-client";
import { i18n } from "./i18n";

export function AppProvider({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<PageSpinner />}>
      <ErrorBoundary FallbackComponent={AppErrorFallback}>
        <I18nextProvider i18n={i18n}>
          <QueryClientProvider client={queryClient}>
            <Notifications />
            {children}
            {import.meta.env.DEV && <ReactQueryDevtools />}
          </QueryClientProvider>
        </I18nextProvider>
      </ErrorBoundary>
    </Suspense>
  );
}
```

## 11. Test

```tsx
// features/products/components/product-list.test.tsx
import { screen } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { renderWithProviders } from "@/testing/render-with-providers";
import { server } from "@/testing/msw-server";
import { makeProduct } from "@/testing/factories/product";
import { ProductList } from "./product-list";

it("renders products with riel prices", async () => {
  server.use(http.get("*/products", () =>
    HttpResponse.json({ items: [makeProduct({ nameKm: "កាហ្វេ", priceRiel: 8000 })], totalPages: 1 })));
  renderWithProviders(<ProductList />, { route: "/app/products" });
  expect(await screen.findByRole("link", { name: "កាហ្វេ" })).toBeInTheDocument();
  expect(screen.getByText("8,000៛")).toBeInTheDocument();
});

it("shows the empty state", async () => {
  server.use(http.get("*/products", () => HttpResponse.json({ items: [], totalPages: 0 })));
  renderWithProviders(<ProductList />, { route: "/app/products" });
  expect(await screen.findByText("មិនទាន់មានផលិតផលទេ")).toBeInTheDocument();
});
```