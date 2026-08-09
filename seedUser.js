const BASE_URL = "http://localhost:3000/api";

const DEMO_USER = {
  name: "Mohamed Wael",
  email: "test@gmail.com",
  password: "Asdf123.",
};

// --------------------------------------------------
// API helper
// --------------------------------------------------

async function api(path, options = {}, token = null) {
  const response = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token
        ? {
            Authorization: `Bearer ${token}`,
          }
        : {}),
      ...(options.headers || {}),
    },
  });

  const body = await response.json().catch(() => null);

  if (!response.ok) {
    const error = new Error(body?.message || `Request failed: ${response.status}`);
    error.status = response.status;
    throw error;
  }

  return body;
}

// --------------------------------------------------
// Authentication
// --------------------------------------------------

async function getDemoUser() {
  console.log("🔐 Logging in as demo user...");

  try {
    const result = await api("/auth/login", {
      method: "POST",
      body: JSON.stringify({
        email: DEMO_USER.email,
        password: DEMO_USER.password,
      }),
    });

    console.log("✅ Demo user already exists.");
    return result.data;
  } catch (error) {
    if (error.status !== 401) {
      throw error;
    }

    console.log("👤 Demo user doesn't exist. Creating it...");

    const result = await api("/auth/register", {
      method: "POST",
      body: JSON.stringify(DEMO_USER),
    });

    console.log("✅ Demo user created.");

    return result.data;
  }
}

// --------------------------------------------------
// Categories
// --------------------------------------------------

const CUSTOM_CATEGORIES = [
  "Health & Fitness",
  "Shopping",
  "Subscriptions",
  "Travel",
  "Personal Care",
];

async function getOrCreateCategories(token) {
  const result = await api("/categories", {}, token);

  const categories = result.data;

  for (const categoryName of CUSTOM_CATEGORIES) {
    const existing = categories.find(
      (category) =>
        category.name.toLowerCase() === categoryName.toLowerCase()
    );

    if (existing) {
      console.log(`   ✓ Category exists: ${categoryName}`);
      continue;
    }

    const created = await api(
      "/categories",
      {
        method: "POST",
        body: JSON.stringify({
          name: categoryName,
        }),
      },
      token
    );

    categories.push(created.data);

    console.log(`   + Created category: ${categoryName}`);
  }

  return categories;
}

// --------------------------------------------------
// Demo expenses
// --------------------------------------------------

