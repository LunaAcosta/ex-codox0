from concurrent.futures import ThreadPoolExecutor, as_completed
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

    def build_finance_profile(self, uid: str):

        # Keep an early user existence check to avoid unnecessary work for invalid UIDs
        user = self.get_user(uid)

        if user is None:
            return {
                "user": None,
            }

        # Parallelize independent Firestore reads to reduce wall-clock latency
        fetchers = {
            "wallets": (self.get_wallets, uid),
            "transactions": (self.get_transactions, uid),
            "daily_tip": (self.get_daily_tip, uid),
            "recommendations": (self.get_recommendations, uid),
        }

        results = {}
        # Use a small thread pool suitable for IO-bound Firestore calls
        with ThreadPoolExecutor(max_workers=min(5, len(fetchers))) as executor:
            future_to_key = {
                executor.submit(func, arg): key
                for key, (func, arg) in fetchers.items()
            }

            for future in as_completed(future_to_key):
                key = future_to_key[future]
                try:
                    results[key] = future.result()
                except Exception:
                    # If a particular optional piece fails, fall back to empty/default
                    results[key] = [] if key in ("wallets", "transactions") else None

        wallets = results.get("wallets", []) or []
        transactions = results.get("transactions", []) or []
        daily_tip = results.get("daily_tip")
        recommendations = results.get("recommendations")

        # Aggregate wallet numbers locally (CPU-bound but trivial cost)
        income = 0.0
        expenses = 0.0
        balance = 0.0

        for wallet in wallets:
            try:
                income += float(wallet.get("totalIncome", 0) or 0)
            except Exception:
                pass
            try:
                expenses += float(wallet.get("totalExpenses", 0) or 0)
            except Exception:
                pass
            try:
                balance += float(wallet.get("amount", 0) or 0)
            except Exception:
                pass

        saving = income - expenses
        saving_rate = round((saving / income) * 100, 2) if income else 0

        statistics = StatisticsService(transactions).build()

        return {
            "user": user,
            "summary": {
                "balance": balance,
                "income": income,
                "expenses": expenses,
                "saving": saving,
                "savingRate": saving_rate,
            },
            "wallets": wallets,
            "transactions": transactions,
            "statistics": statistics,
            "dailyTip": daily_tip,
            "recommendations": recommendations,
        }


    # ============================================
    # IA
    # ============================================

    def generate_summary(self, uid: str):

        profile = self.build_finance_profile(uid)

        context = ContextBuilder.build(profile)

        return self.openai.generate_summary(context)
