Do NOT modify, redesign, or restructure any existing screens in the current Smart Inventory Recommendation System UI.

Preserve:

- All layouts

- Colors

- Typography

- Components

- Dashboard, Inventory, and Analytics screens exactly as they are

-----------------------------------

ADD A NEW FEATURE AS A SEPARATE MODULE:

Create a new screen called:

"Quick Billing" or "POS Mode"

This should be an independent screen accessible via:

- A new button in the header OR

- A floating action button (FAB) OR

- A sidebar menu item

Do NOT disturb existing layouts while adding this entry point.

-----------------------------------

NEW SCREEN: QUICK BILLING / POS

Purpose:

Allow users to search products, add them to a cart, calculate total, and proceed to payment.

-----------------------------------

UI STRUCTURE:

1. Header

- Title: "Quick Billing"

- Back button

-----------------------------------

2. Product Search

- Search bar ("Search product...")

- Dropdown suggestions with:

   - Product name

   - Price

   - Stock

-----------------------------------

3. Cart Section

- Selected products list:

   - Product name

   - Price

   - Quantity stepper (+ / -)

   - Item total

- Remove item option

-----------------------------------

4. Price Summary

- Subtotal

- Discount (optional)

- Tax (optional)

- Final Total (highlighted)

-----------------------------------

5. Stock Awareness

- Show:

   “Available: X | After sale: Y”

- Warning if exceeded stock

-----------------------------------

6. Action Button

- “Proceed to Payment”

-----------------------------------

7. Payment Screen (Separate)

- Payment options:

   - Cash

   - UPI

   - Card

- Final amount display

- “Confirm Payment” button

-----------------------------------

UX RULES:

- Adding products updates cart instantly

- Quantity updates recalculate total in real-time

- On payment success:

   → Show success message

   → (Conceptually) reduce stock

-----------------------------------

IMPORTANT RULES:

- Do NOT modify existing screens

- Do NOT change dashboard or inventory layout

- Do NOT reposition existing elements

- Only ADD new screen and minimal entry point

- Maintain same design system for consistency

-----------------------------------

GOAL:

Extend the system with a billing/POS feature while keeping the current UI completely untouched and consistent.