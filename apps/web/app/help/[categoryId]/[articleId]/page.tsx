import { BreadcrumbSchema, HelpArticleSchema } from "@/components/StructuredData";
import { getArticleContent } from "@/lib/help-articles";
import { getAppUrl } from "@/lib/utils";
import { HelpArticleClient, LandingFooter, LandingHeader, helpCategories } from "@salonko/ui";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

const baseUrl = getAppUrl();

interface ArticlePageParams {
  params: Promise<{ categoryId: string; articleId: string }>;
}

function findArticle(categoryId: string, articleId: string) {
  const category = helpCategories.find((c) => c.id === categoryId);
  if (!category) return null;

  const article = category.articles.find((a) => a.id === articleId);
  if (!article) return null;

  return { category, article };
}

export async function generateMetadata({ params }: ArticlePageParams): Promise<Metadata> {
  const { categoryId, articleId } = await params;
  const result = findArticle(categoryId, articleId);

  if (!result) {
    return { title: "Članak nije pronađen" };
  }

  const articleUrl = `${baseUrl}/help/${categoryId}/${articleId}`;

  return {
    title: `${result.article.title} | Centar za pomoć`,
    description: result.article.description,
    alternates: {
      canonical: articleUrl,
    },
    openGraph: {
      title: `${result.article.title} | Centar za pomoć`,
      description: result.article.description,
      url: articleUrl,
      type: "article",
      siteName: "Salonko",
      locale: "sr_RS",
    },
    twitter: {
      card: "summary",
      title: `${result.article.title} | Centar za pomoć`,
      description: result.article.description,
    },
  };
}

export function generateStaticParams() {
  const paths: { categoryId: string; articleId: string }[] = [];

  for (const category of helpCategories) {
    for (const article of category.articles) {
      paths.push({ categoryId: category.id, articleId: article.id });
    }
  }

  return paths;
}

export default async function ArticlePage({ params }: ArticlePageParams) {
  const { categoryId, articleId } = await params;
  const result = findArticle(categoryId, articleId);

  if (!result) {
    notFound();
  }

  const content = await getArticleContent(categoryId, articleId);

  if (!content) {
    notFound();
  }

  const articleUrl = `${baseUrl}/help/${categoryId}/${articleId}`;

  return (
    <div className="min-h-dvh">
      <BreadcrumbSchema
        items={[
          { name: "Početna", url: baseUrl },
          { name: "Centar za pomoć", url: `${baseUrl}/help` },
          { name: result.category.title, url: `${baseUrl}/help` },
          { name: result.article.title, url: articleUrl },
        ]}
      />
      <HelpArticleSchema
        title={result.article.title}
        description={result.article.description}
        url={articleUrl}
        categoryName={result.category.title}
      />
      <LandingHeader />
      <main>
        <HelpArticleClient
          content={content}
          categoryTitle={result.category.title}
          categoryId={result.category.id}
          articleTitle={result.article.title}
          siblingArticles={result.category.articles}
          currentArticleId={articleId}
        />
      </main>
      <LandingFooter />
    </div>
  );
}
