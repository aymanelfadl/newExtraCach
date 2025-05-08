import { db, auth } from './firebase.mjs';
import { 
  collection, 
  doc, 
  setDoc, 
  addDoc, 
  serverTimestamp 
} from 'firebase/firestore';
import { 
  createUserWithEmailAndPassword 
} from 'firebase/auth';

const randomNumber = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

const formatDate = (date) => {
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
};

const randomPastDate = (days = 60) => {
  const date = new Date();
  date.setDate(date.getDate() - randomNumber(0, days));
  return date;
};

const generateUsers = async () => {
  try {
    console.log('Generating test users...');
    const testUsers = [
      {
        email: 'test@example.com',
        password: 'password123',
        fullName: 'User Test',
      },
      {
        email: 'admin@example.com',
        password: 'password123',
        fullName: 'Admin User',
      },
      {
        email: 'manager@example.com',
        password: 'password123',
        fullName: 'Manager User',
      }
    ];

    const createdUsers = [];

    for (const user of testUsers) {
      try {
        // Create user with Firebase Auth
        const userCredential = await createUserWithEmailAndPassword(
          auth, 
          user.email, 
          user.password
        );
        
        // Add user info to Firestore
        await setDoc(doc(db, 'users', userCredential.user.uid), {
          uid: userCredential.user.uid,
          email: user.email,
          fullName: user.fullName,
          createdAt: new Date().toISOString(),
          sharedAccess: [],
          hasAccessTo: [],
        });
        
        createdUsers.push({
          uid: userCredential.user.uid,
          ...user
        });
        
        console.log(`Created user: ${user.email}`);
      } catch (error) {
        console.error(`Error creating user ${user.email}:`, error.message);
      }
    }

    // Setup shared access between users
    if (createdUsers.length >= 2) {
      // Give first user access to second user's account
      const firstUserUid = createdUsers[0].uid;
      const secondUserUid = createdUsers[1].uid;
      
      // Update first user's sharedAccess
      await setDoc(doc(db, 'users', firstUserUid), { 
        sharedAccess: [secondUserUid] 
      }, { merge: true });
      
      // Update second user's hasAccessTo
      await setDoc(doc(db, 'users', secondUserUid), { 
        hasAccessTo: [firstUserUid] 
      }, { merge: true });
      
      console.log(`Set up shared access between ${createdUsers[0].email} and ${createdUsers[1].email}`);
    }

    return createdUsers;
  } catch (error) {
    console.error('Error generating users:', error);
    return [];
  }
};

// Generate expense categories
const expenseCategories = [
  'Fourniture', 'Loyer', 'Salaires', 'Marketing', 
  'Transport', 'Équipement', 'Services', 'Alimentation', 
  'Assurance', 'Téléphone/Internet', 'Maintenance', 'Divers'
];

// Generate revenue categories
const revenueCategories = [
  'Ventes', 'Services', 'Conseils', 'Commissions', 
  'Location', 'Intérêts', 'Abonnements', 'Remboursements', 
  'Publicité', 'Divers'
];

// Generate expense descriptions
const expenseDescriptions = [
  'Achat de fournitures de bureau',
  'Loyer mensuel',
  'Salaire employé',
  'Campagne publicitaire',
  'Frais de transport',
  'Achat d\'équipement informatique',
  'Services comptables',
  'Déjeuner d\'affaires',
  'Prime d\'assurance',
  'Facture téléphonique',
  'Réparation et entretien',
  'Frais bancaires'
];

// Generate revenue descriptions
const revenueDescriptions = [
  'Vente de produits',
  'Prestation de services',
  'Services de conseil',
  'Commission sur ventes',
  'Revenus locatifs',
  'Intérêts bancaires',
  'Abonnements clients',
  'Remboursement assurance',
  'Revenus publicitaires',
  'Remise fournisseur'
];

// Generate test transactions
const generateTransactions = async (userId) => {
  try {
    console.log(`Generating transactions for user ${userId}...`);
    
    // Generate 15-30 expenses
    const expenseCount = randomNumber(15, 30);
    for (let i = 0; i < expenseCount; i++) {
      const randomDate = randomPastDate();
      const amount = randomNumber(50, 2000);
      const category = expenseCategories[randomNumber(0, expenseCategories.length - 1)];
      const description = expenseDescriptions[randomNumber(0, expenseDescriptions.length - 1)];
      
      await addDoc(collection(db, 'transactions'), {
        userId: userId,
        description: description,
        amount: amount,
        spends: amount,
        type: 'expense',
        isExpense: true,
        category: category,
        date: formatDate(randomDate),
        dateAdded: formatDate(randomDate),
        createdAt: randomDate.toISOString(),
        time: randomDate.toLocaleTimeString('fr-FR', {hour: '2-digit', minute:'2-digit'}),
        updatedAt: randomDate.toISOString(),
      });
    }
    console.log(`Created ${expenseCount} expenses for user ${userId}`);
    
    // Generate 10-20 revenues
    const revenueCount = randomNumber(10, 20);
    for (let i = 0; i < revenueCount; i++) {
      const randomDate = randomPastDate();
      const amount = randomNumber(200, 5000);
      const category = revenueCategories[randomNumber(0, revenueCategories.length - 1)];
      const description = revenueDescriptions[randomNumber(0, revenueDescriptions.length - 1)];
      
      await addDoc(collection(db, 'transactions'), {
        userId: userId,
        description: description,
        amount: amount,
        spends: amount,
        type: 'revenue',
        isExpense: false,
        category: category,
        date: formatDate(randomDate),
        dateAdded: formatDate(randomDate),
        createdAt: randomDate.toISOString(),
        time: randomDate.toLocaleTimeString('fr-FR', {hour: '2-digit', minute:'2-digit'}),
        updatedAt: randomDate.toISOString(),
      });
    }
    console.log(`Created ${revenueCount} revenues for user ${userId}`);
  } catch (error) {
    console.error('Error generating transactions:', error);
  }
};

