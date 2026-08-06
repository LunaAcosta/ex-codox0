class ContextBuilder:
    @staticmethod
    def build(profile: dict) -> str:

        user = profile.get("user", {})
        summary = profile.get("summary", {})
        statistics = profile.get("statistics", {})
        wallets = profile.get("wallets", [])
        daily_tip = profile.get("dailyTip", {})
        recommendations = profile.get("recommendations", [])

        # ============================================
        # Wallets
        # ============================================

        wallets_text = ""

        if wallets:
            for wallet in wallets:
                wallets_text += f"""
• {wallet.get("name", "Sin nombre")}
  Balance: ${wallet.get("amount", 0):,.2f}
  Ingresos: ${wallet.get("totalIncome", 0):,.2f}
  Gastos: ${wallet.get("totalExpenses", 0):,.2f}

"""

        else:
            wallets_text = "No existen billeteras registradas."

        # ============================================
        # Largest Income
        # ============================================

        income = statistics.get("largestIncome")

        if income:
            largest_income = f"""
Monto: ${income.get("amount", 0):,.2f}
Categoría: {income.get("category", "")}
Descripción: {income.get("description", "")}
"""

        else:
            largest_income = "No existen ingresos registrados."

        # ============================================
        # Largest Expense
        # ============================================

        expense = statistics.get("largestExpense")

        if expense:
            largest_expense = f"""
Monto: ${expense.get("amount", 0):,.2f}
Categoría: {expense.get("category", "")}
Descripción: {expense.get("description", "")}
"""

        else:
            largest_expense = "No existen gastos registrados."

        # ============================================
        # Recommendations
        # ============================================

        recommendations_text = ""

        if recommendations:
            for recommendation in recommendations[:5]:
                recommendations_text += f"""
• {recommendation.get("recommendation", "")}
"""

        else:
            recommendations_text = "Sin recomendaciones previas."

        # ============================================
        # Context
        # ============================================

        return f"""
==============================
INFORMACIÓN DEL USUARIO
==============================

Nombre:
{user.get("name", "")}

==============================
RESUMEN FINANCIERO
==============================

Balance actual:
${summary.get("balance", 0):,.2f}

Ingresos:
${summary.get("income", 0):,.2f}

Gastos:
${summary.get("expenses", 0):,.2f}

Ahorro:
${summary.get("saving", 0):,.2f}

Porcentaje de ahorro:
{summary.get("savingRate", 0)} %


==============================
BILLETERAS
==============================

{wallets_text}


==============================
ESTADÍSTICAS
==============================

Mayor ingreso

{largest_income}

Mayor gasto

{largest_expense}

Categoría favorita

{statistics.get("favoriteCategory", "No disponible")}


==============================
CONSEJO DEL DÍA
==============================

{daily_tip.get("tip", "No disponible.")}


==============================
HISTORIAL DE RECOMENDACIONES
==============================

{recommendations_text}

"""
