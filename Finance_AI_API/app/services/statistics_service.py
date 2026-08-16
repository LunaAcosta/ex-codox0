from collections import Counter


class StatisticsService:
    def __init__(self, transactions: list):
        self.transactions = transactions or []

    # ============================================
    # BUILD
    # ============================================

    def build(self):

        largest_income = None
        largest_expense = None
        categories = Counter()

        for transaction in self.transactions:

            transaction_type = str(
                transaction.get("type", "")
            ).lower()

            amount = float(
                transaction.get("amount", 0) or 0
            )

            category = transaction.get("category")

            if category:
                categories[category] += 1

            # ====================================
            # MAYOR INGRESO
            # ====================================

            if transaction_type == "income":

                if (
                    largest_income is None
                    or amount > float(
                        largest_income.get("amount", 0) or 0
                    )
                ):
                    largest_income = {
                        "amount": amount,
                        "category": category or "",
                        "description": transaction.get(
                            "description",
                            "",
                        ),
                    }

            # ====================================
            # MAYOR GASTO
            # ====================================

            elif transaction_type == "expense":

                if (
                    largest_expense is None
                    or amount > float(
                        largest_expense.get("amount", 0) or 0
                    )
                ):
                    largest_expense = {
                        "amount": amount,
                        "category": category or "",
                        "description": transaction.get(
                            "description",
                            "",
                        ),
                    }

        favorite_category = None

        if categories:
            favorite_category = categories.most_common(1)[0][0]

        return {
            "largestIncome": largest_income,
            "largestExpense": largest_expense,
            "favoriteCategory": favorite_category,
        }