// Generate test employees
const generateEmployees = async (userId) => {
  try {
    console.log(`Generating employees for user ${userId}...`);
    
    const employeeNames = [
      'Ahmed Benani', 'Fatima Alaoui', 'Mohammed Radi', 
      'Samira Tazi', 'Karim Belhaj', 'Naima Fassi',
      'Rachid Benjelloun', 'Leila Mourad', 'Younes Hassani'
    ];    
    const positions = [
      'Vendeur', 'Caissier', 'Assistant', 
      'Technicien', 'Agent', 'Serveur', 
      'Opérateur', 'Commercial', 'Livreur'
    ];
    
    const employeeCount = randomNumber(3, 6);
    
    for (let i = 0; i < employeeCount; i++) {
      const name = employeeNames[randomNumber(0, employeeNames.length - 1)];
      const position = positions[randomNumber(0, positions.length - 1)];
      const salary = randomNumber(2500, 6000);
      const creationDate = randomPastDate(90);
      
      // Generate random historical balance
      const balance = randomNumber(-2000, 3000);
      
      // Generate random payments
      const payments = [];
      const paymentCount = randomNumber(2, 8);
      
      for (let j = 0; j < paymentCount; j++) {
        const paymentDate = randomPastDate(60);
        const paymentAmount = randomNumber(500, 2000);
        
        payments.push({
          id: `payment_${Date.now()}_${j}`,
          description: `Salaire ${formatDate(paymentDate)}`,
          amount: paymentAmount,
          date: formatDate(paymentDate),
          createdAt: paymentDate.toISOString(),
        });
      }
      
      // Sort payments by date (newest first)
      payments.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      
      const lastPayment = payments.length > 0 ? formatDate(new Date(payments[0].createdAt)) : null;
      
      const employeeRef = await addDoc(collection(db, 'employees'), {
        userId: userId,
        name: name,
        position: position,
        salary: salary,
        balance: balance,
        payments: payments,
        lastPayment: lastPayment,
        createdAt: creationDate.toISOString(),
        updatedAt: new Date().toISOString(),
      });
      
      console.log(`Created employee: ${name}`);
    }
    
    console.log(`Created ${employeeCount} employees for user ${userId}`);
  } catch (error) {
    console.error('Error generating employees:', error);
  }
};

// Generate today's transactions for demo purposes
const generateTodayTransactions = async (userId) => {
  try {
    console.log(`Generating today's transactions for user ${userId}...`);
    
    const today = new Date();
    const todayFormatted = formatDate(today);
    
    // Add 2-4 expenses for today
    const expenseCount = randomNumber(2, 4);
    for (let i = 0; i < expenseCount; i++) {
      const amount = randomNumber(50, 500);
      const category = expenseCategories[randomNumber(0, expenseCategories.length - 1)];
      const description = expenseDescriptions[randomNumber(0, expenseDescriptions.length - 1)];
      const time = `${randomNumber(8, 17)}:${randomNumber(0, 59).toString().padStart(2, '0')}`;
      
      await addDoc(collection(db, 'transactions'), {
        userId: userId,
        description: description,
        amount: amount,
        spends: amount,
        type: 'expense',
        isExpense: true,
        category: category,
        date: todayFormatted,
        dateAdded: todayFormatted,
        createdAt: new Date().toISOString(),
        time: time,
        updatedAt: new Date().toISOString(),
      });
    }
    
    // Add 1-3 revenues for today
    const revenueCount = randomNumber(1, 3);
    for (let i = 0; i < revenueCount; i++) {
      const amount = randomNumber(200, 1000);
      const category = revenueCategories[randomNumber(0, revenueCategories.length - 1)];
      const description = revenueDescriptions[randomNumber(0, revenueDescriptions.length - 1)];
      const time = `${randomNumber(8, 17)}:${randomNumber(0, 59).toString().padStart(2, '0')}`;
      
      await addDoc(collection(db, 'transactions'), {
        userId: userId,
        description: description,
        amount: amount,
        spends: amount,
        type: 'revenue',
        isExpense: false,
        category: category,
        date: todayFormatted,
        dateAdded: todayFormatted,
        createdAt: new Date().toISOString(),
        time: time,
        updatedAt: new Date().toISOString(),
      });
    }
    
    console.log(`Created ${expenseCount} expenses and ${revenueCount} revenues for today`);
  } catch (error) {
    console.error('Error generating today\'s transactions:', error);
  }
};

// Main function to run the test data generation
const generateTestData = async () => {
  try {
    // 1. Create test users
    const users = await generateUsers();
    
    if (users.length > 0) {
      const mainUserId = users[0].uid;
      
      // 2. Generate transactions for the first user
      await generateTransactions(mainUserId);
      
      // 3. Generate employees for the first user
      await generateEmployees(mainUserId);
      
      // 4. Generate today's transactions
      await generateTodayTransactions(mainUserId);
      
      console.log('Test data generation completed successfully!');
      console.log('Login with test@example.com / password123');
    } else {
      console.log('No users were created. Test data generation failed.');
    }
  } catch (error) {
    console.error('Error in test data generation:', error);
  }
};

// Run the generator
generateTestData();