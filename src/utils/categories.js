// All categories in English, mapped from original Slovak names.
// Each entry has a `type` so the app can auto-assign new entries.
// The `groupId` field is reserved for future household sharing — null = personal only.

export const INCOME_CATEGORIES = [
  { id: "salary",        label: "Salary",        emoji: "💼" },
  { id: "meal_vouchers", label: "Meal Vouchers",  emoji: "🍽️" },
  { id: "flexi",         label: "Flexi Pass",     emoji: "💳" },
  { id: "trading",       label: "Trading",        emoji: "📈" },
  { id: "independence",  label: "Independence",   emoji: "🏦" },
  { id: "income",        label: "Income",         emoji: "💰" },
  { id: "invested",      label: "Invested",       emoji: "🪙" },
  { id: "saved",         label: "Saved",          emoji: "🐖" },
];

export const EXPENSE_CATEGORIES = [
  { id: "rent",          label: "Rent",           emoji: "🏠" },
  { id: "energy",        label: "Energy",         emoji: "🔥" },
  { id: "electricity",   label: "Electricity",    emoji: "⚡" },
  { id: "internet",      label: "Internet",       emoji: "🌐" },
  { id: "phone",         label: "Phone",          emoji: "📱" },
  { id: "insurance",     label: "Insurance",      emoji: "🛡️" },
  { id: "groceries",     label: "Groceries",      emoji: "🛒" },
  { id: "household",     label: "Household",      emoji: "🏡" },
  { id: "transport",     label: "Transport",      emoji: "🚗" },
  { id: "clothing",      label: "Clothing",       emoji: "👕" },
  { id: "multisport",    label: "Multisport",     emoji: "🏋️" },
  { id: "subscription",  label: "Subscription",   emoji: "📺" },
  { id: "dining",        label: "Dining Out",     emoji: "🍕" },
  { id: "alza",          label: "Alza",           emoji: "🖥️" },
  { id: "entertainment", label: "Entertainment",  emoji: "🎉" },
  { id: "essentials",    label: "Essentials",     emoji: "🧴" },
  { id: "other_expense", label: "Other Expenses", emoji: "📦" },
  { id: "expenses",      label: "Expenses",       emoji: "💸" },
  { id: "other",         label: "Other",          emoji: "❓" },
];

export const ALL_CATEGORIES = [...INCOME_CATEGORIES, ...EXPENSE_CATEGORIES];

export function getCategoryById(id) {
  return ALL_CATEGORIES.find(c => c.id === id) || { id, label: id, emoji: "❓" };
}

export function getDefaultType(categoryId) {
  return INCOME_CATEGORIES.find(c => c.id === categoryId) ? "income" : "expense";
}

export const CATEGORY_COLORS = {
  income:  "#1D9E75",
  expense: "#D85A30",
  byId: {
    salary:        "#1D9E75",
    meal_vouchers: "#5DCAA5",
    flexi:         "#9FE1CB",
    trading:       "#378ADD",
    independence:  "#185FA5",
    income:        "#0C447C",
    invested:      "#63B3ED",
    saved:         "#9FE1CB",
    rent:          "#D85A30",
    energy:        "#EF9F27",
    electricity:   "#FAC775",
    internet:      "#7F77DD",
    phone:         "#534AB7",
    insurance:     "#888780",
    groceries:     "#D4537E",
    household:     "#993556",
    transport:     "#BA7517",
    clothing:      "#F0997B",
    multisport:    "#5DCAA5",
    subscription:  "#AFA9EC",
    dining:        "#D85A30",
    alza:          "#185FA5",
    entertainment: "#7F77DD",
    essentials:    "#B4B2A9",
    other_expense: "#888780",
    expenses:      "#F5C4B3",
    other:         "#D3D1C7",
  }
};
