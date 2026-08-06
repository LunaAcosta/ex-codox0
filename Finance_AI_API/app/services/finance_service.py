from app.services.context_builder import ContextBuilder
from app.services.openai_service import OpenAIService
from app.repositories.firebase_repository import FirebaseRepository
from app.services.statistics_service import StatisticsService


class FinanceService:
    def __init__(self):
        self.repository = FirebaseRepository()
        self.openai = OpenAIService()

    # ============================================
    # RESUMEN FINANCIERO
    # ============================================

    def calculate_balance(self, uid: str):
        wallets = self.repository.get_wallets(uid)
        return sum(wallet.get("amount", 0) for wallet in wallets)

    def calculate_income(self, uid: str):
        wallets = self.repository.get_wallets(uid)
        return sum(wallet.get("totalIncome", 0) for wallet in wallets)

    def calculate_expenses(self, uid: str):
        wallets = self.repository.get_wallets(uid)
        return sum(wallet.get("totalExpenses", 0) for wallet in wallets)

    def calculate_saving(self, uid: str):
        return self.calculate_income(uid) - self.calculate_expenses(uid)

    def calculate_saving_rate(self, uid: str):
        income = self.calculate_income(uid)

        if income == 0:
            return 0

        saving = self.calculate_saving(uid)

        return round((saving / income) * 100, 2)

    def get_financial_summary(self, uid: str):
        return {
            "balance": self.calculate_balance(uid),
            "income": self.calculate_income(uid),
            "expenses": self.calculate_expenses(uid),
            "saving": self.calculate_saving(uid),
            "savingRate": self.calculate_saving_rate(uid),
        }

    # ============================================
    # FIREBASE
    # ============================================

    def get_user(self, uid):
        return self.repository.get_user(uid)

    def get_users(self):
        return self.repository.get_users()

    def get_wallets(self, uid):
        return self.repository.get_wallets(uid)

    def get_transactions(self, uid):
        return self.repository.get_transactions(uid)

    def get_daily_tip(self, uid):
        return self.repository.get_daily_tip(uid)

    def get_recommendations(self, uid):
        return self.repository.get_recommendations(uid)

    # ============================================
    # ESTADÍSTICAS
    # ============================================

    def get_statistics(self, uid):
        transactions = self.get_transactions(uid)
        statistics = StatisticsService(transactions)
        return statistics.build()

    # ============================================
    # PERFIL COMPLETO
    # ============================================

    def build_finance_profile(self, uid):
        wallets = self.get_wallets(uid)
        transactions = self.get_transactions(uid)
        income = sum(float(wallet.get("totalIncome", 0) or 0) for wallet in wallets)
        expenses = sum(float(wallet.get("totalExpenses", 0) or 0) for wallet in wallets)
        saving = income - expenses
        return {
            "user": self.get_user(uid),
            "summary": {
                "balance": sum(float(wallet.get("amount", 0) or 0) for wallet in wallets),
                "income": income,
                "expenses": expenses,
                "saving": saving,
                "savingRate": round((saving / income) * 100, 2) if income else 0,
            },
            "wallets": wallets,
            "transactions": transactions,
            "statistics": StatisticsService(transactions).build(),
            "dailyTip": self.get_daily_tip(uid),
            "recommendations": self.get_recommendations(uid),
        }

    # ============================================
    # IA
    # ============================================

    def generate_summary(self, uid: str):

        profile = self.build_finance_profile(uid)

        context = ContextBuilder.build(profile)

        return self.openai.generate_summary(context)
