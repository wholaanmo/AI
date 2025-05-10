import { createStore } from 'vuex';
import axios from 'axios';
import groupModule from './modules/group'

export default createStore({
  modules: {
    group: groupModule 
  },
  state: {
    viewExpenses: [], // Expenses for view page
    addExpenses: [], 
    expenses: [],
    personalBudgets: [],
    usdExchangeRate: 56.50,
    selectedMonthYear: null ,
    viewPageMonthYear: new Date().getFullYear() + '-' + String(new Date().getMonth() + 1).padStart(2, '0'), // For view page
    addExpenseMonthYear: new Date().getFullYear() + '-' + String(new Date().getMonth() + 1).padStart(2, '0'), // For add expense page
    currentSelectedMonth: new Date().getFullYear() + '-' + String(new Date().getMonth() + 1).padStart(2, '0'),
    globalAlert: null
  },
  getters: {
    getViewExpenses: state => state.viewExpenses,
    getAddExpenses: state => state.addExpenses,
    getViewPageMonthYear: state => state.viewPageMonthYear,
    getAddExpenseMonthYear: state => state.addExpenseMonthYear,
    getExpenses: state => {
      if (!state.expenses || !Array.isArray(state.expenses)) {
        return [];
      }

      const monthYear = state.viewPageMonthYear || 
                       `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;
      
      return state.expenses.filter(expense => {
        if (!expense.expense_date) {
          const now = new Date();
          const currentMonthYear = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
          return monthYear === currentMonthYear;
        }
        
        try {
          const expenseDate = new Date(expense.expense_date);
          const expenseMonthYear = `${expenseDate.getFullYear()}-${String(expenseDate.getMonth() + 1).padStart(2, '0')}`;
          return expenseMonthYear === monthYear;
        } catch (e) {
          console.error('Error parsing expense date:', expense.expense_date, e);
          return true; 
        }
      });
    },
    getPersonalBudgets: state => state.personalBudgets,

    getTotalAmount: (state, getters) => {
      const filteredExpenses = state.addExpenses || [];
      console.log('Calculating total from:', filteredExpenses);
      return filteredExpenses.reduce((sum, expense) => {
        const price = Number(expense?.item_price) || 0;
        return sum + price;
      }, 0);
    },
    getCurrentBudget: (state) => (monthYear) => {
      try {
        const budget = state.personalBudgets.find(
          b => b.month_year === monthYear
        );

        return budget || { 
          month_year: monthYear,
          budget_amount: 0
        };
      } catch (error) {
        console.error("Error in getCurrentBudget:", error);
        return { 
          month_year: monthYear,
          budget_amount: 0
        };
      }
    },

    getAvailableMonths: () => {
      const months = []
      const date = new Date()
      for (let i = 0; i < 12; i++) {
        const year = date.getFullYear()
        const month = String(date.getMonth() + 1).padStart(2, '0')
        months.push(`${year}-${month}`)
        date.setMonth(date.getMonth() + 1)
      }
      return months
    }
  },
  mutations: {
    SET_CURRENT_BUDGET(state, budget) {
      const index = state.personalBudgets.findIndex(b => b.month_year === budget.month_year);
      if (index !== -1) {
        state.personalBudgets.splice(index, 1, budget);
      } else {
        state.personalBudgets.push(budget);
      }
    },
    SET_VIEW_EXPENSES(state, expenses) {
      state.viewExpenses = expenses
    },
    SET_ADD_EXPENSES(state, expenses) {
      state.addExpenses = expenses
    },
    SET_VIEW_PAGE_MONTH_YEAR(state, monthYear) {
      state.viewPageMonthYear = monthYear;
    },
    SET_ADD_EXPENSE_MONTH_YEAR(state, monthYear) {
      state.addExpenseMonthYear = monthYear;
    },

    SET_EXPENSES(state, expenses) {
      state.expenses = expenses
    },
    SET_PERSONAL_BUDGETS(state, budgets) {
      state.personalBudgets = budgets
    },
    SET_EXCHANGE_RATE(state, rate) {
      state.usdExchangeRate = rate
    },
    SET_SELECTED_MONTH_YEAR(state, monthYear) {
      state.selectedMonthYear = monthYear
    },
    SET_GLOBAL_ALERT(state, message) {
      state.globalAlert = message
    },
    ADD_EXPENSE(state, expense) {
      try {
        // Validate the expense object exists
        if (!expense) {
          console.warn('Attempted to add undefined expense');
          return;
        }
    
        // Validate required fields
        if (!expense.id || !expense.item_name) {
          console.error('Invalid expense data - missing required fields:', {
            id: expense.id,
            item_name: expense.item_name,
            fullExpense: expense
          });
          return;
        }
    
        // Create validated expense object with defaults
        const validatedExpense = {
          id: expense.id,
          item_price: Number(expense.item_price) || 0,
          expense_type: expense.expense_type || 'Other',
          item_name: expense.item_name,
          expense_date: expense.expense_date || new Date().toISOString(),
          personal_budget_id: expense.personal_budget_id || null
        };
    
        // Add to both state arrays
        state.expenses.push(validatedExpense);
        state.addExpenses.push(validatedExpense);
    
        console.log('Expense successfully added to store:', validatedExpense);
        
      } catch (error) {
        console.error('Error in ADD_EXPENSE mutation:', {
          error: error.message,
          expenseAttempted: expense,
          stack: error.stack
        });
      }
    },

    UPDATE_EXPENSE(state, updatedExpense) {
      try {
        if (!updatedExpense?.id) {
          console.error('Invalid expense in UPDATE_EXPENSE:', updatedExpense);
          return;
        }
    
        const index = state.addExpenses.findIndex(e => e.id === updatedExpense.id);
        if (index === -1) {
          console.warn('Expense not found for update:', updatedExpense.id);
          return;
        }
        const mergedExpense = {
          ...state.addExpenses[index], // Existing data
          ...updatedExpense,       // Updated fields
          id: updatedExpense.id    // Ensure ID is preserved
        };
        state.addExpenses.splice(index, 1, mergedExpense);
      } catch (error) {
        console.error('Error in UPDATE_EXPENSE:', error);
      }
    },
    DELETE_EXPENSE(state, id) {
      state.addExpenses = state.addExpenses.filter(e => e.id !== id);
    },
    ADD_BUDGET(state, budget) {
      state.personalBudgets.push(budget)
    },
    UPDATE_BUDGET(state, updatedBudget) {
      const index = state.personalBudgets.findIndex(b => b.id === updatedBudget.id)
      if (index !== -1) {
        state.personalBudgets.splice(index, 1, updatedBudget)
      }
    }
  },
  actions: {
    setCurrentMonth({ commit }, monthYear) {
      commit('SET_CURRENT_MONTH', monthYear);
    },
    setSelectedMonthYear({ commit }, monthYear) {
      commit('SET_SELECTED_MONTH_YEAR', monthYear);
    },

    async fetchBudgetForMonth({ commit }, monthYear) {
      try {
        console.log('Fetching budget for month:', monthYear);
        const response = await axios.get(`/api/personal-budgets/month/${monthYear}`, {
          headers: { 
            Authorization: `Bearer ${localStorage.getItem('jsontoken')}` 
          }
        });

        return response.data.data || {
          month_year: monthYear,
          budget_amount: 0
        };
        
      } catch (error) {
        console.error('Error fetching budget:', error);
        return {
          month_year: monthYear,
          budget_amount: 0
        };
      }
    },

    async fetchExchangeRate({ commit }) {
      try {
        const response = await axios.get('https://api.exchangerate.host/latest?base=PHP&symbols=USD')
        console.log('Exchange rate API response:', response.data);
        
        const phpToUsdRate = response.data?.rates?.USD || 0.018045;
        if (!phpToUsdRate) {
          console.warn('USD rate not found in response, using fallback');
        }
        console.log('Current PHP to USD rate:', phpToUsdRate);

        commit('SET_EXCHANGE_RATE', phpToUsdRate);
        return { success: true, rate: phpToUsdRate };
      } catch (error) {
        console.error("Error fetching exchange rate:", error)
        commit('SET_EXCHANGE_RATE', 0.018045);
        return { 
          success: false, 
          message: error.message,
          rate: 0.018045 
        };
      }
    },
    
     async fetchViewExpenses({ commit, state }, { monthYear = null, year = null } = {}) {
      try {
        const params = {};

        if (monthYear) {
          const budget = await this.dispatch('fetchBudgetForMonth', monthYear);
          if (budget?.id) {
            params.personal_budget_id = budget.id;
          }
        }
        
        if (year) {
          params.year = year;
          await this.dispatch('fetchPersonalBudgets', year);
    }
        const response = await axios.get('/api/expenses', {
          headers: { Authorization: `Bearer ${localStorage.getItem('jsontoken')}` },
          params
        });
        commit('SET_VIEW_EXPENSES', response.data.data || [])
        return { success: true }
      } catch (error) {
        console.error("Error fetching view expenses:", error)
        commit('SET_VIEW_EXPENSES', [])
        return { success: false, message: error.message }
      }
    },
    
    async fetchAddExpenses({ commit, state }) {
      try {
        const response = await axios.get('/api/expenses', {
          headers: { Authorization: `Bearer ${localStorage.getItem('jsontoken')}` }
        });

        console.log('API Response:', response.data); 

        commit('SET_ADD_EXPENSES', response.data.data || []);
        return { success: true }
      } catch (error) {
        console.error("Error fetching add expenses:", error)
        commit('SET_ADD_EXPENSES', [])
        return { success: false, message: error.message }
      }
    },

    async fetchPersonalBudgets({ commit }, monthYear = null) {
      try {
        const params = monthYear ? { month_year: monthYear } : {};
        const response = await axios.get('/api/personal-budgets', {
          headers: { Authorization: `Bearer ${localStorage.getItem('jsontoken')}` },
          params
        });
        commit('SET_PERSONAL_BUDGETS', response.data.data || []);
        return { success: true };
      } catch (error) {
        console.error("Error fetching budgets:", error);
        commit('SET_PERSONAL_BUDGETS', []);
        return { success: false, message: error.message };
      }
    },

    async addExpense({ commit, state }, expenseData) {
      try {
        // Validate input data structure
        if (!expenseData || typeof expenseData !== 'object') {
          throw new Error('Invalid expense data');
        }
    
        // Prepare the request payload with defaults
        const payload = {
          item_price: Number(expenseData.item_price) || 0,
          expense_type: expenseData.expense_type || 'Other',
          item_name: expenseData.item_name || 'Unnamed Expense',
          personal_budget_id: expenseData.personal_budget_id
        };
    
        // Make the API request
        const response = await axios.post('/api/expenses', payload, {
          headers: { 
            Authorization: `Bearer ${localStorage.getItem('jsontoken')}`,
            'Content-Type': 'application/json'
          }
        });
    
        // Validate response structure
        if (!response.data) {
          throw new Error('Empty response from server');
        }
    
        if (!response.data.success) {
          console.error('API returned failure:', response.data);
          return { 
            success: false, 
            message: response.data.message || 'API request failed',
            data: response.data.data || null
          };
        }
    
        // Validate response data
        if (!response.data.data) {
          console.error('Missing data in API response');
          return { 
            success: false, 
            message: 'Invalid response format from server',
            data: null
          };
        }
    
        // Update both relevant state portions
        commit('ADD_EXPENSE', response.data.data);
        commit('SET_ADD_EXPENSES', [...state.addExpenses, response.data.data]);
    
        return { 
          success: true,
          data: response.data.data,
          message: 'Expense added successfully'
        };
    
      } catch (error) {
        console.error("Add expense error:", {
          error: error.message,
          response: error.response?.data,
          stack: error.stack
        });
        
        return { 
          success: false, 
          message: error.response?.data?.message || error.message || 'Failed to add expense',
          data: null
        };
      }
    },
async updateExpense({ commit }, { id, expenseData }) {
  try {
    if (!id) {
      throw new Error('Missing expense ID');
    }

    const response = await axios.put(`/api/expenses/${id}`, expenseData, {
      headers: { 
        Authorization: `Bearer ${localStorage.getItem('jsontoken')}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.data) {
      throw new Error('Empty response from server');
    }

    if (response.data.success) {
      const updatedExpense = {
        id: id, 
        ...expenseData, 
        ...response.data.data 
      };
      commit('UPDATE_EXPENSE', updatedExpense);
      return { 
        success: true,
        message: 'Expense updated successfully',
        data: updatedExpense
      };
    }
    return { 
      success: false, 
      message: response.data.message || 'Failed to update expense' 
    };
  } catch (error) {
    console.error("Error updating expense:", error);
    return { 
      success: false, 
      message: error.response?.data?.message || error.message || 'Failed to update expense'
    };
  }
},
async deleteExpense({ commit, dispatch }, id) {
      try {
        const response = await axios.delete(`/api/expenses/${id}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('jsontoken')}` }
        });
        if (response.data.success) {
          commit('DELETE_EXPENSE', id);
          await dispatch('fetchAddExpenses');
          return { success: true, message: 'Expense deleted successfully' };
        }
        return { success: false, message: response.data.message || 'Failed to delete expense' };
      } catch (error) {
        console.error("Error deleting expense:", error);
        return { 
          success: false, 
          message: error.response?.data?.message || 'Failed to delete expense' 
        };
      }
    },
    async addBudget({ commit }, budgetData) {
      try {
        const response = await axios.post('/api/personal-budgets', budgetData, {
          headers: { 
            Authorization: `Bearer ${localStorage.getItem('jsontoken')}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (response.data.success) {
          commit('ADD_BUDGET', response.data.data);
          return { success: true, message: 'Budget added!', data: response.data.data };
        }
        return { 
          success: false, 
          message: response.data.message || 'Add failed' 
        };
      } catch (error) {
        console.error("Budget add error:", error.response?.data || error.message);
        return { 
          success: false, 
          message: error.response?.data?.message || 'Failed to add budget' 
        };
      }
    },
    async updateBudget({ commit }, budgetData) {
      try {
        const response = await axios.put(
          `/api/personal-budgets/${budgetData.id}`,
          {
            month_year: budgetData.month_year,
            budget_amount: budgetData.budget_amount
          },
          {
            headers: { 
              Authorization: `Bearer ${localStorage.getItem('jsontoken')}`,
              'Content-Type': 'application/json'
            }
          }
        );
    
        if (response.data.success) {
          commit('UPDATE_BUDGET', response.data.data);
          return { success: true, message: 'Budget updated successfully' };
        }
        return { success: false, message: response.data.message };
      } catch (error) {
        console.error("Budget update error:", error);
        return { 
          success: false, 
          message: error.response?.data?.message || 'Failed to update budget' 
        };
      }
    }
  }
});
