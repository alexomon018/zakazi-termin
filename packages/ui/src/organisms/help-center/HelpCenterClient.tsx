"use client";

import { Button } from "@salonko/ui/atoms/Button";
import { Card } from "@salonko/ui/atoms/Card";
import { Input } from "@salonko/ui/atoms/Input";
import { useScrollAnimation } from "@salonko/ui/hooks/useScrollAnimation";
import { cn } from "@salonko/ui/utils";
import { ArrowRight, ChevronRight, Headphones, Search } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { type HelpArticle, type HelpCategory, helpCategories } from "./help-center-data";

function CategoryCard({
  category,
  delay = 0,
}: {
  category: HelpCategory;
  delay?: number;
}) {
  const { ref, isVisible } = useScrollAnimation({
    threshold: 0.1,
    triggerOnce: true,
    delay,
  });
  const Icon = category.icon;

  return (
    <Card
      ref={ref}
      className={cn(
        "p-6 transition-all duration-300 hover:shadow-elevated-lg hover:-translate-y-1 group",
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
      )}
    >
      <div className="flex justify-center items-center mb-4 w-12 h-12 rounded-lg transition-all duration-300 bg-primary/10 dark:bg-primary/25 group-hover:bg-primary/20 dark:group-hover:bg-primary/35 group-hover:scale-110">
        <Icon
          aria-hidden="true"
          className="w-6 h-6 transition-transform duration-300 text-primary group-hover:scale-110"
        />
      </div>
      <h3 className="mb-2 text-xl font-semibold text-foreground">{category.title}</h3>
      <p className="mb-4 text-sm leading-relaxed text-muted-foreground">{category.description}</p>
      <ul className="space-y-2">
        {category.articles.map((article) => (
          <li key={article.id}>
            <Link
              href={`/help/${category.id}/${article.id}`}
              className="flex gap-2 items-center text-sm transition-colors text-muted-foreground hover:text-foreground"
            >
              <ChevronRight className="w-3 h-3 shrink-0" aria-hidden="true" />
              {article.title}
            </Link>
          </li>
        ))}
      </ul>
    </Card>
  );
}

function SearchResultItem({
  article,
  categoryId,
  categoryTitle,
}: {
  article: HelpArticle;
  categoryId: string;
  categoryTitle: string;
}) {
  return (
    <Link
      href={`/help/${categoryId}/${article.id}`}
      className="flex gap-3 items-start p-4 rounded-lg transition-colors hover:bg-muted/50"
    >
      <ChevronRight className="w-4 h-4 mt-0.5 shrink-0 text-primary" aria-hidden="true" />
      <div>
        <p className="text-sm font-medium text-foreground">{article.title}</p>
        <p className="mt-1 text-xs text-muted-foreground">{categoryTitle}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{article.description}</p>
      </div>
    </Link>
  );
}

export function HelpCenterClient() {
  const [searchQuery, setSearchQuery] = useState("");

  const searchResults = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    if (query.length < 2) return [];

    const results: { article: HelpArticle; categoryId: string; categoryTitle: string }[] = [];
    for (const category of helpCategories) {
      for (const article of category.articles) {
        const matchesTitle = article.title.toLowerCase().includes(query);
        const matchesDesc = article.description.toLowerCase().includes(query);
        const matchesCategory = category.title.toLowerCase().includes(query);

        if (matchesTitle || matchesDesc || matchesCategory) {
          results.push({ article, categoryId: category.id, categoryTitle: category.title });
        }
      }
    }
    return results;
  }, [searchQuery]);

  const showSearchResults = searchQuery.trim().length >= 2;

  return (
    <div>
      {/* Hero / Search Section */}
      <section className="overflow-hidden relative px-4 pt-16 pb-16 bg-gradient-to-b to-transparent lg:pt-32 sm:px-6 lg:px-8 from-primary/5">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="mb-4 text-4xl font-bold text-foreground sm:text-5xl">
            Kako ti možemo pomoći?
          </h1>
          <p className="mb-8 text-lg text-muted-foreground">
            Pretraži naše vodiče i članke ili pronađi odgovor po kategoriji.
          </p>
          <div className="relative mx-auto max-w-xl">
            <Search
              className="absolute left-4 top-1/2 w-5 h-5 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              type="search"
              placeholder="Pretraži članke, vodiče ili funkcije..."
              className="pr-4 pl-12 h-12 text-base rounded-xl border-border shadow-elevated"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </section>

      {/* Search Results */}
      {showSearchResults && (
        <section className="px-4 py-8 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl">
            {searchResults.length > 0 ? (
              <>
                <p className="mb-4 text-sm text-muted-foreground">
                  Pronađeno {searchResults.length}{" "}
                  {searchResults.length === 1
                    ? "rezultat"
                    : searchResults.length < 5
                      ? "rezultata"
                      : "rezultata"}
                </p>
                <Card className="divide-y divide-border">
                  {searchResults.map(({ article, categoryId, categoryTitle }) => (
                    <SearchResultItem
                      key={article.id}
                      article={article}
                      categoryId={categoryId}
                      categoryTitle={categoryTitle}
                    />
                  ))}
                </Card>
              </>
            ) : (
              <div className="py-12 text-center">
                <Search
                  className="mx-auto mb-4 w-12 h-12 text-muted-foreground/50"
                  aria-hidden="true"
                />
                <p className="text-lg font-medium text-foreground">Nismo pronašli rezultate</p>
                <p className="mt-2 text-sm text-muted-foreground">
                  Pokušaj sa drugim pojmom ili{" "}
                  <Link href="/help/podrska" className="text-primary hover:underline">
                    kontaktiraj podršku
                  </Link>
                  .
                </p>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Categories Grid */}
      {!showSearchResults && (
        <section className="px-4 py-16 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-6xl">
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {helpCategories.map((category, index) => (
                <CategoryCard key={category.id} category={category} delay={index * 80} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA Banner */}
      <section className="px-4 py-16 sm:px-6 lg:px-8 bg-muted/30">
        <div className="mx-auto max-w-2xl text-center">
          <div className="flex justify-center items-center mx-auto mb-4 w-14 h-14 rounded-full bg-primary/10 dark:bg-primary/25">
            <Headphones className="w-7 h-7 text-primary" aria-hidden="true" />
          </div>
          <h2 className="mb-3 text-2xl font-bold text-foreground">Nisi pronašao/la odgovor?</h2>
          <p className="mb-6 text-muted-foreground">
            Naš tim za podršku je tu da ti pomogne. Pošalji nam poruku i javićemo ti se u najkraćem
            roku.
          </p>
          <Button asChild>
            <Link href="/help/podrska">
              Kontaktiraj podršku
              <ArrowRight className="ml-2 w-4 h-4" aria-hidden="true" />
            </Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