const EXPENSES = [
  // ============================================================
  // MARCH 2026
  // ============================================================

  // Food
  { amount: 6.25, description: "Morning coffee", date: "2026-03-02", category: "Food" },
  { amount: 54.80, description: "Weekly groceries", date: "2026-03-03", category: "Food" },
  { amount: 22.50, description: "Lunch with coworkers", date: "2026-03-05", category: "Food" },
  { amount: 38.90, description: "Dinner with friends", date: "2026-03-08", category: "Food" },
  { amount: 67.30, description: "Supermarket shopping", date: "2026-03-12", category: "Food" },
  { amount: 14.75, description: "Coffee and pastry", date: "2026-03-17", category: "Food" },
  { amount: 43.20, description: "Weekend brunch", date: "2026-03-22", category: "Food" },
  { amount: 59.40, description: "Monthly groceries", date: "2026-03-27", category: "Food" },

  // Transport
  { amount: 35.00, description: "Fuel", date: "2026-03-01", category: "Transport" },
  { amount: 12.50, description: "Metro card", date: "2026-03-04", category: "Transport" },
  { amount: 17.80, description: "Ride downtown", date: "2026-03-09", category: "Transport" },
  { amount: 31.00, description: "Fuel", date: "2026-03-18", category: "Transport" },
  { amount: 14.20, description: "Taxi home", date: "2026-03-25", category: "Transport" },

  // Utilities
  { amount: 68.40, description: "Electricity bill", date: "2026-03-03", category: "Utilities" },
  { amount: 45.00, description: "Internet bill", date: "2026-03-05", category: "Utilities" },
  { amount: 19.50, description: "Mobile phone bill", date: "2026-03-07", category: "Utilities" },

  // Entertainment
  { amount: 14.99, description: "Movie night", date: "2026-03-06", category: "Entertainment" },
  { amount: 32.00, description: "Bowling with friends", date: "2026-03-14", category: "Entertainment" },
  { amount: 11.50, description: "Game night", date: "2026-03-21", category: "Entertainment" },

  // Shopping
  { amount: 49.99, description: "New backpack", date: "2026-03-10", category: "Shopping" },
  { amount: 27.50, description: "Home supplies", date: "2026-03-16", category: "Shopping" },
  { amount: 84.00, description: "Spring clothing", date: "2026-03-24", category: "Shopping" },

  // Subscriptions
  { amount: 14.99, description: "Music subscription", date: "2026-03-01", category: "Subscriptions" },
  { amount: 19.99, description: "Streaming service", date: "2026-03-03", category: "Subscriptions" },
  { amount: 12.99, description: "Cloud storage", date: "2026-03-08", category: "Subscriptions" },

  // Health
  { amount: 45.00, description: "Gym membership", date: "2026-03-01", category: "Health & Fitness" },
  { amount: 18.50, description: "Fitness class", date: "2026-03-15", category: "Health & Fitness" },

  // Personal
  { amount: 35.00, description: "Haircut", date: "2026-03-20", category: "Personal Care" },

  // ============================================================
  // APRIL 2026
  // ============================================================

  { amount: 5.50, description: "Morning coffee", date: "2026-04-02", category: "Food" },
  { amount: 72.40, description: "Weekly groceries", date: "2026-04-04", category: "Food" },
  { amount: 19.80, description: "Lunch downtown", date: "2026-04-07", category: "Food" },
  { amount: 45.60, description: "Dinner delivery", date: "2026-04-11", category: "Food" },
  { amount: 61.20, description: "Supermarket shopping", date: "2026-04-14", category: "Food" },
  { amount: 28.50, description: "Weekend brunch", date: "2026-04-19", category: "Food" },
  { amount: 52.80, description: "Groceries", date: "2026-04-26", category: "Food" },

  { amount: 40.00, description: "Fuel", date: "2026-04-01", category: "Transport" },
  { amount: 15.00, description: "Metro card", date: "2026-04-06", category: "Transport" },
  { amount: 21.50, description: "Ride home", date: "2026-04-12", category: "Transport" },
  { amount: 38.00, description: "Fuel", date: "2026-04-22", category: "Transport" },

  { amount: 74.20, description: "Electricity bill", date: "2026-04-03", category: "Utilities" },
  { amount: 45.00, description: "Internet bill", date: "2026-04-05", category: "Utilities" },
  { amount: 18.90, description: "Mobile phone bill", date: "2026-04-07", category: "Utilities" },

  { amount: 16.99, description: "Movie tickets", date: "2026-04-09", category: "Entertainment" },
  { amount: 42.00, description: "Concert night", date: "2026-04-18", category: "Entertainment" },

  { amount: 65.00, description: "New sneakers", date: "2026-04-08", category: "Shopping" },
  { amount: 29.90, description: "Kitchen supplies", date: "2026-04-15", category: "Shopping" },
  { amount: 119.00, description: "Spring jacket", date: "2026-04-21", category: "Shopping" },

  { amount: 14.99, description: "Music subscription", date: "2026-04-01", category: "Subscriptions" },
  { amount: 19.99, description: "Streaming service", date: "2026-04-03", category: "Subscriptions" },
  { amount: 12.99, description: "Cloud storage", date: "2026-04-05", category: "Subscriptions" },

  { amount: 45.00, description: "Gym membership", date: "2026-04-01", category: "Health & Fitness" },
  { amount: 20.00, description: "Yoga class", date: "2026-04-13", category: "Health & Fitness" },
  { amount: 15.75, description: "Vitamins", date: "2026-04-20", category: "Health & Fitness" },

  { amount: 38.00, description: "Haircut", date: "2026-04-17", category: "Personal Care" },
  { amount: 24.00, description: "Skincare products", date: "2026-04-24", category: "Personal Care" },

  // ============================================================
  // MAY 2026
  // ============================================================

  { amount: 6.00, description: "Coffee", date: "2026-05-01", category: "Food" },
  { amount: 64.70, description: "Weekly groceries", date: "2026-05-03", category: "Food" },
  { amount: 23.40, description: "Lunch", date: "2026-05-06", category: "Food" },
  { amount: 41.90, description: "Dinner with friends", date: "2026-05-09", category: "Food" },
  { amount: 76.20, description: "Monthly groceries", date: "2026-05-14", category: "Food" },
  { amount: 15.50, description: "Coffee and pastry", date: "2026-05-19", category: "Food" },
  { amount: 49.80, description: "Weekend brunch", date: "2026-05-24", category: "Food" },
  { amount: 58.30, description: "Supermarket shopping", date: "2026-05-28", category: "Food" },

  { amount: 36.00, description: "Fuel", date: "2026-05-02", category: "Transport" },
  { amount: 12.50, description: "Metro card", date: "2026-05-07", category: "Transport" },
  { amount: 19.90, description: "Ride downtown", date: "2026-05-13", category: "Transport" },
  { amount: 42.00, description: "Fuel", date: "2026-05-23", category: "Transport" },
  { amount: 15.00, description: "Taxi", date: "2026-05-30", category: "Transport" },

  { amount: 71.50, description: "Electricity bill", date: "2026-05-03", category: "Utilities" },
  { amount: 45.00, description: "Internet bill", date: "2026-05-05", category: "Utilities" },
  { amount: 20.25, description: "Mobile phone bill", date: "2026-05-07", category: "Utilities" },

  { amount: 12.99, description: "Cinema ticket", date: "2026-05-08", category: "Entertainment" },
  { amount: 35.00, description: "Dinner and bowling", date: "2026-05-16", category: "Entertainment" },
  { amount: 25.00, description: "Museum tickets", date: "2026-05-23", category: "Entertainment" },

  { amount: 79.99, description: "Running shoes", date: "2026-05-05", category: "Shopping" },
  { amount: 42.50, description: "Home decor", date: "2026-05-12", category: "Shopping" },
  { amount: 95.00, description: "Summer clothes", date: "2026-05-20", category: "Shopping" },

  { amount: 14.99, description: "Music subscription", date: "2026-05-01", category: "Subscriptions" },
  { amount: 19.99, description: "Streaming service", date: "2026-05-03", category: "Subscriptions" },
  { amount: 12.99, description: "Cloud storage", date: "2026-05-05", category: "Subscriptions" },
  { amount: 9.99, description: "Productivity app", date: "2026-05-10", category: "Subscriptions" },

  { amount: 45.00, description: "Gym membership", date: "2026-05-01", category: "Health & Fitness" },
  { amount: 22.50, description: "Yoga class", date: "2026-05-14", category: "Health & Fitness" },
  { amount: 17.00, description: "Protein & vitamins", date: "2026-05-22", category: "Health & Fitness" },

  { amount: 40.00, description: "Haircut", date: "2026-05-18", category: "Personal Care" },

  // Travel
  { amount: 145.00, description: "Weekend hotel deposit", date: "2026-05-17", category: "Travel" },
  { amount: 52.00, description: "Train tickets", date: "2026-05-19", category: "Travel" },

  // ============================================================
  // JUNE 2026
  // ============================================================

  { amount: 5.75, description: "Morning coffee", date: "2026-06-01", category: "Food" },
  { amount: 69.40, description: "Weekly groceries", date: "2026-06-03", category: "Food" },
  { amount: 25.50, description: "Lunch with coworkers", date: "2026-06-05", category: "Food" },
  { amount: 46.80, description: "Dinner out", date: "2026-06-08", category: "Food" },
  { amount: 73.20, description: "Supermarket shopping", date: "2026-06-13", category: "Food" },
  { amount: 17.50, description: "Coffee and pastry", date: "2026-06-17", category: "Food" },
  { amount: 44.90, description: "Weekend brunch", date: "2026-06-21", category: "Food" },
  { amount: 62.30, description: "Monthly groceries", date: "2026-06-27", category: "Food" },

  { amount: 38.00, description: "Fuel", date: "2026-06-02", category: "Transport" },
  { amount: 15.00, description: "Metro card", date: "2026-06-06", category: "Transport" },
  { amount: 22.40, description: "Ride downtown", date: "2026-06-11", category: "Transport" },
  { amount: 35.00, description: "Fuel", date: "2026-06-19", category: "Transport" },
  { amount: 18.00, description: "Airport shuttle", date: "2026-06-25", category: "Transport" },

  { amount: 76.80, description: "Electricity bill", date: "2026-06-03", category: "Utilities" },
  { amount: 45.00, description: "Internet bill", date: "2026-06-05", category: "Utilities" },
  { amount: 19.90, description: "Mobile phone bill", date: "2026-06-07", category: "Utilities" },

  { amount: 15.99, description: "Movie night", date: "2026-06-06", category: "Entertainment" },
  { amount: 55.00, description: "Live music", date: "2026-06-14", category: "Entertainment" },
  { amount: 18.00, description: "Arcade night", date: "2026-06-22", category: "Entertainment" },

  { amount: 89.99, description: "Running shoes", date: "2026-06-08", category: "Shopping" },
  { amount: 34.90, description: "Home office supplies", date: "2026-06-15", category: "Shopping" },
  { amount: 74.50, description: "Summer clothing", date: "2026-06-23", category: "Shopping" },

  { amount: 14.99, description: "Music subscription", date: "2026-06-01", category: "Subscriptions" },
  { amount: 19.99, description: "Streaming service", date: "2026-06-03", category: "Subscriptions" },
  { amount: 12.99, description: "Cloud storage", date: "2026-06-05", category: "Subscriptions" },

  { amount: 45.00, description: "Gym membership", date: "2026-06-01", category: "Health & Fitness" },
  { amount: 25.00, description: "Fitness class", date: "2026-06-12", category: "Health & Fitness" },
  { amount: 18.75, description: "Protein & vitamins", date: "2026-06-20", category: "Health & Fitness" },

  { amount: 40.00, description: "Haircut", date: "2026-06-16", category: "Personal Care" },
  { amount: 26.50, description: "Skincare products", date: "2026-06-24", category: "Personal Care" },

  { amount: 210.00, description: "Weekend hotel", date: "2026-06-18", category: "Travel" },
  { amount: 72.00, description: "Train tickets", date: "2026-06-19", category: "Travel" },

  // ============================================================
  // JULY 2026
  // ============================================================

  { amount: 6.00, description: "Morning coffee", date: "2026-07-01", category: "Food" },
  { amount: 78.50, description: "Weekly groceries", date: "2026-07-03", category: "Food" },
  { amount: 26.80, description: "Lunch downtown", date: "2026-07-05", category: "Food" },
  { amount: 52.00, description: "Dinner with friends", date: "2026-07-09", category: "Food" },
  { amount: 83.40, description: "Supermarket shopping", date: "2026-07-13", category: "Food" },
  { amount: 16.75, description: "Coffee and pastry", date: "2026-07-17", category: "Food" },
  { amount: 47.50, description: "Weekend brunch", date: "2026-07-21", category: "Food" },
  { amount: 69.80, description: "Monthly groceries", date: "2026-07-27", category: "Food" },

  { amount: 42.00, description: "Fuel", date: "2026-07-02", category: "Transport" },
  { amount: 15.00, description: "Metro card", date: "2026-07-06", category: "Transport" },
  { amount: 19.50, description: "Ride downtown", date: "2026-07-11", category: "Transport" },
  { amount: 45.00, description: "Fuel", date: "2026-07-19", category: "Transport" },
  { amount: 16.50, description: "Taxi home", date: "2026-07-25", category: "Transport" },

  { amount: 81.20, description: "Electricity bill", date: "2026-07-03", category: "Utilities" },
  { amount: 45.00, description: "Internet bill", date: "2026-07-05", category: "Utilities" },
  { amount: 20.10, description: "Mobile phone bill", date: "2026-07-07", category: "Utilities" },

  { amount: 17.99, description: "Cinema", date: "2026-07-07", category: "Entertainment" },
  { amount: 48.00, description: "Concert", date: "2026-07-15", category: "Entertainment" },
  { amount: 22.00, description: "Arcade night", date: "2026-07-23", category: "Entertainment" },

  { amount: 129.00, description: "Summer clothes", date: "2026-07-06", category: "Shopping" },
  { amount: 59.90, description: "Home supplies", date: "2026-07-14", category: "Shopping" },
  { amount: 95.00, description: "Electronics accessories", date: "2026-07-22", category: "Shopping" },

  { amount: 14.99, description: "Music subscription", date: "2026-07-01", category: "Subscriptions" },
  { amount: 19.99, description: "Streaming service", date: "2026-07-03", category: "Subscriptions" },
  { amount: 12.99, description: "Cloud storage", date: "2026-07-05", category: "Subscriptions" },
  { amount: 29.00, description: "Design software", date: "2026-07-08", category: "Subscriptions" },

  { amount: 45.00, description: "Gym membership", date: "2026-07-01", category: "Health & Fitness" },
  { amount: 24.50, description: "Yoga class", date: "2026-07-12", category: "Health & Fitness" },
  { amount: 19.75, description: "Supplements", date: "2026-07-20", category: "Health & Fitness" },

  { amount: 42.00, description: "Haircut", date: "2026-07-18", category: "Personal Care" },

  { amount: 320.00, description: "Weekend hotel", date: "2026-07-10", category: "Travel" },
  { amount: 85.00, description: "Train tickets", date: "2026-07-11", category: "Travel" },
  { amount: 45.00, description: "Travel meals", date: "2026-07-12", category: "Travel" },

  // ============================================================
  // AUGUST 2026
  // ============================================================

  { amount: 5.75, description: "Morning coffee & croissant", date: "2026-08-01", category: "Food" },
  { amount: 68.42, description: "Weekly groceries", date: "2026-08-02", category: "Food" },
  { amount: 24.90, description: "Lunch with coworkers", date: "2026-08-03", category: "Food" },
  { amount: 14.50, description: "Pizza night", date: "2026-08-04", category: "Food" },
  { amount: 42.80, description: "Weekend brunch", date: "2026-08-05", category: "Food" },
  { amount: 61.35, description: "Fresh produce & groceries", date: "2026-08-07", category: "Food" },
  { amount: 18.75, description: "Dinner delivery", date: "2026-08-08", category: "Food" },

  { amount: 32.00, description: "Fuel", date: "2026-08-01", category: "Transport" },
  { amount: 12.50, description: "Metro card", date: "2026-08-02", category: "Transport" },
  { amount: 18.40, description: "Ride to downtown", date: "2026-08-04", category: "Transport" },
  { amount: 34.00, description: "Fuel", date: "2026-08-06", category: "Transport" },
  { amount: 16.80, description: "Airport shuttle", date: "2026-08-09", category: "Transport" },

  { amount: 72.40, description: "Electricity bill", date: "2026-08-01", category: "Utilities" },
  { amount: 45.00, description: "Internet bill", date: "2026-08-03", category: "Utilities" },
  { amount: 18.25, description: "Mobile phone bill", date: "2026-08-06", category: "Utilities" },

  { amount: 15.99, description: "Movie night", date: "2026-08-02", category: "Entertainment" },
  { amount: 12.00, description: "Concert ticket deposit", date: "2026-08-05", category: "Entertainment" },
  { amount: 9.99, description: "Arcade night", date: "2026-08-08", category: "Entertainment" },

  { amount: 89.99, description: "New running shoes", date: "2026-08-02", category: "Shopping" },
  { amount: 34.95, description: "Home office organizer", date: "2026-08-04", category: "Shopping" },
  { amount: 129.00, description: "Summer clothing", date: "2026-08-07", category: "Shopping" },

  { amount: 45.00, description: "Gym membership", date: "2026-08-01", category: "Health & Fitness" },
  { amount: 22.50, description: "Yoga class", date: "2026-08-04", category: "Health & Fitness" },
  { amount: 16.75, description: "Protein & vitamins", date: "2026-08-06", category: "Health & Fitness" },

  { amount: 14.99, description: "Music subscription", date: "2026-08-01", category: "Subscriptions" },
  { amount: 19.99, description: "Streaming service", date: "2026-08-03", category: "Subscriptions" },
  { amount: 12.99, description: "Cloud storage", date: "2026-08-05", category: "Subscriptions" },
  { amount: 29.00, description: "Design software", date: "2026-08-08", category: "Subscriptions" },

  { amount: 185.00, description: "Weekend hotel deposit", date: "2026-08-03", category: "Travel" },
  { amount: 64.50, description: "Train tickets", date: "2026-08-06", category: "Travel" },

  { amount: 38.00, description: "Haircut", date: "2026-08-05", category: "Personal Care" },
  { amount: 24.50, description: "Skincare products", date: "2026-08-08", category: "Personal Care" },

  { amount: 20.00, description: "Birthday gift", date: "2026-08-06", category: "Others" },
  { amount: 11.25, description: "Parking", date: "2026-08-09", category: "Others" },
];
// --------------------------------------------------
// Seed expenses
// --------------------------------------------------

