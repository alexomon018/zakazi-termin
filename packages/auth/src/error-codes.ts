export enum ErrorCode {
  IncorrectEmailPassword = "incorrect-email-password",
  UserNotFound = "user-not-found",
  EmailAlreadyExists = "email-already-exists",
  UsernameAlreadyExists = "username-already-exists",
  InvalidCredentials = "invalid-credentials",
  EmailNotVerified = "email-not-verified",
  InternalServerError = "internal-server-error",
  WrongProvider = "wrong-provider",
}

export const errorMessages: Record<ErrorCode, string> = {
  [ErrorCode.IncorrectEmailPassword]: "Pogrešan email ili lozinka",
  [ErrorCode.UserNotFound]: "Korisnik nije pronađen",
  [ErrorCode.EmailAlreadyExists]: "Email adresa je već registrovana",
  [ErrorCode.UsernameAlreadyExists]: "Korisničko ime je zauzeto",
  [ErrorCode.InvalidCredentials]: "Nevažeći podaci za prijavu",
  [ErrorCode.EmailNotVerified]: "Email adresa nije verifikovana",
  [ErrorCode.InternalServerError]: "Interna greška servera",
  [ErrorCode.WrongProvider]: "Molimo prijavite se putem Google naloga",
};
