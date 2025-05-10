<template>
  <navigation/>
  <div class="main-layout smooth-scroll">
    <div v-if="showBudgetExceededAlert" class="budget-alert">
      <div class="alert-content">
        <span class="alert-icon">⚠️</span>
        <span>You have exceeded your monthly budget!</span>
        <button @click="dismissAlert" class="dismiss-btn">×</button>
      </div>
      </div>

      <div v-if="showDeleteConfirmation" class="floating-alert alert alert-warning" role="alert">
        <span class="alert-icon"><i class="fas fa-trash"></i></span>
        <span style="margin-left: 25px;">Are you sure you want to delete this expense?</span>
      <button @click="confirmDeleteExpense" class="btn btn-danger btn-sm ml-2">Yes</button>
      <button @click="cancelDeleteExpense" class="btn btn-secondary btn-sm ml-1">No</button>
    </div>

    <div v-if="error" class="error-message">
        An error occurred: {{ error }}
        <button @click="resetError">Try Again</button>
    </div>

      <div v-else>
    <div class="top-row"> 
  <div class="budget-container">
    <div class="budget-content">
    <div v-if="budgetSuccessMessage" class="budget-success-message" :class="{ hide: budgetHideMessage }">
      {{ budgetSuccessMessage }}
    </div>

    <div class="budget-display">
        <div class="budget-header">
          <h3>Budget for <br> {{ formatMonthYear(currentMonthYear) }}</h3>
          <button v-if="!hasExistingBudget" @click="showAddBudgetForm" class="btn-add">
            Add Budget
          </button>
          <button v-else @click="showEditBudgetForm" class="btn-edit">
            Edit Budget
          </button>
        </div>

    <div v-if="isBudgetLoading" class="loading">Loading budget...</div>

    <div v-else class="budget-details">
          <div class="month-selector">
            <button @click="prevMonth">&lt;</button>
            <span>{{ formatMonthYear(currentMonthYear) }}</span>
            <button @click="nextMonth">&gt;</button>
          </div>
          

  <div class="budget-amount">
    <span>BUDGET AMOUNT:</span>
    <strong class="amount-value">{{ formatPHP(currentMonthBudget.budget_amount) }}</strong>
  </div>

  <div class="expenses-summary1">
          <div class="expenses-amount">
          <span>TOTAL EXPENSES:</span>
          <strong>{{ formatPHP(totalExpensesForMonth) }}</strong>
          </div>

          <div class="remaining-budget">
          <span>REMAINING BUDGET:</span>
          <strong :class="{ 'text-danger': remainingBudget < 0 }">
            {{ formatPHP(remainingBudget) }}
          </strong>
        </div>
        </div>  

          <div class="budget-progress">
            <div class="progress-bar">
              <div 
                class="progress-fill" 
                :style="{ width: budgetProgress + '%' }"
                :class="{ 'exceeded': budgetProgress >= 100 }"
              ></div>
            </div>
            <div class="progress-text">
              {{ budgetProgress.toFixed(1) }}% 
            </div>
          </div>
        </div>

        <!-- Budget Form Modal -->
        <div v-if="isAddingBudget || isEditingBudget" class="budget-form-modal">
          <div class="budget-form">
            <h3 class="form-title">{{ isEditingBudget ? 'EDIT' : 'ADD' }} BUDGET</h3>
            <div class="form-group1">
              <label>Month:</label>
              <input 
        v-if="isAddingBudget"
          type="text" 
          :value="formatMonthYear(currentMonthYear)" 
          class="form-input"
          disabled
        >
      <input 
        v-else
        type="text" 
          :value="formatMonthYear(currentMonthYear)" 
          class="form-input"
          disabled
        >
            </div>

            <div class="form-group1">
              <label>Budget Amount (₱):</label>
              <input 
                type="text" 
                v-model="budgetAmount" 
                placeholder="Enter budget amount"
                @input="formatCurrencyInput"
              required>
            </div>
            <div class="form-actions">
              <button @click="isEditingBudget ? updateBudget() : submitAddBudget()" class="btn-save">
                {{ isEditingBudget ? 'Update' : 'Save' }} Budget
              </button>
              <button @click="cancelBudgetForm" class="btn-cancel">Cancel</button>
            </div>
          </div>
        </div>
      </div>
    </div>
    </div>


  <!--ADDING EXPENSESSSS-->
    <div class="content-wrapper">
      <form @submit.prevent="handleSubmit" class="expense-form" ref="expenseForm"> 
         <input type="hidden" v-model="action" />
         <input type="hidden" v-if="editId" v-model="editId" />


         <div class="form-group">
           <label>EXPENSE TYPE:</label>
           <select v-model="expenseType" required @change="checkExpenseType">
            <option value="">Select a category</option> 
            <option value="Food">Food</option>
             <option value="Bill">Bill</option>
             <option value="Transportation">Transportation</option>
             <option value="Entertainment">Entertainment</option>
             <option value="Healthcare">Healthcare</option>
             <option value="Shopping">Shopping</option> 
             <option value="Other">Other</option>
            </select>

            <div v-if="showPredictionFeedback" class="prediction-feedback">
            <p>Did you mean <strong>{{ expenseType }}</strong>?</p>
            <button @click="submitPredictionFeedback(true)" class="feedback-btn correct">
              Yes, correct
            </button>
            <button @click="expenseType = ''; showPredictionFeedback = false" class="feedback-btn incorrect">
              No, select manually
            </button>
          </div>
         </div>
 
         <div v-if="expenseType === 'Other'" class="form-group">
           <label>Custom Expense Type:</label>
           <input type="text" v-model="customExpenseType" placeholder="Enter custom expense type" />
         </div>
 
         <div class="form-group">
           <label>ITEM NAME:</label>
           <input type="text" v-model="itemName" @input="onItemNameChange" placeholder="Enter item name" required />
           <small v-if="isPredicting" class="predicting-text">Predicting category...</small>
          </div>
 
         <div class="form-group">
           <label>ITEM PRICE:</label>
           <input type="number" v-model.number="itemPrice" placeholder="Enter item price" required step="0.01" />
         </div>
 
         <button class="btn" type="submit"   :disabled="!hasBudgetForCurrentMonth">{{ editId ? 'Update Expense' : 'Add Expense' }}</button>
         <div v-if="!hasBudgetForCurrentMonth" class="no-budget-warning">
         <p>Please create a budget for {{ formatMonthYear(currentMonthYear) }} before adding expenses</p>
        </div>
         <div v-if="expenseSuccessMessage" class="expense-success-message" :class="{ hide: expenseHideMessage }">{{ expenseSuccessMessage }}</div>
      </form>

      </div>
      </div>

      <!--YOUR LIST OF EXPENSES-->
      <div class="expenses-container smooth-scroll" ref="expensesContainer">
      <div class="expenses-section"> 
        <h3>Your Expenses</h3> 
         <div class="expenses-table"> 
          <table>
            <thead>
              <tr>
                <th>Expense Type</th>
                <th>Item Name</th>
                <th>Item Price</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="expense in filteredExpenses" :key="expense?.id">
  <td>{{ expense?.expense_type || 'N/A' }}</td>
  <td>{{ expense?.item_name || 'N/A' }}</td>
  <td>{{ expense?.item_price ? formatPHP(expense.item_price) : '₱0.00' }}</td>
  <td>{{ formatDate(expense?.expense_date) }}</td>
  <td class="actions">
    <button @click="editExpense(expense)" class="edit-btn">Edit</button>
    <button @click="deleteExpenseHandler(expense?.id)" class="delete-btn">Delete</button>
                </td>
                </tr>
            </tbody>
          </table>
        </div>
       </div>
       
     <div class="total">
      Total: <strong>₱{{ totalAmount.toFixed(2) }}</strong> (≈ {{ formatUsd(convertPhpToUsd(totalAmount)) }} USD)
     </div>
    </div>
  </div>
  </div>
 </template>
 
 <script>
 import Navigation from "./navigation.vue";
 import { mapState, mapGetters, mapActions } from 'vuex'
 
 export default {
   name: 'Personal',
   components: { Navigation },
   data() {
     return {
       expenseType: '',
       customExpenseType: '',
       itemName: '',
       itemPrice: '',
       editId: null,
       action: 'add',
       hideMessage: false,
       successTimeout: null,
       budgetAmount: '',
       budgetEditId: null, 
       isAddingBudget: false,
       isEditingBudget: false,
       messageContext: '',
       budgetSuccessMessage: '',
       budgetHideMessage: false,
       budgetSuccessTimeout: null,
       expenseSuccessMessage: '',
       expenseHideMessage: false,
       expenseSuccessTimeout: null,
       filterMonth: null,
       error: null,
       selectedBudget: null,
       newBudgetMonthYear: this.getCurrentMonthYear(),
       isBudgetLoading: false,
       currentMonthYear: this.getCurrentMonthYear(),
       showBudgetExceededAlert: false,
       alertDismissed: false,
       dismissedAlerts: {},
       showDeleteConfirmation: false,
       expenseToDelete: null,
       lastCheckedMonthYear: null,
       isPredicting: false,
       showPredictionFeedback: false,
       predictionDebounce: null,
       exchangeRateError: null,
     };
   },
   
   computed: {
    ...mapState(['addExpenses', 'personalBudgets', 'usdExchangeRate']),
  ...mapGetters(['getTotalAmount', 'getCurrentBudget', 'getAvailableMonths', 'getAddExpenseMonthYear']),
  
  hasBudgetForCurrentMonth() {
    return this.currentMonthBudget?.budget_amount > 0;
  },

  safeExchangeRate() {
    return this.usdExchangeRate || 0.018045;
  },

  currentMonthExpenses() {
    return this.filteredExpenses.filter(expense => {
      const expenseDate = new Date(expense.expense_date);
      const selectedDate = new Date(this.currentMonthYear);
      return (
        expenseDate.getFullYear() === selectedDate.getFullYear() &&
        expenseDate.getMonth() === selectedDate.getMonth()
      );
    });
  },
  
  currentMonthBudget() {
    return this.$store.getters.getCurrentBudget(this.currentMonthYear) || {
      month_year: this.currentMonthYear,
      budget_amount: 0
    };
  },
  
  totalExpensesForMonth() {
    return this.filteredExpenses.reduce((sum, expense) => {
      return sum + (Number(expense.item_price) || 0);
    }, 0);
  },
  
  remainingBudget() {
    const budgetAmount = this.currentMonthBudget?.budget_amount || 0;
    const totalExpenses = this.totalExpensesForMonth;
    return budgetAmount - totalExpenses; 
  },

  currentBudgetDisplay() {
    if (this.selectedBudget) {
      return this.formatPHP(this.selectedBudget.budget_amount);
    }
    return this.formatPHP(0);
  },

  budgetProgress() {
    if (this.currentMonthBudget.budget_amount <= 0) return 0;
    const progress = (this.totalExpensesForMonth / this.currentMonthBudget.budget_amount) * 100;
    return Math.min(progress, 100); 
  },

  shouldShowExpenses() {
    const now = new Date();
    const currentMonthYear = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    return this.selectedMonthYear === currentMonthYear;
  },

  filteredExpenses() {
  const currentBudget = this.currentMonthBudget;
  if (!currentBudget?.id) return [];
  
  return this.addExpenses.filter(expense => {
    return expense.personal_budget_id === currentBudget.id;
    
  });
},

  selectedMonthYear: {
  get() {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  },
  set(value) {

    console.log("Month selection is locked in Add Expense page");
  }
},

currentBudget() {
  const currentMonthYear = this.getCurrentMonthYear();
  return this.$store.getters.getCurrentBudget(currentMonthYear);
},

     safeSelectedMonthYear() {
      return this.selectedMonthYear || this.currentMonthYear;
    },
 
    totalAmount() {
    return this.filteredExpenses.reduce((sum, expense) => {
      return sum + (Number(expense?.item_price) || 0);
    }, 0);
  },
 
     totalInUsd() {
      return this.convertPhpToUsd(this.totalAmount);
     },
 
     currentBudgetAmount() {
    return this.currentBudget.budget_amount;
  },
     
  hasExistingBudget() {
    return !!(this.selectedBudget && this.selectedBudget.id);
  },

  isBudgetExceeded() {
    if (!this.currentBudget?.budget_amount) return false;
    return this.totalAmount > this.currentBudget.budget_amount;
  }
},

   async mounted() {
  try {
    this.isLoading = true;
    const savedDismissedAlerts = localStorage.getItem('dismissedAlerts');
    if (savedDismissedAlerts) {
      this.dismissedAlerts = savedDismissedAlerts ? JSON.parse(savedDismissedAlerts) : {};
    }
    
    const now = new Date();
    const currentMonthYear = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    await this.setSelectedMonthYear(currentMonthYear);

    await Promise.all([
      this.fetchExchangeRate(),
      this.fetchPersonalBudgets(),
      this.fetchAddExpenses(),
      this.loadBudgetForMonth(currentMonthYear)
    ]);
    
    this.checkBudgetStatus();
    
    if (this.editId) {
      this.$nextTick(() => {
        const formElement = this.$refs.expenseForm;
        if (formElement) {
          formElement.scrollIntoView({ behavior: 'smooth' });
        }
      });
    }
    
  } catch (error) {
    console.error("Initialization error:", error);
    this.error = error.message || 'Failed to load data';
  } finally {
    this.isLoading = false;
  }
},

  beforeUnmount() {
    clearInterval(this.monthCheckInterval);
  },


  watch: {
  filteredExpenses: {
    deep: true,
    handler() {
      this.checkBudgetStatus();
    }
  },

  currentMonthBudget: {
    deep: true,
    handler() {
      this.checkBudgetStatus();
    }
  },
  
  currentMonthYear: {
    immediate: true,
    handler(newVal, oldVal) {
      if (newVal !== oldVal) {
        this.checkBudgetStatus(true);
      }
    }
  }
  },

   methods: {
     ...mapActions([
       'fetchExchangeRate',
       'fetchExpenses',
       'fetchPersonalBudgets',
       'addExpense',
       'updateExpense',
       'deleteExpense',
       'addBudget',
       'updateBudget',
       'setSelectedMonthYear' ,
       'fetchAddExpenses' 
     ]),

     prevMonth() {
    const date = new Date(this.currentMonthYear);
    date.setMonth(date.getMonth() - 1);
    const now = new Date();
    const newMonthYear = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    const newDate = new Date(newMonthYear);
  
  if (newDate.getFullYear() < now.getFullYear() || 
      (newDate.getFullYear() === now.getFullYear() && newDate.getMonth() < now.getMonth())) {

    this.showBudgetSuccessMessage('Cannot navigate to past months');
    return;
  }
  
  this.changeMonth(date);
},

  nextMonth() {
    const date = new Date(this.currentMonthYear);
    date.setMonth(date.getMonth() + 1);
    this.changeMonth(date);
  },

  async changeMonth(date) {
    const newMonthYear = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
  this.currentMonthYear = newMonthYear;

  await Promise.all([
    this.$store.dispatch('fetchAddExpenses'),
    this.loadBudgetForMonth(newMonthYear)
  ]);
  
  this.checkBudgetStatus(true);

  this.dismissedAlerts[newMonthYear] = false;
  localStorage.setItem('dismissedAlerts', JSON.stringify(this.dismissedAlerts));
},

    checkMonthChange() {
    const lastAccessedMonth = localStorage.getItem('lastAccessedMonth');
    const currentMonth = new Date().getMonth();
    
    if (lastAccessedMonth && parseInt(lastAccessedMonth) !== currentMonth) {
        console.log('New month detected - resetting view');
        localStorage.removeItem('budgetAlertDismissed');
        this.alertDismissed = false;

        const newMonthYear = this.getCurrentMonthYear();
        this.setSelectedMonthYear(newMonthYear);
        
        Promise.all([
      this.fetchAddExpenses(), 
      this.fetchPersonalBudgets()
    ]).then(() => {
      this.checkBudgetStatus();
    });
  }
      
      localStorage.setItem('lastAccessedMonth', currentMonth);
    },

     onItemNameChange() {
      clearTimeout(this.predictionDebounce);
      
      // Only predict if item name has at least 3 characters and no category is selected
      if (this.itemName.length < 3 || this.expenseType) return;
      
      this.predictionDebounce = setTimeout(() => {
        this.predictCategory();
      }, 500); // Debounce to avoid too many requests
    },
    
    async handleLearningData(expenseData) { 
  try {
    // Skip if missing required fields
    if (!expenseData.item_name?.trim() || !expenseData.expense_type) {
      console.log('Skipping learning - missing required fields');
      return { success: false, reason: 'Missing required fields' };
    }

    const payload = {
      item_name: expenseData.item_name.trim(),
      expense_type: expenseData.expense_type,
      item_price: expenseData.item_price ? Number(expenseData.item_price) : null,
      personal_budget_id: expenseData.personal_budget_id || null,
      userId: this.$store.state.user?.id || null
    };

    console.log('Attempting to send learning data:', payload);
      
    const response = await this.$axios.post('/api/predictions/learn', payload, {
      headers: { 
        Authorization: `Bearer ${localStorage.getItem('jsontoken')}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('Learning response:', response.data);
    return { success: true, data: response.data };

  } catch (error) {
    const errorDetails = {
      message: error.message,
      response: error.response?.data,
      config: error.config
    };
    
    console.error('Learning failed (non-critical):', errorDetails);
    
    // Return error details but don't throw - learning failure shouldn't block UI
    return { 
      success: false, 
      error: errorDetails,
      isCritical: false 
    };
  }
},

    async predictCategory() {
      if (this.isPredicting || !this.itemName || this.itemName.length < 3) return;
      
      try {
        this.isPredicting = true;
        
        const response = await this.$axios.post('/api/predictions/predict', {
          item_name: this.itemName
        }, {
          headers: { 
            Authorization: `Bearer ${localStorage.getItem('jsontoken')}`
          }
        });
        
        if (response.data.success) {
      const predictedCategory = response.data.data.expense_type;
      this.expenseType = predictedCategory;
      
      this.showPredictionFeedback = predictedCategory === 'Other' && 
        this.shouldSuggestAlternative(this.itemName);
    }
  } catch (error) {
    console.error('Prediction failed:', error);
  } finally {
    this.isPredicting = false;
  }
},

shouldSuggestAlternative(itemName) {
  const lowerItem = itemName.toLowerCase();
  const words = lowerItem.split(/\s+/);
  
  const categoryKeywords = {
        Food: [
          "burger", "burgei", "burgir", "hamburger", "jollibee", 
          "pizza", "piza", "pasta", "sandwich", "fries", "milktea",
          "rice", "noodles", "chicken", "mcdo", "kfc"
        ],
        Bill: [
          "electric bill", "water bill", "internet bill", "phone bill",
          "cable bill", "utility bill", "rent", "mortgage", "electricity",
          "water payment", "internet payment"
        ],
        Transportation: [
          "gasoline", "gas", "petrol", "diesel", "jeepney fare",
          "bus", "mrt", "grab", "angkas", "taxi",
          "lrt fare", "tricycle fare", "parking fee", "car maintenance"
        ],
        Entertainment: [
          "movie tickets", "netflix", "spotify", "youtube premium",
          "concert tickets", "videoke", "arcade", "theme park",
          "movie", "cinema", "streaming", "game", "video game"
        ],
        Healthcare: [
          "doctor visit", "hospital", "medicine", "vitamins",
          "checkup", "dentist", "vaccine", "medical supplies",
          "pharmacy", "drugstore", "clinic", "xray", "laboratory"
        ],
        Shopping: [
          'shoes', 'clothes', 'shirt', 'pants', 'dress',
          'gadget', 'phone', 'laptop', 'accessories', 'bag',
          'watch', 'perfume', 'makeup', 'groceries', 'market',
          'office chair', 'desk', 'monitor', 'keyboard', 'mouse',
          'furniture', 'stationery', 'notebook', 'pen', 'backpack'
        ]
      };
  const isUnknown = !Object.values(categoryKeywords).some(keywords => 
    keywords.some(keyword =>
      keyword.includes(' ') ? 
        lowerItem.includes(keyword) : 
        words.includes(keyword)
    )
  );

  return isUnknown;
},
    async submitPredictionFeedback(isCorrect) {
      try {
        if (!isCorrect) {
          await this.$axios.post('/api/predictions/learn', {
            item_name: this.itemName,
            expense_type: this.expenseType 
          }, {
            headers: { 
              Authorization: `Bearer ${localStorage.getItem('jsontoken')}`
            }
          });
        }
        
        this.showPredictionFeedback = false;
    } catch (error) {
        console.error('Feedback submission failed:', error);
        // Optionally show a subtle error message to the user
        this.showExpenseSuccessMessage('Failed to save feedback. Please try again.');
    }
},

  dismissAlert() {
    this.showBudgetExceededAlert = false;
    this.dismissedAlerts = {
    ...this.dismissedAlerts,
    [this.currentMonthYear]: true
  };
  localStorage.setItem('dismissedAlerts', JSON.stringify(this.dismissedAlerts));
},

  checkBudgetStatus(forceShow = false) {
    const budget = this.currentMonthBudget;

  if (!budget?.budget_amount || budget.budget_amount <= 0) {
    this.showBudgetExceededAlert = false;
    return;
  }
  
  const expensesForSelectedMonth = this.filteredExpenses.reduce((sum, expense) => {
    return sum + (Number(expense.item_price) || 0);
  }, 0);

  const isExceeded = expensesForSelectedMonth > budget.budget_amount;
  const isDismissed = this.dismissedAlerts[this.currentMonthYear] || false;

  this.showBudgetExceededAlert = isExceeded && (forceShow || !isDismissed);
},
  
     getCurrentMonthYear() {
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      return `${year}-${month}`;
    },
 
     handleMonthYearChange(newMonthYear) {
       this.setSelectedMonthYear(newMonthYear);  
       this.fetchExpenses();
     },
 
     formatMonthYear(monthYear) {
       try {
         if (!monthYear) {
           const now = new Date();
           return now.toLocaleString('default', { month: 'long', year: 'numeric' });
         }
         
         if (typeof monthYear === 'string') {
           const [year, month] = monthYear.split('-').map(Number);
           if (!isNaN(year) && !isNaN(month)) {
             const date = new Date(year, month - 1);
             return date.toLocaleString('default', { 
               month: 'long', 
               year: 'numeric' 
             });
           }
         }
         
         // Fallback for invalid input
         const now = new Date();
         return now.toLocaleString('default', { month: 'long', year: 'numeric' });
       } catch (e) {
         console.error('Error formatting month/year:', e);
         return 'Invalid date';
       }
     },
 
     // Budget Form Methods - REPLACED submitBudget with these two methods
     showAddBudgetForm() {
    this.isAddingBudget = true;
    this.isEditingBudget = false;
    this.budgetAmount = '';
    this.newBudgetMonthYear = this.currentMonthYear;
  },

     
     showEditBudgetForm() {
      this.isEditingBudget = true;
      this.isAddingBudget = false;
      this.budgetAmount = this.selectedBudget.budget_amount;
     },
     
     cancelBudgetForm() {
       this.isAddingBudget = false;
       this.isEditingBudget = false;
     },
 
     async loadBudgetForMonth(monthYear) {
    this.isBudgetLoading = true;
    try {
      const budget = await this.$store.dispatch('fetchBudgetForMonth', monthYear);
     
      this.selectedBudget = budget && budget.id ? budget : {
      month_year: monthYear,
      budget_amount: 0
    };
    
  } catch (error) {
    console.error('Error loading budget:', error);
    this.selectedBudget = {
      month_year: monthYear,
      budget_amount: 0
    };
  } finally {
    this.isBudgetLoading = false;
  }
},
     async submitAddBudget() {
    try {
      if (!this.budgetAmount) {
        throw new Error('Please enter a budget amount');
      }

      const monthYear = this.isAddingBudget ? 
        this.newBudgetMonthYear : 
        this.currentMonthYear;

      const budgetData = {
        month_year: monthYear,
        budget_amount: this.parseCurrency(this.budgetAmount)
      };
      
      const result = await this.addBudget(budgetData); 
      
      if (result.success) {
        this.showBudgetSuccessMessage(result.message || 'Budget added successfully!');
        await this.fetchPersonalBudgets();

        if (this.isAddingBudget && monthYear !== this.currentMonthYear) {
          this.currentMonthYear = monthYear;
          await this.loadBudgetForMonth(monthYear);
        }

        this.cancelBudgetForm();
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      console.error('Budget add error:', error);
      this.showBudgetSuccessMessage(error.message || 'Failed to add budget');
    }
  },
 
     async updateBudget() {
      try {
      if (!this.selectedBudget?.id) {
        throw new Error('No budget found for current month');
      }

      if (!this.budgetAmount) {
        throw new Error('Please enter a budget amount');
      }
 
      const budgetData = {
        id: this.selectedBudget.id,
        month_year: this.currentMonthYear,
        budget_amount: this.parseCurrency(this.budgetAmount)
      };
         
         const result = await this.$store.dispatch('updateBudget', budgetData);
         
         if (result.success) {
           this.showBudgetSuccessMessage(result.message || 'Budget updated successfully!');
           await this.loadBudgetForMonth(this.currentMonthYear);
           await this.fetchPersonalBudgets();
           this.cancelBudgetForm();
         } else {
           throw new Error(result.message);
         }
       } catch (error) {
         this.showBudgetSuccessMessage(error.message || 'Failed to update budget');
       }
     },
 
     parseCurrency(value) {
       if (!value) return 0;
       const numericValue = String(value).replace(/[^\d.]/g, '');
       return parseFloat(numericValue) || 0;
     },
     
     convertPhpToUsd(phpAmount) {
      const rate = this.safeExchangeRate;
      const usdAmount = parseFloat(phpAmount) * rate;
      return parseFloat(usdAmount.toFixed(6)); 
    },
     
     formatUsd(value) {
       return '$' + parseFloat(value).toFixed(2);
     },
     
     formatPHP(value) {
  try {
    const numericValue = typeof value === 'string' ? this.parseCurrency(value) : value;
    const amount = Number(numericValue) || 0;
    
    return amount.toLocaleString('en-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).replace('₱', '₱'); 
  } catch (e) {
    console.error('Error formatting PHP:', e);
    return '₱0.00'; // Fallback value
  }
},

     
     formatDate(dateString) {
       if (!dateString || dateString === 'N/A') return 'N/A';
       
       try {
         const options = { 
           day: 'numeric',   
           month: 'short',   
           year: 'numeric'    
         };
         return new Date(dateString).toLocaleDateString('en-US', options);
       } catch (e) {
         console.error('Date formatting error:', e);
         return 'N/A';
       }
     },
 
     // Expense Methods
     async handleSubmit() {
  try {
    if (!this.hasBudgetForCurrentMonth) {
      this.showExpenseSuccessMessage('Please create a budget for this month before adding expenses');
      return;
    }

    if (!this.validateExpenseForm()) return;

    const currentMonthYear = this.currentMonthYear;
    let budget = await this.$store.dispatch('fetchBudgetForMonth', currentMonthYear);

    if (!budget?.id) {
      budget = await this.$store.dispatch('addBudget', {
        month_year: currentMonthYear,
        budget_amount: 0
      });
    }

    const expenseData = {
  item_price: Number(this.itemPrice),
  expense_type: this.expenseType === 'Other' ? this.customExpenseType : this.expenseType,
  item_name: this.itemName,
  personal_budget_id: budget.id,
};

    console.log('Submitting expense:', expenseData);
    
    let result;
    if (this.editId) {
      result = await this.updateExpense({
        id: this.editId,
        expenseData: expenseData
      });
    } else {
      result = await this.addExpense(expenseData);
      
      if (result.success) {
        await this.handleLearningData({
          item_name: expenseData.item_name,
          expense_type: expenseData.expense_type,
          item_price: expenseData.item_price,
          personal_budget_id: expenseData.personal_budget_id,
         // custom_type: expenseData.custom_type
        });
      }
    }

    if (result.success) {
      console.log('Expense added successfully:', result.data);
      
      // Refresh data
      await Promise.all([
        this.fetchAddExpenses(),
        this.fetchPersonalBudgets()
      ]);
      
      this.checkBudgetStatus(true);
      
      this.showExpenseSuccessMessage(this.editId ? 'Expense updated!' : 'Expense added!');
      this.resetForm();
      
      this.$nextTick(() => {
        const target = this.editId ? this.$refs.expenseForm : this.$refs.expensesContainer;
        target?.scrollIntoView({ behavior: 'smooth' });
      });
    } else {
      console.error('Failed to add expense:', result.message);
      this.showExpenseSuccessMessage(result.message || 'Failed to add expense');
    }
  } catch (error) {
    console.error('Submit error:', error);
    this.showExpenseSuccessMessage(error.message || 'Failed to save expense');
  }
},

validateExpenseForm() {
    if (!this.itemPrice || isNaN(Number(this.itemPrice)) || Number(this.itemPrice) <= 0) {
    this.showExpenseSuccessMessage('Please enter a valid positive amount');
    return false;
  }

  if (!this.itemPrice || isNaN(Number(this.itemPrice))) {
    this.showExpenseSuccessMessage('Please enter a valid amount');
    return false;
  }

  if (!this.expenseType) {
    this.showExpenseSuccessMessage('Please select an expense type');
    return false;
  }

  if (!this.itemName?.trim()) {
    this.showExpenseSuccessMessage('Please enter an item name');
    return false;
  }

  if (!this.currentBudget?.id) {
    this.showExpenseSuccessMessage('No valid budget selected');
    return false;
  }

  return true;
},
 
editExpense(expense) {
  if (!expense?.id) {
    console.error('Cannot edit - invalid expense:', expense);
    this.showExpenseSuccessMessage('Cannot edit this expense');
    return;
  }
  
  this.editId = expense.id;
  this.expenseType = expense.expense_type || '';
  this.customExpenseType = this.expenseType === 'Other' ? expense.expense_type : '';
  this.itemName = expense.item_name || '';
  this.itemPrice = expense.item_price || '';
  this.action = 'edit'; // Make sure this is set

  this.$nextTick(() => {
    this.$refs.expenseForm.scrollIntoView({ behavior: 'smooth' });
  });
},
 
async deleteExpenseHandler(id) {
    this.showDeleteConfirmation = true;
    this.expenseToDelete = id; // Save the id of the expense to be deleted
  },

  confirmDeleteExpense() {
    const id = this.expenseToDelete;
    this.deleteExpense(id).then(result => {
      if (result.success) {
        this.showExpenseSuccessMessage('Expense deleted successfully!');
        this.checkBudgetStatus(true)
      } else {
        this.showExpenseSuccessMessage(result.message || 'Failed to delete expense');
      }
      this.showDeleteConfirmation = false; // Hide confirmation after the operation
      this.expenseToDelete = null; // Clear the stored expense id
    });
  },

  cancelDeleteExpense() {
    this.showDeleteConfirmation = false; // Hide confirmation if user cancels
    this.expenseToDelete = null; // Clear the stored expense id
  },

     handleError(error) {
    console.error('Component error:', error);
    this.error = error.message || 'An unexpected error occurred';
  },
  resetError() {
    this.error = null;
    this.mounted(); // Retry initialization
  },
     
     resetForm() {
       this.expenseType = '';
       this.customExpenseType = '';
       this.itemName = '';
       this.itemPrice = '';
       this.editId = null;
       this.action = 'add';
     },
 
     showBudgetSuccessMessage(message) {
       if (this.budgetSuccessTimeout) {
         clearTimeout(this.budgetSuccessTimeout);
       }
       
       this.budgetHideMessage = false;
       this.budgetSuccessMessage = message;
       
       this.budgetSuccessTimeout = setTimeout(() => {
         this.budgetHideMessage = true;
         setTimeout(() => {
           this.budgetSuccessMessage = '';
         }, 500);
       }, 2500);
     },
     
     showExpenseSuccessMessage(message) {
  if (this.expenseSuccessTimeout) {
    clearTimeout(this.expenseSuccessTimeout);
    this.expenseSuccessTimeout = null;
  }
  
  this.expenseHideMessage = false;
  this.expenseSuccessMessage = message;
  
  this.expenseSuccessTimeout = setTimeout(() => {
    this.expenseHideMessage = true;
    this.expenseSuccessTimeout = setTimeout(() => {
      this.expenseSuccessMessage = '';
      this.expenseSuccessTimeout = null;
    }, 500);
  }, 2500);
},
 
     getCurrentBudgetId() {
       return this.getCurrentBudget ? this.getCurrentBudget.id : null;
     }
   }
  };
 </script>

 
<style scoped>
.smooth-scroll {
  scroll-behavior: smooth;
}
.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.no-budget-warning {
  color: #dc3545;
  margin-top: 10px;
  font-size: 0.9em;
}
.text-danger {
  color: #c62828;
}
.budget-form input[type="month"] {
  width: 100%;
  padding: 12px;
  border-radius: 8px;
  border: 1px solid #ddd;
  background: white;
  color: #333;
}

.month-selector button:hover {
  background: #e0e0e0;
}

.month-selector span {
  min-width: 150px;
  padding: 0 12px;
  text-align: center;
  font-weight: bold;
}

.predicting-text {
  color: #555;
  font-style: italic;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  display: block;
  margin-top: 2px;
  opacity: 0.85;
}

.prediction-feedback {
  margin-top: 10px;
  padding: 5px;
  background: linear-gradient(to right, #fafafa, #f0f0f0);
  border-radius: 6px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  font-size: 0.95rem;
}

.feedback-btn {
  margin-right: 8px;
  padding: 4px 8px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 500;
  transition: background 0.3s ease, transform 0.2s ease;
  box-shadow: 0 1px 2px rgba(0,0,0,0.1);
}

.feedback-btn.correct {
  background: #4CAF50;
  color: white;
}

.feedback-btn.correct:hover {
  background: #45a049;
  transform: scale(1.05);
}

.feedback-btn.incorrect {
  background: #f44336;
  color: white;
}

.feedback-btn.incorrect:hover {
  background: #e53935;
  transform: scale(1.05);
}


.budget-alert {
  position: fixed;
  top: 290px;
  left: 50%;
  transform: translateX(-50%);
  background-color: #ffebee;
  border: 1px solid #ef9a9a;
  border-radius: 6px;
  padding: 20px 30px; /* Increased padding */
  min-width: 320px;    /* Optional: ensures a wider box */
  color: #c62828;
  font-weight: bold;
  font-size: 1.2em;    /* Increased font size */
  z-index: 1000;
  box-shadow: 0 4px 14px rgba(0,0,0,0.15);
  display: flex;
  align-items: center;
  animation: slideDown 0.3s ease-out;
}

.alert-content {
  display: flex;
  align-items: center;
  gap: 12px;
}

.alert-icon {
  font-size: 1.5em;
}

.dismiss-btn {
  background: none;
  border: none;
  color: #c62828;
  font-size: 1.8em; /* Bigger button */
  cursor: pointer;
  margin-left: 20px;
  padding: 0 8px;
}

.dismiss-btn:hover {
  color: #b71c1c;
}

/* Floating Delete Confirmation Alert */
.floating-alert {
  position: fixed;
  top: 290px;
  left: 50%;
  transform: translateX(-50%);
  background-color: #ffebee;
  border: 1px solid #ef9a9a;
  border-radius: 6px;
  padding: 20px 30px; /* Increased padding */
  min-width: 350px;    /* Optional: ensures a wider box */
  color: #c62828;
  font-weight: bold;
  font-size: 1.2em;    /* Increased font size */
  z-index: 1000;
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.15);
  display: flex;
  align-items: center;
  animation: slideDown 0.3s ease-out;
}

.floating-alert button {
  padding: 10px 10px;
  margin-left: 10px;
  width: 80px;
}


@keyframes slideDown {
  from {
    opacity: 0;
    transform: translate(-50%, -20px);
  }
  to {
    opacity: 1;
    transform: translate(-50%, 0);
  }
} /*NEWWWWWWWWWWWW */

.main-layout {
  display: flex;
  flex-direction: column;
  width: 100%;
  gap: 20px;
  padding: 20px;
  box-sizing: border-box;
}

.top-row {
  margin-top: 100px;
  display: flex;
  flex-wrap: nowrap; /* prevent wrapping by default */
  gap: 20px;
  width: 100%;
  flex-direction: row;
} 

/* Budget Container Styles */
.budget-container {
  flex: 1 1 30%;
  min-width: 150px;
  background-color: #daf9da; 
  padding: 20px;
  border-radius: 15px;
  border: 2px solid #2e4e38;
  box-shadow: 0 4px 8px rgba(0,0,0,0.2);
  height: auto;
  color: #1e3a2b;
  font-size: 1.05rem;
}

.budget-header {
  flex-wrap: wrap;
  display: flex;
  align-items: center;
  margin-bottom: 2px;
}

.budget-header h3 {
  color: #183d2a;
  font-size: 1.8rem;
  margin-right: 25px;
  margin-bottom: 20px;
  font-weight: bold;
}

.budget-content {
  width: 100%;
}

.btn-add, .btn-edit{
  background: #2a4935;
  color: white;
  border: none;
  padding: 10px 15px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 15px;
  transition: all 0.3s;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  max-width: 72px;
  font-size: 14px;
  margin-left: 0;      
  display: inline-block; 
}


.btn-add:hover, .btn-edit:hover {
  background: #e6e6e6;
  color: #2a2a2a;
  transform: translateY(-2px);
}

.budget-display {
  flex-wrap: wrap;
  background: rgba(32, 28, 28, 0.05);
  padding: 20px;
  border-radius: 10px;
}

.budget-info {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.budget-month-row, .budget-amount-row {
  flex-wrap: wrap;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.budget-label {
  font-weight: 500;
  font-size: 1rem;
}
.budget-month, .budget-amount {
  font-weight: 600;
  font-size: 1.1rem;
}

.budget-amount {
  background-color: #ffffff;           /* clean white for contrast */
  border: 2px solid #6A9C89;           /* soft green border */
  padding: 12px 16px;
  border-radius: 10px;
  color: #388e3c;                      /* dark green for label */
  display: inline-flex;
  align-items: center;
  gap: 8px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
  font-weight: 650;
  font-size: 18px;
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
}

.budget-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
  background: rgba(255, 255, 255, 0.1);
  padding: 20px;
  border-radius: 10px;
}

.budget-form .form-group {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
}


.amount-value {
  color: #2e7d32;                      /* slightly darker green */
  font-size: 18px;
}

.budget-form label {
  min-width: 60px;
}

.budget-form input, .budget-form select {
  width: 100%;
  padding: 12px;
  border-radius: 8px;
  border: 1px solid #ddd;
  background: white;
  color: #333;
}

.budget-form-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  justify-content: center;
  box-sizing: border-box;
  margin-top: 20px;
  width: 100%;
}

.budget-btn {
  padding: 12px 0;
  background-color: #2a4935;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 1rem;
  transition: all 0.3s;
  flex: 1;
}

.budget-btn:hover {
  background: #dcdcdc; 
  color: #333333;
  transform: translateY(-2px);
}

.cancel-btn {
  background-color: #6c757d;
}

.cancel-btn:hover {
  background-color: #4b5256;
  color: white;
}

.budget-success-message {
  background-color: #d4edda;
  color: #1d4d2b;
  padding: 10px;
  border-radius: 4px;
  margin: 10px 0;
  text-align: center;
  transition: opacity 0.5s ease;
  font-size: 1rem;
}

.budget-details {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.month-selector {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  align-items: center;
  gap: 10px;
  margin-top: 20px;
  margin-bottom: 12px;
  font-size: 1.2rem;
  color: #1b3d2f;
}

.month-selector button {
  border: 1px solid #ddd;
  cursor: pointer;
  transition: all 0.3s;
  background: #2a4935;
  color: white;
  padding: 6px 12px;
  border-radius: 5px;
  font-size: 1rem;
}



.expenses-summary1 {
  background-color: #f5f5f5; ;            
  border: 2px solid #697565;
  border-radius: 12px;
  padding: 10px 12px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.06);
  width: 92%;
  margin-top: 10px;
}

.expenses-amount,
.remaining-budget {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 550;
  margin-bottom: 8px;
  color: #444;
}


.budget-progress {
  margin-top: 2px;
}

.progress-bar {
  height: 16px;
  background-color: #f0f0f0;
  border-radius: 10px;
  overflow: hidden;
  margin-bottom: 5px;
}

.progress-fill {
  height: 100%;
  background-color: #2a4935;
  transition: width 0.3s;
}

.progress-fill.exceeded {
  background-color: #f44336;
}

.progress-text {
  text-align: right;
  font-size: 1.1rem;
  color: #1a3d2c;
}

.budget-form-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.budget-form-modal .budget-form {
  background-color: white;
  color: #333;
  padding: 25px;
  border-radius: 10px;
  width: 90%;
  max-width: 400px;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 20px;
  gap: 10px;
}

.btn-save, .btn-cancel {
  padding: 10px 16px;
  border-radius: 8px;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  flex: 1;
  text-align: center;
}

.btn-save {
  background-color: #537D5D;
  color: white;
  border: none;
}

.btn-save:hover {
  background-color: #73946B;
  transform: translateY(-1px);
}

.btn-cancel {
  background-color: #f5f5f5;
  color: #666;
  border: 1px solid #ddd;
}

.btn-cancel:hover {
  background-color: #e0e0e0;
  transform: translateY(-1px);
}

.loading {
  text-align: center;
  padding: 20px;
}

.expense-success-message {
  background-color: #d4edda;
  color: #155724;
  padding: 10px;
  border-radius: 4px;
  margin: 10px 0;
  text-align: center;
  transition: opacity 0.5s ease;
} /* for expenses*/

.budget-success-message.hide,
.expense-success-message.hide {
  opacity: 0;
}


.uneditable-month {
  display: inline-block;
  padding: 8px 12px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 4px;
  font-weight: bold;
  text-align: center;
  min-width: 50px;
  width: 120px;
}
 
 .content-wrapper {
  display: flex;
  flex-wrap: wrap;
  align-content: center;
  flex: 1 1 65%;
  min-width: 280px;
  background-color: #c5f8cc;
  border: 2px solid #365c42;
  padding: 20px;
  border-radius: 15px;
  box-shadow: 0 4px 8px rgba(0,0,0,0.1);
  height: auto;
}

.expenses-container {
  max-width: 100%; 
  margin: 0 auto;
  box-sizing: border-box;
  width: 100%;
  background-color: white;
  padding: 20px;
  border-radius: 15px;
  border: 3px solid #6A9C89;
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.08);
  margin-top: 30px;
  transition: box-shadow 0.3s ease;
  transition: all 0.3s ease;
}
 
.expenses-container:hover {
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.1);
}

 .expense-form {
  text-align: center;
  width: 100%; 
  transition: all 0.3s ease;
  scroll-margin-top: 200px;
}  
 

.expenses-section {
  margin-top: 10px;   
}

.expenses-section h3 {
  text-align: center;
  align-content: center;
  margin-top: 10px;
  color: #2e2e2e;
  font-size: 1.5rem; 
  padding-bottom: 10px;
  border-bottom: 2px solid #e1e1e1; 
  font-weight: 600;
} 

h3{
  margin-bottom: 0;
}

.expenses-table {
  overflow-x: auto;
  margin: 30px 0; 
}  

table {
  width: 100%;
  border-collapse: separate; 
  border-spacing: 0 10px; 
  margin-bottom: 20px; 
}  

th, td {
  padding: 6px 20px; 
  text-align: center;
  border-bottom: 2px solid #e0e0e0;
  color: #444;
  font-size: 0.95rem;
} 

th {
  background-color: #2a4935;
  font-weight: 700;
  font-size: 1rem; 
  padding: 12px 20px; 
  color: white;
} 

tr {
  background-color: #ecfdf5;
  box-shadow: 0 2px 4px rgba(0,0,0,0.05); 
  margin-bottom: 15px; 
  transition: all 0.2s ease;
}

tr:hover {
  background-color: #f9f9f9;
  transform: translateY(-2px); 
  box-shadow: 0 6px 12px rgba(0,0,0,0.08); 
  transition: all 0.2s ease; 
} 

td, th {
  vertical-align: middle;
  white-space: nowrap;
}
.actions {
  display: flex;
  gap: 10px;
  justify-content: center;
} 

.edit-btn, .delete-btn {
  padding: 8px 15px;
  font-size: 0.9rem;
  border-radius: 6px;
  cursor: pointer;
  border: none;
  color: #fff;
  font-weight: 600;
  position: relative;
  overflow: hidden;
  transition: all 0.3s ease;
  box-shadow: 0 2px 6px rgba(0,0,0,0.1);
}

.edit-btn {
  background-color: #059669;
}

.delete-btn {
  background-color: #b33c3c;
}

.edit-btn:hover {
  background-color: #10b981;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(52, 211, 153, 0.3);
}

.delete-btn:hover {
  background-color: #ef4444; 
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(239, 68, 68, 0.3);
  animation: pulse 0.4s ease-in-out;
}

@keyframes pulse {
  0% {
    transform: translateY(-2px) scale(1);
  }
  50% {
    transform: translateY(-2px) scale(1.05);
  }
  100% {
    transform: translateY(-2px) scale(1);
  }
}

.edit-btn:active, .delete-btn:active {
  transform: translateY(0);
  box-shadow: 0 1px 3px rgba(0,0,0,0.2);
}

.total {
     font-size: 20px;
     font-weight: bold;
     color: #333;
     padding: 20px;
     background-color: #d0ebdd;
     box-sizing: border-box;
     box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
     text-align: center;
     width: 100%;
     position: relative; 
     bottom: 0;   
     border-radius: 12px;
     margin-top: -20px;
}

.form-title {
  color: #2a4935;
  background-color: #d8fcdd;
  height: 50px;
  align-content: center;
  text-align: center;
  margin-bottom: 20px;
  font-size: 1.4rem;
  font-weight: 600;
}

.form-group1 {
  margin-bottom: 16px;
}

.form-group1 label {
  margin-bottom: 6px;
  color: #2a4935;
  font-size: 1.1rem;
  font-weight: 500;
  text-align: left;
  margin-left: 2px;
}

.form-input {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #c8e6c9;
  border-radius: 8px;
  font-size: 0.95rem;
  color: #333;
  background-color: #f8f8f8;
  transition: all 0.3s ease;
}

.form-input:focus {
  outline: none;
  border-color: #4caf50;
  box-shadow: 0 0 0 2px rgba(76, 175, 80, 0.2);
  background-color: white;
}

.form-input[disabled] {
  background-color: #f0f0f0;
  color: #666;
}
 .form-group {
     margin-bottom: 16px;
     margin-top: 20px;
 }
 
 label {
     margin-left: 25px;
     text-align: left;
     display: block;
     margin-bottom: 5px;
     font-size: 17px;
     color: black;
 }
 
 input[type="text"],
 input[type="number"],
 select {
     width: 100%;
     max-width: 800px;
     padding: 10px;
     font-size: 16px;
     border-radius: 10px;
     border: 3px solid #ddd;
     border-color: #2a4935;
     box-sizing: border-box;
     min-height: 35px;
 }
 
 .btn {
     padding: 12px 50px;
     background-color: #2a4935;
     box-shadow: 0px 4px 6px rgba(0, 0, 0, 0.2);
     color: white;
     border: none;
     border-radius: 12px;
     cursor: pointer;
     font-size: 15px;
     transition: background-color 0.3s, color 0.3s; /* Smooth effect */
}

.btn:hover {
    background-color: #dcdcdc; /* Change to any color you want */
    color: #333333; /* Text color on hover */
    transform: translateY(-2px);
}

.btn1 {
    padding: 12px 50px;
    background-color: white;
    box-shadow: 0px 4px 6px rgba(0, 0, 0, 0.2);
    color: black;
    border: none;
    border-radius: 12px;
    cursor: pointer;
    font-size: 15px;
    margin-top: 10px; /* Add vertical spacing instead */
    margin-left: 430px;
    transition: background-color 0.3s, color 0.3s;
}

.btn1:hover {
    background-color: rgb(26, 25, 25); /* Change to any color you want */
    color: white; /* Text color on hover */
}


@media (max-width: 1200px) {
  .month-selector span{
    min-width: 50px;
    padding: 10px;
    text-align: center;
    font-weight: bold;
  }
}

@media (max-width: 760px) {
  .top-row {
    flex-wrap: wrap;
    flex-direction: column;
  }
}

</style>