async function seedExpenses(token, categories) {
  const categoryMap = new Map(
    categories.map((category) => [
      category.name.toLowerCase(),
      category._id,
    ])
  );

  // Get existing expenses so running this script twice
  // doesn't create duplicates.
  const existingResult = await api("/expenses", {}, token);
  const existingExpenses = existingResult.data;

  let created = 0;
  let skipped = 0;

  for (const expense of EXPENSES) {
    const categoryId = categoryMap.get(expense.category.toLowerCase());

    if (!categoryId) {
      console.log(`❌ Missing category: ${expense.category}`);
      continue;
    }

    const alreadyExists = existingExpenses.some(
      (existing) =>
        Number(existing.amount) === Number(expense.amount) &&
        existing.description === expense.description &&
        existing.date.slice(0, 10) === expense.date
    );

    if (alreadyExists) {
      console.log(`   ↪ Already exists: ${expense.description}`);
      skipped++;
      continue;
    }

    await api(
      "/expenses",
      {
        method: "POST",
        body: JSON.stringify({
          amount: expense.amount,
          description: expense.description,
          date: expense.date,
          categoryId,
        }),
      },
      token
    );

    console.log(
      `   + $${expense.amount.toFixed(2)} — ${expense.description}`
    );

    created++;
  }

  return { created, skipped };
}

