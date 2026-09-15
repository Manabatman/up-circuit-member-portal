import type { IconName } from "../components/Icon";

export function formatResourceType(type: string): string {
  return type.replaceAll("_", " ");
}

export function resourceTypeIcon(type: string): IconName {
  switch (type.toUpperCase()) {
    case "GOOGLE_DRIVE":
      return "drive";
    case "GOOGLE_SHEET":
      return "sheets";
    case "GOOGLE_FORM":
      return "forms";
    case "GOOGLE_DOC":
      return "doc";
    default:
      return "external";
  }
}

export function opensInLabel(type: string): string {
  switch (type.toUpperCase()) {
    case "GOOGLE_DRIVE":
      return "Opens in Google Drive";
    case "GOOGLE_SHEET":
      return "Opens in Google Sheets";
    case "GOOGLE_FORM":
      return "Opens in Google Forms";
    case "GOOGLE_DOC":
      return "Opens in Google Docs";
    default:
      return "Opens external link";
  }
}
