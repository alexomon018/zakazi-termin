import { hashPassword } from "@zakazi-termin/auth";
import { logger } from "@zakazi-termin/config";
import { emailService } from "@zakazi-termin/emails";
import { prisma } from "@zakazi-termin/prisma";
import { NextResponse } from "next/server";
import { z } from "zod";

const signupSchema = z.object({
  name: z.string().min(2, "Ime mora imati najmanje 2 karaktera"),
  email: z.string().email("Nevažeća email adresa"),
  username: z
    .string()
    .min(3, "Korisničko ime mora imati najmanje 3 karaktera")
    .max(20, "Korisničko ime može imati najviše 20 karaktera")
    .regex(/^[a-z0-9_-]+$/, "Korisničko ime može sadržati samo mala slova, brojeve, _ i -"),
  password: z.string().min(8, "Lozinka mora imati najmanje 8 karaktera"),
  organizationName: z.string().optional(),
  organizationSlug: z
    .string()
    .regex(/^[a-z0-9-]+$/, "Slug može sadržati samo mala slova, brojeve i -")
    .optional(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = signupSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ message: result.error.errors[0].message }, { status: 400 });
    }

    const { name, email, username, password, organizationName, organizationSlug } = result.data;

    // Check if email already exists
    const existingEmail = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existingEmail) {
      return NextResponse.json({ message: "Email adresa je već registrovana" }, { status: 400 });
    }

    // Check if username already exists
    const existingUsername = await prisma.user.findUnique({
      where: { username: username.toLowerCase() },
    });

    if (existingUsername) {
      return NextResponse.json({ message: "Korisničko ime je zauzeto" }, { status: 400 });
    }

    // Check if organization slug already exists (if creating org)
    if (organizationSlug) {
      const existingOrg = await prisma.organization.findUnique({
        where: { slug: organizationSlug.toLowerCase() },
      });

      if (existingOrg) {
        return NextResponse.json({ message: "Slug organizacije je već zauzet" }, { status: 400 });
      }
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create user with password, default schedule, and optionally organization
    const user = await prisma.$transaction(async (tx) => {
      // Create the user
      const newUser = await tx.user.create({
        data: {
          name,
          email: email.toLowerCase(),
          username: username.toLowerCase(),
          identityProvider: "EMAIL",
          password: {
            create: {
              hash: hashedPassword,
            },
          },
          // Create default schedule
          schedules: {
            create: {
              name: "Radno vreme",
              timeZone: "Europe/Belgrade",
              availability: {
                create: [
                  // Monday to Friday, 9am to 5pm
                  {
                    days: [1, 2, 3, 4, 5],
                    startTime: new Date("1970-01-01T09:00:00"),
                    endTime: new Date("1970-01-01T17:00:00"),
                  },
                ],
              },
            },
          },
        },
        include: {
          schedules: true,
        },
      });

      // Set default schedule
      if (newUser.schedules[0]) {
        await tx.user.update({
          where: { id: newUser.id },
          data: { defaultScheduleId: newUser.schedules[0].id },
        });
      }

      // Create organization if specified
      if (organizationName && organizationSlug) {
        const org = await tx.organization.create({
          data: {
            name: organizationName,
            slug: organizationSlug.toLowerCase(),
            members: {
              create: {
                userId: newUser.id,
                role: "OWNER",
                accepted: true,
              },
            },
          },
        });

        return { ...newUser, organizationId: org.id };
      }

      return newUser;
    });

    // Send welcome email
    try {
      await emailService.sendWelcomeEmail({
        userName: name,
        userEmail: email.toLowerCase(),
        username: username.toLowerCase(),
      });
    } catch (error) {
      logger.error("Failed to send welcome email", { error, email: email.toLowerCase() });
      // Don't block signup if email fails
    }

    return NextResponse.json(
      {
        message: "Nalog je uspešno kreiran",
        userId: user.id,
        organizationId: "organizationId" in user ? user.organizationId : null,
      },
      { status: 201 }
    );
  } catch (error) {
    logger.error("Signup error", { error });
    return NextResponse.json({ message: "Došlo je do greške pri registraciji" }, { status: 500 });
  }
}
