import { readFile } from "node:fs/promises";
import { join } from "node:path";

const CONTENT_DIR = join(process.cwd(), "content", "help");

/**
 * Reads a help article markdown file by category and article ID.
 * Returns null if the article doesn't exist.
 */
export async function getArticleContent(
  categoryId: string,
  articleId: string
): Promise<string | null> {
  const filePath = join(CONTENT_DIR, categoryId, `${articleId}.md`);

  try {
    return await readFile(filePath, "utf-8");
  } catch {
    return null;
  }
}
