import { authOptions } from "@salonko/auth/server";
import { prisma } from "@salonko/prisma";
import {
  ImageValidationError,
  S3ServiceError,
  deleteImage,
  generatePresignedUrl,
  uploadImage,
  validateImage,
} from "@salonko/s3";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

/**
 * POST /api/upload/salon-icon
 * Upload a salon icon image (processes and stores in S3)
 */
export async function POST(request: Request) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ ok: false, error: "UNAUTHENTICATED" }, { status: 401 });
    }

    // Parse form data
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ ok: false, error: "Fajl nije pronađen" }, { status: 400 });
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { ok: false, error: "Nevažeći format slike. Dozvoljeni formati: JPEG, PNG, WebP" },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { ok: false, error: "Slika je prevelika. Maksimalna veličina: 5MB" },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const buffer = Buffer.from(await file.arrayBuffer());

    // Validate image
    validateImage(buffer, file.type);

    // Get current user to check for existing icon
    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { salonIconKey: true },
    });

    // Upload to S3 (with processing)
    const result = await uploadImage(buffer, file.type, "salon-icons");

    // Delete old icon if exists
    if (currentUser?.salonIconKey) {
      try {
        await deleteImage(currentUser.salonIconKey);
      } catch {
        // Log but don't fail if deletion fails
        console.error("Failed to delete old salon icon:", currentUser.salonIconKey);
      }
    }

    // Update user with new icon key
    await prisma.user.update({
      where: { id: session.user.id },
      data: { salonIconKey: result.key },
    });

    return NextResponse.json({
      ok: true,
      key: result.key,
      url: result.url,
      size: result.size,
      width: result.width,
      height: result.height,
    });
  } catch (error) {
    console.error("Upload error:", error);

    if (error instanceof ImageValidationError) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 400 });
    }

    if (error instanceof S3ServiceError) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json(
      { ok: false, error: "Greška pri uploadu slike. Pokušajte ponovo." },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/upload/salon-icon
 * Remove the user's salon icon
 */
export async function DELETE() {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ ok: false, error: "UNAUTHENTICATED" }, { status: 401 });
    }

    // Get current user's icon key
    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { salonIconKey: true },
    });

    if (!currentUser?.salonIconKey) {
      return NextResponse.json({ ok: false, error: "Nema slike za brisanje" }, { status: 400 });
    }

    // Delete from S3
    await deleteImage(currentUser.salonIconKey);

    // Clear the key in database
    await prisma.user.update({
      where: { id: session.user.id },
      data: { salonIconKey: null },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Delete error:", error);

    if (error instanceof S3ServiceError) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json(
      { ok: false, error: "Greška pri brisanju slike. Pokušajte ponovo." },
      { status: 500 }
    );
  }
}

/**
 * GET /api/upload/salon-icon
 * Get the current user's salon icon URL (generates fresh presigned URL)
 */
export async function GET() {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ ok: false, error: "UNAUTHENTICATED" }, { status: 401 });
    }

    // Get current user's icon key
    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { salonIconKey: true },
    });

    if (!currentUser?.salonIconKey) {
      return NextResponse.json({ ok: true, url: null });
    }

    // Generate fresh presigned URL
    const url = await generatePresignedUrl(currentUser.salonIconKey);

    return NextResponse.json({ ok: true, url, key: currentUser.salonIconKey });
  } catch (error) {
    console.error("Get icon error:", error);

    return NextResponse.json({ ok: false, error: "Greška pri učitavanju slike." }, { status: 500 });
  }
}