// --------------------------------------------------
// Show totals
// --------------------------------------------------

async function showTotals(token) {
  const result = await api(
    "/expenses/totals?startDate=2026-08-01&endDate=2026-08-31",
    {},
    token
  );

  console.log("\n📊 AUGUST 2026 TOTALS");
  console.log("--------------------------------");

  let grandTotal = 0;

  for (const item of result.data) {
    console.log(
      `${item.categoryName.padEnd(20)} $${item.totalAmount
        .toFixed(2)
        .padStart(8)}  (${item.expenseCount} expenses)`
    );

    grandTotal += item.totalAmount;
  }

  console.log("--------------------------------");
  console.log(`TOTAL                  $${grandTotal.toFixed(2)}`);
}

// --------------------------------------------------
// Main
// --------------------------------------------------

async function main() {
  console.log("");
  console.log("======================================");
  console.log("     EXPENSE TRACKER DEMO SEED");
  console.log("======================================");
  console.log("");

  try {
    const auth = await getDemoUser();

    const token = auth.token;

    console.log(`\n👋 Welcome, ${auth.user.name}!`);

    console.log("\n📁 Setting up categories...");
    const categories = await getOrCreateCategories(token);

    console.log("\n💳 Adding demo expenses...");
    const stats = await seedExpenses(token, categories);

    await showTotals(token);

    console.log("\n======================================");
    console.log("✅ DEMO DATA READY");
    console.log("======================================");
    console.log("");
    console.log("Login credentials:");
    console.log(`Email:    ${DEMO_USER.email}`);
    console.log(`Password: ${DEMO_USER.password}`);
    console.log("");
    console.log(`Created: ${stats.created} expenses`);
    console.log(`Skipped: ${stats.skipped} existing expenses`);
    console.log("");
  } catch (error) {
    console.error("\n❌ SEED FAILED");
    console.error(error.message);

    if (error.status) {
      console.error(`HTTP status: ${error.status}`);
    }

    process.exit(1);
  }
}

main();