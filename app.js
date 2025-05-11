require("dotenv").config();
const express = require("express");
const app = express();
const userRouter = require("./api/users/user.router");
const expenseRouter = require("./api/expenses/expenses.router");
const personal_budgetRouter = require("./api/expenses/personal-budgets.router");
const groupRouter = require('./api/grp_expenses/group.router');
const expensePredictionRouter = require("./api/expenses/expensePrediction.router");
const ExpenseClassifier = require('./api/expenses/expenseClassifier.service'); 
const groupExpensesRouter = require('./api/grp_expenses/groupExpenses.router');
const cors = require('cors')
app.use(express.json());


ExpenseClassifier.loadTrainingData()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch(err => {
    console.error('Failed to initialize classifier:', err);
  });
  
app.use(cors({
  origin: 'http://localhost:5173', 
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization'] 
}));

app.use((req, res, next) => {
  console.log(`Incoming ${req.method} request to: ${req.url}`);
  next();
}); 

app.use('/api/users', userRouter);
app.use('/api/expenses', expenseRouter)
app.use('/api/personal-budgets', personal_budgetRouter)
app.use('/api/grp_expenses', groupRouter);
app.use('/api/predictions', expensePredictionRouter);
app.use('/api/grp_expenses', groupExpensesRouter); 

const PORT = process.env.APP_PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

