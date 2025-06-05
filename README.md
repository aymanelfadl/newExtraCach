# ExtraCash

ExtraCash is a modern mobile app for managing personal and small business finances. It allows you to track expenses, revenues, employee payments, and more, with a beautiful dashboard and easy-to-use interface.

## Features
- **Dashboard**: Visual summary of your finances (revenues, expenses, employee payments, and balance)
- **Expense & Revenue Tracking**: Add, edit, and delete transactions with date and description
- **Employee Management**: Add employees, track their payments, and view details
- **Data Export**: Export your data to Excel for backup or analysis
- **Data Archiving**: Archive old transactions to keep your app fast and organized
- **Shared Accounts**: View accounts shared with you (read-only)
- **Offline Mode**: Continue working without internet; data syncs when back online
- **Modern UI**: Clean, mobile-first design with quick actions and summaries

## Screenshots
Screenshots and diagrams are available in the `stage/screens/` and `stage/diagrams/` folders.

## Setup & Installation
1. **Clone the repository**
2. **Install dependencies**:
   ```sh
   npm install
   ```
3. **Start the app** (Expo):
   ```sh
   npx expo start
   ```
4. **Configure Firebase**: Update your Firebase credentials in `services/firebase.js`.

## Folder Structure
- `app/screens/` — Main app screens (Dashboard, Home, Employees, Expense, Revenue, Settings, etc.)
- `components/` — Reusable UI components (AddExpense, AddRevenue, CardList, etc.)
- `services/` — Business logic and data services (Firebase, user, employee, transaction)
- `context/` — React context for user/session management
- `assets/` — Images and logos
- `stage/` — Screenshots, diagrams, and reports
- `scripts/` — Utility scripts (e.g., generate test data)

## Reports
Find the full project report and documentation in `stage/rapport/` (PDF and Markdown).

## Contact
For questions or support, see the report or contact the project maintainer.

---
*Made with ❤️ for ExtraSys Maroc internship project.*