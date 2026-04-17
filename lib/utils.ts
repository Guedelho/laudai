import { SEX_OPTIONS } from "@/shared/constants";

export function sexLabel(value: string): string {
  return SEX_OPTIONS.find((o) => o.value === value)?.label ?? value;
}
