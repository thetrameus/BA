// src/features/profile/store.ts

export type UserProfile = {
  phone: string;
  name: string;
  wageAmount: number;
  hasInsurance: boolean;
  address?: string;
};

// مقادیر پیش‌فرض (دمو). در نسخه واقعی بعد از احراز هویت با setProfile پر می‌شود.
let profile: UserProfile = {
  phone: "09120000000",
  name: "کاربر نمونه",
  wageAmount: 200_000,
  hasInsurance: true,
};

export function getProfile(): UserProfile {
  return profile;
}

export function setProfile(next: Partial<UserProfile>) {
  profile = { ...profile, ...next };
}
