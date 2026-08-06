from collections import Counter


class StatisticsService:
    def __init__(self, transactions: list):
        self.transactions = transactions or []

    # ============================================
    # MAYOR INGRESO
    # ============================================

    def largest_income(self):

        incomes = [
            t for t in self.transactions if str(t.get("type", "")).lower() == "income"
        ]

        if not incomes:
            return None

        transaction = max(incomes, key=lambda t: float(t.get("amount", 0)))

        return {
            "amount": transaction.get("amount", 0),
            "category": transaction.get("category", ""),
            "description": transaction.get("description", ""),
        }

    # ============================================
    # MAYOR GASTO
    # ============================================

    def largest_expense(self):

        expenses = [
            t for t in self.transactions if str(t.get("type", "")).lower() == "expense"
        ]

        if not expenses:
            return None

        transaction = max(expenses, key=lambda t: float(t.get("amount", 0)))

        return {
            "amount": transaction.get("amount", 0),
            "category": transaction.get("category", ""),
            "description": transaction.get("description", ""),
        }

    # ============================================
    # CATEGORÍA FAVORITA
    # ============================================

    def favorite_category(self):

        categories = [t.get("category") for t in self.transactions if t.get("category")]

        if not categories:
            return None

        counter = Counter(categories)

        return counter.most_common(1)[0][0]

    # ============================================
    # BUILD
    # ============================================

    def build(self):

        return {
            "largestIncome": self.largest_income(),
            "largestExpense": self.largest_expense(),
            "favoriteCategory": self.favorite_category(),
        }
