"use client";

import { Button } from "@salonko/ui/atoms/Button";
import { ArrowLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { HelpCategory } from "./help-center-data";

interface HelpArticleClientProps {
  content: string;
  categoryTitle: string;
  categoryId: string;
  articleTitle?: string;
  siblingArticles?: HelpCategory["articles"];
  currentArticleId?: string;
}

export function HelpArticleClient({
  content,
  categoryTitle,
  categoryId,
  articleTitle,
  siblingArticles = [],
  currentArticleId,
}: HelpArticleClientProps) {
  return (
    <div className="px-4 pt-28 pb-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        {/* Breadcrumb */}
        <nav
          aria-label="Navigacija"
          className="flex items-center gap-1.5 mb-10 text-sm text-muted-foreground"
        >
          <Link href="/help" className="transition-colors hover:text-foreground">
            Centar za pomoć
          </Link>
          <ChevronRight className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
          <Link href="/help" className="transition-colors hover:text-foreground">
            {categoryTitle}
          </Link>
          {articleTitle && (
            <>
              <ChevronRight className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
              <span className="text-foreground font-medium truncate">{articleTitle}</span>
            </>
          )}
        </nav>

        {/* Two-column layout on large screens */}
        <div className="lg:grid lg:grid-cols-[280px_1fr] lg:gap-12 xl:grid-cols-[300px_1fr] xl:gap-16">
          {/* Sidebar — category articles navigation */}
          {siblingArticles.length > 0 && (
            <aside className="hidden lg:block">
              <div className="sticky top-28">
                <p className="text-xs font-semibold tracking-wider uppercase text-muted-foreground mb-4">
                  {categoryTitle}
                </p>
                <nav className="space-y-1">
                  {siblingArticles.map((article) => {
                    const isActive = article.id === currentArticleId;
                    return (
                      <Link
                        key={article.id}
                        href={`/help/${categoryId}/${article.id}`}
                        className={
                          isActive
                            ? "block text-sm py-2 px-3 rounded-lg bg-primary/10 text-primary font-medium transition-colors"
                            : "block text-sm py-2 px-3 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                        }
                      >
                        {article.title}
                      </Link>
                    );
                  })}
                </nav>

                <div className="mt-8 pt-6 border-t border-border">
                  <p className="text-xs text-muted-foreground mb-3">Imaš pitanje?</p>
                  <Button asChild variant="outline" size="sm" className="w-full">
                    <Link href="/help/podrska">Kontaktiraj podršku</Link>
                  </Button>
                </div>
              </div>
            </aside>
          )}

          {/* Main article content */}
          <article className="min-w-0 max-w-none lg:max-w-3xl">
            <div className="prose prose-neutral dark:prose-invert max-w-none prose-headings:text-foreground prose-headings:scroll-mt-24 prose-h1:text-3xl prose-h1:sm:text-4xl prose-h1:font-bold prose-h1:mb-4 prose-h2:text-xl prose-h2:mt-12 prose-h2:mb-4 prose-h2:font-semibold prose-h3:text-lg prose-h3:mt-8 prose-h3:mb-3 prose-p:text-muted-foreground prose-p:leading-relaxed prose-li:text-muted-foreground prose-li:leading-relaxed prose-strong:text-foreground prose-a:text-primary prose-a:no-underline hover:prose-a:underline prose-code:text-foreground prose-code:bg-muted prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded-md prose-code:text-[0.85em] prose-code:font-normal prose-code:before:content-none prose-code:after:content-none prose-pre:bg-muted prose-pre:border prose-pre:border-border prose-pre:rounded-xl prose-th:text-foreground prose-th:font-medium prose-th:bg-muted prose-th:border prose-th:border-border prose-th:px-4 prose-th:py-2 prose-td:text-muted-foreground prose-td:border prose-td:border-border prose-td:px-4 prose-td:py-2 prose-table:text-sm prose-table:border-collapse prose-blockquote:border-l-primary/40 prose-blockquote:bg-muted/30 prose-blockquote:rounded-r-lg prose-blockquote:py-1 prose-blockquote:px-4 prose-blockquote:not-italic prose-blockquote:text-muted-foreground prose-hr:border-border prose-img:rounded-xl prose-img:shadow-elevated">
              <Markdown remarkPlugins={[remarkGfm]}>{content}</Markdown>
            </div>

            {/* Bottom navigation */}
            <div className="mt-16 pt-8 border-t border-border">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <Button asChild variant="ghost" size="sm">
                  <Link href="/help">
                    <ArrowLeft className="mr-2 w-4 h-4" aria-hidden="true" />
                    Centar za pomoć
                  </Link>
                </Button>
                <p className="text-sm text-muted-foreground lg:hidden">
                  Imaš dodatno pitanje?{" "}
                  <Link href="/help/podrska" className="text-primary hover:underline">
                    Kontaktiraj podršku
                  </Link>
                </p>
              </div>
            </div>
          </article>
        </div>
      </div>
    </div>
  );
}
