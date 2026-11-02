import { ApiError } from "@/lib/api/client";
import type { UseFormSetError, FieldValues, Path } from "react-hook-form";

export interface ParsedFormErrors {
  fieldErrors: Record<string, string>;
  generalError: string | null;
}

/**
 * Parses Spring Boot error payloads into field-specific error maps.
 * Handles `VALIDATION_ERROR` with `errors: ["fieldName: message", ...]`,
 * as well as targeted business rule exceptions (duplicate email, phone format, slot conflict).
 */
export function extractFieldErrors(error: unknown): ParsedFormErrors {
  const result: ParsedFormErrors = {
    fieldErrors: {},
    generalError: null,
  };

  if (!error) return result;

  if (error instanceof ApiError) {
    // 1. Process structured validation errors array from Spring Boot MethodArgumentNotValidException
    if (Array.isArray(error.errors) && error.errors.length > 0) {
      for (const errStr of error.errors) {
        if (typeof errStr !== "string") continue;
        const colonIdx = errStr.indexOf(":");
        if (colonIdx > 0) {
          const field = errStr.slice(0, colonIdx).trim();
          const msg = errStr.slice(colonIdx + 1).trim();
          result.fieldErrors[field] = msg;
        } else {
          // No field prefix; add to general message
          if (!result.generalError) {
            result.generalError = errStr;
          }
        }
      }
    }

    // 2. Map domain-specific error codes and messages to probable fields
    const rawMsg = error.message || "";
    const lowerMsg = rawMsg.toLowerCase();

    if (error.code === "DUPLICATE_RESOURCE") {
      if (lowerMsg.includes("email")) {
        result.fieldErrors["email"] = "This email address is already in use.";
      } else if (lowerMsg.includes("phone")) {
        result.fieldErrors["phone"] = "This phone number is already registered.";
      } else if (lowerMsg.includes("sku")) {
        result.fieldErrors["sku"] = "This SKU code is already taken.";
      } else {
        result.generalError = rawMsg;
      }
    } else if (error.code === "SLOT_CONFLICT") {
      result.fieldErrors["time"] = "This appointment time slot is no longer available.";
      result.generalError = "This time slot has just been booked. Please choose an alternative slot.";
    } else if (error.code === "INSUFFICIENT_STOCK") {
      result.fieldErrors["quantity"] = "The requested quantity is currently out of stock.";
      result.generalError = "Some items exceed available inventory.";
    } else if (error.code === "INVALID_CREDENTIALS") {
      result.generalError = "Invalid email or password.";
    } else if (error.code === "RATE_LIMIT_EXCEEDED") {
      result.generalError = "Too many requests. Please wait a moment before trying again.";
    } else if (error.code === "NETWORK_ERROR") {
      result.generalError = "We could not reach the server. Please check your connection.";
    } else if (!result.generalError && Object.keys(result.fieldErrors).length === 0) {
      result.generalError = sanitizeErrorMessage(rawMsg);
    }
  } else if (error instanceof Error) {
    result.generalError = sanitizeErrorMessage(error.message);
  } else {
    result.generalError = "We could not complete your request. Please try again.";
  }

  return result;
}

/**
 * Sanitizes technical error messages so internal traces or raw database syntax are never exposed.
 */
export function sanitizeErrorMessage(rawMessage?: string): string {
  if (!rawMessage) return "We could not complete your request. Please try again.";

  const lower = rawMessage.toLowerCase();
  if (
    lower.includes("sql") ||
    lower.includes("hibernate") ||
    lower.includes("org.springframework") ||
    lower.includes("stacktrace") ||
    lower.includes("jdbc") ||
    lower.includes("exception")
  ) {
    return "An unexpected server issue occurred. Our team has been notified.";
  }

  return rawMessage;
}

const BACKEND_TO_FRONTEND_FIELD_MAP: Record<string, string[]> = {
  postalCode: ["zipCode", "postalCode"],
  zipCode: ["postalCode", "zipCode"],
  addressLine1: ["street", "addressLine1"],
  street: ["addressLine1", "street"],
  addressLine2: ["unit", "addressLine2"],
  unit: ["addressLine2", "unit"],
  vaccinationDate: ["dateAdministered", "vaccinationDate"],
  dateAdministered: ["vaccinationDate", "dateAdministered"],
  recordDate: ["date", "recordDate"],
  date: ["recordDate", "date"],
  photoUrl: ["photo", "photoUrl"],
  photo: ["photoUrl", "photo"],
  stockQuantity: ["stock", "stockQuantity"],
  stock: ["stockQuantity", "stock"],
  reviewText: ["comment", "reviewText"],
  comment: ["reviewText", "comment"],
  dateOfBirth: ["birthDate", "dateOfBirth", "age"],
  birthDate: ["dateOfBirth", "birthDate"],
  newPassword: ["newPassword"],
  confirmNewPassword: ["confirmNewPassword", "confirmPassword"],
  confirmPassword: ["confirmNewPassword", "confirmPassword"],
};

/**
 * Applies extracted backend validation errors to React Hook Form field state.
 * Supports cross-contract field aliases (e.g. postalCode <-> zipCode, vaccinationDate <-> dateAdministered).
 * Returns the general error string if there were unmapped errors.
 */
export function applyServerErrors<T extends FieldValues>(
  error: unknown,
  setError: UseFormSetError<T>,
  fallbackMessage = "Unable to save your changes. Please review the highlighted fields."
): string | null {
  const { fieldErrors, generalError } = extractFieldErrors(error);

  let mappedCount = 0;
  for (const [field, message] of Object.entries(fieldErrors)) {
    const candidateFields = BACKEND_TO_FRONTEND_FIELD_MAP[field] || [field];
    let fieldSet = false;

    for (const candidate of candidateFields) {
      try {
        setError(candidate as Path<T>, {
          type: "server",
          message,
        });
        fieldSet = true;
        mappedCount++;
        break;
      } catch {
        // Field does not exist in current schema; try next candidate
      }
    }

    if (!fieldSet) {
      try {
        setError(field as Path<T>, {
          type: "server",
          message,
        });
        mappedCount++;
      } catch {
        // Unmapped field
      }
    }
  }

  if (generalError) {
    return generalError;
  }

  if (mappedCount === 0) {
    return fallbackMessage;
  }

  return null;
}
